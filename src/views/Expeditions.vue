<script setup>
// Vue essentials
import { computed, onMounted, ref, watch } from 'vue'

// Services & stores
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';

// Components & constant data
import { expeditionsIndexHeaders, deliveredExpeditionsHeaders } from '@/models/tableHeaders'
import DispatchExpedition from '@/components/modals/DispatchExpedition.vue';
import CreateExpedition from '@/components/modals/CreateExpedition.vue';
import ExpeditionDetails from '@/components/modals/ExpeditionDetails.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';

// Internal component logic
const selectedCompany = computed(() => { return sessionStore.getters.getSelectedCompany()})
const runningExpeditions = ref(null)
const deliveredExpeditions = ref(null)
const suppliers = ref([])
const loading = ref(false)
const tab = ref(null)

async function fetchSuppliers() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/suppliers`)
    suppliers.value = response
}

async function fetchUndeliveredExpeditions() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/undelivered_expeditions`) 
    runningExpeditions.value = response
}

async function fetchDeliveredExpeditions() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/delivered_expeditions`) 
    deliveredExpeditions.value = response
}

function expeditionStatus(status) {
    if (status === 'undelivered') {
        return 'En transit'
    } else if (status === 'delivered') {
        return 'Arrivé au port'
    }
}

async function refreshExpeditions() {
    loading.value = true;

    setTimeout(async() => {
        await fetchUndeliveredExpeditions()
        await fetchDeliveredExpeditions()
        await fetchSuppliers()
        loading.value = false;
    }, 300);
}

watch(selectedCompany, () => {
    refreshExpeditions()
})

onMounted(async() => {
    sessionStore.actions.initializeAuthState()
    selectedCompany.value = sessionStore.getters.getSelectedCompany();

    await refreshExpeditions()
})

</script>

<template>
    <SpinnLoader :loading="loading" />
    <v-card class="main-card mt-6 mb-6">
        <v-card class="b1-container d-flex align-center justify-center" variant="elevated">
            <v-tabs
            v-model="tab"
            >
            <v-tab value="one">
                <v-icon start class="mr-2">mdi-view-dashboard</v-icon>
                Expéditions en cours
            </v-tab>
            <v-tab value="two">
                <v-icon start class="mr-2">mdi-chart-box</v-icon>
                Expéditions terminées
            </v-tab>
            </v-tabs>
        </v-card>
        
        <v-tabs-window v-model="tab">
            <v-tabs-window-item value="one">
                <v-card class="b1-container mt-3">
            <div class="d-flex align-center justify-center ml-3 mt-2 mb-2 mr-3">
                <CreateExpedition
                    v-if="selectedCompany && suppliers && suppliers.length > 0"
                    origin="single"
                    :selected-company-id="selectedCompany.id"
                    :suppliers="suppliers"
                    @refresh-expeditions="refreshExpeditions()"
                />
            </div>
            
            <v-data-table
                v-if="runningExpeditions && runningExpeditions.length > 0"
                :headers="expeditionsIndexHeaders"
                :items="runningExpeditions || []"
                density="dense"
                :loading="loading"
            >
                <template v-slot:item.real_departure_time="{ item }">
                    {{ new Date(item.real_departure_time).toLocaleDateString() }}
                </template>
                <template v-slot:item.number="{ item }">
                    <v-chip
                        variant="elevated"
                        color="white"
                    >
                    <v-icon class="mr-1">mdi-list-box-outline</v-icon>
                    {{ item.number }}
                    </v-chip>
                </template>
                <template v-slot:item.estimated_arrival_time="{ item }">
                    {{ item.estimated_arrival_time ? new Date(item.estimated_arrival_time).toLocaleDateString() : 'Pas de donnée' }}
                </template>
                <template v-slot:item.status="{ item }">
                    <v-chip variant="text" style="margin: 0.2em 0em">
                        <v-icon :color="item.status === 'undelivered' ? 'blue' : 'success'" class="mr-2">mdi-ferry</v-icon>
                        {{ expeditionStatus(item.status) }}
                    </v-chip>
                </template>
                <template v-slot:item.supplier_names="{ item }">
                    <div class="d-flex flex-wrap">
                        <v-chip
                            v-for="(supplier, index) in item.supplier_names"
                            :key="index"
                            variant="text"
                            class="mr-1"
                        >
                            <v-icon class="mr-1">mdi-account-outline</v-icon>
                            {{ supplier }}
                        </v-chip>
                    </div>
                </template>
                <template v-slot:item.actions="{ item }">
                <div class="actions-slot">
                    <DispatchExpedition 
                        v-if="selectedCompany && item"
                        :selected-company-id="selectedCompany.id"
                        :expedition="item"
                        @refresh-expeditions="refreshExpeditions()"
                    />
                    <ExpeditionDetails
                        origin="undelivered"
                        :selected-company-id="selectedCompany.id"
                        :expedition="item"
                    /> 
                </div>
                </template>
            </v-data-table>
            <div v-else class="d-flex flex-wrap align-items-center">
              <v-chip
                class="ma-1 mt-2 mb-2 ml-4"
                style="width: fit-content;"
                variant="text"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-backspace-reverse-outline</v-icon>
                <span class="mr-1">Aucune expédition en cours</span>
              </v-chip>
            </div>
        </v-card>
            </v-tabs-window-item>

            <v-tabs-window-item value="two">
                <v-card class="b1-container mb-3">
            <v-data-table
                :loading="loading"
                v-if="deliveredExpeditions && deliveredExpeditions.length > 0"
                no-data-text="Aucune expédition passée enregsitrée"
                :headers="deliveredExpeditionsHeaders"
                :items="deliveredExpeditions || []"
                density="dense"
            >
                <template v-slot:item.real_departure_time="{ item }">
                    {{ new Date(item.real_departure_time).toLocaleDateString() }}
                </template>
                <template v-slot:item.arrival_time="{ item }">
                    {{ new Date(item.arrival_time).toLocaleDateString() }}
                </template>
                <template v-slot:item.status="{ item }">
                    <v-chip variant="text" style="margin: 0.2em 0em" outlined>
                        <v-icon color="success" style="margin-right: 4px;" left>mdi-check-circle-outline</v-icon>
                        {{ expeditionStatus(item.status) }}
                    </v-chip>
                </template>
                <template v-slot:item.supplier_names="{ item }">
                    <div class="d-flex flex-wrap">
                        <v-chip
                            v-for="(supplier, index) in item.supplier_names"
                            :key="index"
                            variant="text"
                            class="mr-1"
                        >
                            <v-icon class="mr-1">mdi-account-outline</v-icon>
                            {{ supplier }}
                        </v-chip>
                    </div>
                </template>
                <template v-slot:item.actions="{ item }">
                    <ExpeditionDetails
                        origin="delivered"
                        :selected-company-id="selectedCompany.id"
                        :expedition="item"
                    />
                </template>
            </v-data-table>
            <div v-else class="d-flex flex-wrap align-items-center">
              <v-chip
                class="ma-1 mt-2 mb-2 ml-4"
                style="width: fit-content;"
                variant="text"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-backspace-reverse-outline</v-icon>
                <span class="mr-1" >Aucune expédition terminée</span>
              </v-chip>
            </div>
        </v-card>
            </v-tabs-window-item>
        </v-tabs-window>
        


    </v-card>
</template>

<style scoped lang="scss">
@import url(../assets/main.scss);

.spacer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-top: 0.4em;
}
</style>