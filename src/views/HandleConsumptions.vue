<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import apiCaller from '@/services/apiCaller';
import dateConverter from '@/services/dateConverter';
import sessionStore from '@/stores/sessionStore';
import { globalConsumptionHeaders, passedConsumptionHeaders } from '@/models/tableHeaders';
import CardTitle from '@/components/CardTitle.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';
import Popup from '@/components/Popup.vue';

const loading = ref(false)
const consumptionRows = ref([])
const parts = ref([])
const number =ref(null)
const beginDate = ref(dateConverter.formatISODate(new Date()))
const endDate = ref(dateConverter.formatISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)))
const selectedCompany = computed(() => {
  return sessionStore.getters.getSelectedCompany()
})
const refreshTrigger = computed(() => { return sessionStore.getters.getRefreshTrigger })
const selectedRows = ref([])
const isModalOpen = ref(false);

const clients = ref([])
const clientsListDisplayed = ref([])
const selectedClient = ref(null)

const stocks = ref([])
const stocksListDisplayed = ref([])
const selectedStock = ref(null)
const passedConsumptions = ref([])

// For popups
const snackbarVisible = ref(false);
const snackbarMessage = ref('');
const snackbarType = ref('');

const deleteRow = (index) => {
    consumptionRows.value.splice(index, 1);
};

function triggerSnackbar(message, type) {
  snackbarMessage.value = message;
  snackbarType.value = type;
  snackbarVisible.value = true;
}

async function fetchParts() {
    const stock = stocks.value.find(stock => stock.address === selectedStock.value)
    const clientId = clients.value.find(client => client.name === selectedClient.value).id
    if (stock && clientId) {
        const response = await apiCaller.get(`companies/${selectedCompany.value.id}/clients/${clientId}/consignment_stocks/${stock.id}/parts_by_client_and_consignment_stock`);
        parts.value = response;
    }
}

async function fetchConsumptions() {
    const stock = stocks.value.find(stock => stock.address === selectedStock.value)
    const clientId = clients.value.find(client => client.name === selectedClient.value).id
    if (stock && clientId) {
        const response = await apiCaller.get(`clients/${clientId}/consignment_stocks/${stock.id}/consumptions_by_consignment_stock`);
        passedConsumptions.value = response;
    }
}

async function fetchClients() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/clients`);
    clients.value = response;
    clientsListDisplayed.value = response.map(client => client.name)
}

async function fetchStocks() {
    const clientId = clients.value.find(client => client.name === selectedClient.value)?.id
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/clients/${clientId}/fetch_consignment_stocks_by_client`);
    stocks.value = response;
    stocksListDisplayed.value = response.map(stock => stock.address)
}

async function submitConsumption() {
    const stock = stocks.value.find(stock => stock.address === selectedStock.value)

    const payload = {
        consignment_stock_id: stock.id,
        begin_date: beginDate.value,
        end_date: endDate.value,
        number: number.value,
        consignment_consumptions: consumptionRows.value.map(row => ({
            part_id: parts.value.find(p => `${p.reference} ${p.designation}` === row.part_reference)?.id,
            quantity: row.quantity,
            price: row.price
        }))
    }

    const response = await apiCaller.post(`companies/${selectedCompany.value.id}/consignment_stocks/${stock.id}/create_consignment_consumption`, payload, true)
    console.log(response);
    
    if (response.status === "ok") {
        triggerSnackbar('Consommation enregistrée', 'success')
        resetData()
    }
}

function resetData() {
    selectedRows.value = []
    consumptionRows.value = []
    selectedStock.value = null
    selectedClient.value = null
    passedConsumptions.value = []
}

function handleClientChange() {
    consumptionRows.value = []
    selectedStock.value = null
    fetchStocks()
}

async function handleStockChange() {
    consumptionRows.value = []
    await fetchParts()
    await fetchConsumptions()
    consumptionRows.value = parts.value.map(part => ({
            part_reference: `${part.reference} ${part.designation}`,
            current_quantity: part.current_quantity,
            quantity: 0,
            price: 0,
            latest_client_order_price: part.latest_client_order_price
        }));
    selectedRows.value = []
}

watch(() => selectedCompany.value, // Watching the computed value's reactive property
    async (newCompany, oldCompany) => {
        if (newCompany && newCompany.id !== oldCompany?.id) {
            resetData()
            await fetchClients(); // Trigger refresh on change
        }
    }
);

async function refreshData() {
    loading.value =  true

    setTimeout(async() => {
        await fetchClients()
        loading.value = false;
    }, 300);
}

watch(refreshTrigger, async() => {
  await refreshData()
})

onMounted(async() => {
    sessionStore.actions.initializeAuthState(); 
    selectedCompany.value = sessionStore.getters.getSelectedCompany()

    await refreshData()
})
</script>

<template>
    <Popup
        :alertText="snackbarMessage"
        :snackbar="snackbarVisible"
        :alertType="snackbarType"
        @updateSnackbar="(value) => (snackbarVisible = value)"
    />
    <SpinnLoader :loading="loading" />
    <div class="main-card mt-6 mb-6">
        <v-card class="b1-container mt-3 mb-3">
            <CardTitle
                title="Enregistrer des consommations en stock consignation client"
                icon="mdi-cart-check"
            />
            <v-divider style="margin: 0em 1em;" class="mb-2"></v-divider>

            <span class="informative-text" v-show="!selectedClient || !selectedStock">
                <span v-if="!selectedClient">
                    <v-icon class="mr-1" color='success'>mdi-information-outline</v-icon>
                    Sélectionnez d'abord un client pour gérer les consommations
                </span>
                <span v-else-if="!selectedStock">
                    <v-icon class="mr-1" color='success'>mdi-information-outline</v-icon>
                    Sélectionnez ensuite l'adresse du stock concerné par les consommations
                </span>
            </span>

            <div class="b1-container pr-4 pl-4" style="margin-bottom: -1.6em;">
                <v-row>
                    <v-col cols="4" md="5">
                        <v-select
                            v-model="selectedClient"
                            :items="clientsListDisplayed"
                            label="Client"
                            density="compact"
                            variant="underlined"
                            class="mt-2"
                            clearable
                            @update:model-value="handleClientChange()"
                        >
                            <template v-slot:selection="{ item }">
                                <v-chip class="pa-3 ma-1" variant="elevated" color="blue">
                                    <v-icon class="mr-1">mdi-account-group</v-icon>
                                    {{ item.title }}
                                </v-chip>
                            </template>
                        </v-select>
                    </v-col>
                    <v-col cols="4" md="5">
                        <v-select
                            :disabled="!selectedClient"
                            v-model="selectedStock"
                            :items="stocksListDisplayed"
                            clearable
                            label="Stock"
                            density="compact"
                            variant="underlined"
                            class="mt-2"
                            @update:model-value="handleStockChange()"
                        >
                            <template v-slot:selection="{ item }">
                                <v-chip class="pa-3 ma-1" variant="elevated" color="orange">
                                    <v-icon class="mr-1">mdi-account-group</v-icon>
                                    {{ item.title }}
                                </v-chip>
                            </template>
                        </v-select>    
                    </v-col>
                </v-row>
            </div>

            <v-card v-if="selectedStock && selectedClient && consumptionRows.length > 0" class="mt-4">
                <div class="d-flex align-center justify-lg-space-between mr-4">
                    <CardTitle
                        title="Sélectionnez les références consommées"
                        icon="mdi-barcode-scan"
                    />
                    <v-dialog v-model="isModalOpen" class="dialog-width">
                        <template v-slot:activator="{ props: activatorProps }">
                            <v-chip
                                v-bind="activatorProps"
                                v-if="selectedStock && passedConsumptions"
                                variant="elevated"
                                color="blue"
                            >
                                <v-icon class="mr-2">mdi-history</v-icon>
                                Voir l'historique des consommations
                            </v-chip>
                        </template>

                        <v-card v-if="selectedStock && passedConsumptions">
                            <CardTitle 
                                :title="`Historique des consommations du ${selectedStock}`"
                                icon="mdi-cube-scan"
                            />
                            <v-data-table
                                :headers="passedConsumptionHeaders"
                                :items="passedConsumptions"
                                items-per-page="10"
                            >
                                <template v-slot:item.number="{ item }">
                                    <v-chip variant="elevated" color="white">
                                        <v-icon class="mr-1">mdi-barcode</v-icon>
                                        {{ item.number }}
                                    </v-chip>
                                </template>

                                <template v-slot:item.begin_date="{ item }">
                                    <v-chip variant="text">
                                        <v-icon class="mr-1">mdi-calendar-start</v-icon>
                                        {{ new Date(item.begin_date).toLocaleDateString() }}
                                    </v-chip>
                                </template>

                                <template v-slot:item.end_date="{ item }">
                                    <v-chip variant="text">
                                        <v-icon class="mr-1">mdi-calendar-end</v-icon>
                                        {{ new Date(item.end_date).toLocaleDateString() }}
                                    </v-chip>
                                </template>

                                <template v-slot:item.parts="{ item }">
                                    <v-chip-group column>
                                        <v-chip
                                            v-for="part in item.parts"
                                            :key="part.part_id"
                                            variant="text"
                                            color="indigo"
                                        >
                                            <v-icon class="mr-1">mdi-cube-outline</v-icon>
                                            {{ part.part_reference }} - {{ part.part_designation }}
                                        </v-chip>
                                    </v-chip-group>
                                </template>

                                <template v-slot:item.total_quantity="{ item }">
                                    <v-chip variant="elevated" color="white">
                                        <v-icon class="mr-1">mdi-package-variant</v-icon>
                                        {{ item.parts.reduce((sum, part) => sum + part.quantity, 0) }}
                                    </v-chip>
                                </template>

                                <template v-slot:item.total_price="{ item }">
                                    <v-chip variant="elevated" color="white">
                                        <v-icon class="mr-1">mdi-cash</v-icon>
                                        {{
                                            item.parts.reduce((sum, part) => sum + part.quantity * part.price, 0).toFixed(2)
                                        }} €
                                    </v-chip>
                                </template>
                            </v-data-table>

                            <v-card-actions>
                                <v-spacer></v-spacer>
                                    <v-btn variant="elevated" color="red" @click="isModalOpen = false"/>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>
                </div>
                <v-card class="ma-2">
                    <v-divider class="mb-2"/>
                    <span v-if="!number || !beginDate || !endDate" class="informative-text">
                        <v-icon class="mr-1" color='success'>mdi-information-outline</v-icon>
                        Renseignez le numéro de commande et la période de consommation
                    </span>
                <v-row align="d-flex align-center pa-4" style="margin-bottom: -2em;" dense>
                    <v-col cols="4">
                        <v-text-field
                            class="mr-2"
                            v-model="number"
                            label="Numéro de commande"
                            variant="underlined"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="3">
                        <v-text-field
                            v-model="beginDate"
                            label="Date de début de consommation"
                            type="date"
                            variant="underlined"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="3">
                        <v-text-field
                            v-model="endDate"
                            label="Date de fin de consommation"
                            type="date"
                            variant="underlined"
                        ></v-text-field>
                        </v-col>
                    </v-row>
                </v-card>

                <v-data-table
                    v-model="selectedRows"
                    :headers="globalConsumptionHeaders"
                    :items="consumptionRows"
                    show-select
                    item-value="part_reference"
                >
                    <template v-slot:item.reference="{ item }">
                        {{ item.part_reference }}
                    </template>
                    <template v-slot:item.latest_client_order_price="{ item }">
                        <v-chip variant="outlined" color="blue">
                            {{ item.latest_client_order_price ? item.latest_client_order_price : "Pas de donnée" }}
                        </v-chip>
                    </template>
                    <template v-slot:item.current_quantity="{ item }">
                        <v-chip
                            v-if="item.current_quantity > 0"
                            variant="text"
                        >
                            <v-icon class="mr-1" color="orange">mdi-package-variant-closed</v-icon>
                            {{ item.current_quantity }}
                        </v-chip>
                    </template>

                    <template v-slot:item.quantity="{ item }">
                        <v-text-field
                            v-model="item.quantity"
                            type="number"
                            variant="underlined"
                            density="compact"
                            hide-details
                        ></v-text-field>
                    </template>

                    <template v-slot:item.price="{ item }">
                        <v-text-field
                            v-model="item.price"
                            type="number"
                            variant="underlined"
                            density="compact"
                            hide-details
                        ></v-text-field>
                    </template>

                    <template v-slot:item.actions="{ item }">
                        <v-btn
                            icon
                            size="small"
                            @click="deleteRow(consumptionRows.indexOf(item))"
                        >
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                </v-data-table>
            </v-card>

            <v-chip
                v-if="consumptionRows.length === 0 && selectedStock && selectedClient"
                variant="tonal"
                color="secondary"
                class="ma-4 d-flex align-center"
                style="width: fit-content;"
            >
                <v-icon class="mr-1">mdi-help-circle-outline</v-icon>
                Pas de positions enregistrées au <strong class="ml-1">{{ `${selectedStock}` }}</strong>
            </v-chip>

            <v-chip
                v-if="!selectedStock || !selectedClient"
                variant="tonal"
                color="blue"
                class="d-flex align-center justify-center ma-4"
                style="width: fit-content;"
            >
                <v-icon class="mr-1">mdi-information-outline</v-icon>
                Renseignez les champs pour pouvoir enregistrer les consommations
            </v-chip>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                    color="success"
                    variant="elevated"
                    :disabled="selectedRows.length === 0"
                    @click="submitConsumption"
                >
                    Enregistrer
                </v-btn>  
            </v-card-actions> 
        </v-card>

    </div>
</template>

<style scoped lang="scss">
@import "../assets/main.scss";

</style>