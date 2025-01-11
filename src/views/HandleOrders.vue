<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import CardTitle from '@/components/CardTitle.vue';
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import { clientOrdersHeadersSPE, supplierOrdersHeadersSPE } from '@/models/tableHeaders';
import dateConverter from '@/services/dateConverter';

import CreateClientOrder from '@/components/modals/CreateClientOrder.vue';
import CreateSupplierOrder from '@/components/modals/CreateSupplierOrder.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';

const selectedCompany = computed(() => { return sessionStore.getters.getSelectedCompany()})
const clientOrders = ref([])
const supplierOrders = ref([])
const loading = ref(false)
const selectedClientFilter = ref(null);
const commandNumberFilter = ref("");
const filterTimeout = ref(null); // Timeout reference for debouncing
const filteredClientOrders = ref([]); 
const loadingFiltering = ref(false)

function applyFilters() {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value); // Clear the previous timeout if it exists
  }

  if (!selectedClientFilter.value && !commandNumberFilter.value) {
    // Reset filteredClientOrders to the full clientOrders list if no filters are applied
    filteredClientOrders.value = [...clientOrders.value];
    loadingFiltering.value = false
    return;
  }

  loadingFiltering.value = true

  filterTimeout.value = setTimeout(() => {
    const filtered = clientOrders.value.filter(order => {
      const matchesClient = !selectedClientFilter.value || order.client_name === selectedClientFilter.value;
      const matchesCommandNumber = !commandNumberFilter.value || order.order_number.includes(commandNumberFilter.value);
      return matchesClient && matchesCommandNumber;
    });

    filteredClientOrders.value = filtered;
    loadingFiltering.value = false
  }, 500);
}

async function fetchClientOrders() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/client_orders_by_company`)
    clientOrders.value = response;
    applyFilters()
}

async function fetchSupplierOrders() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/supplier_orders_by_company`)
    supplierOrders.value = response;
}

async function refreshAllData() {
    loading.value = true
    loadingFiltering.value = true

    setTimeout(async() => {
        await fetchClientOrders()
        await fetchSupplierOrders()
        loading.value = false
        loadingFiltering.value = false
    }, 500);

}

watch([selectedClientFilter, commandNumberFilter], applyFilters);

watch(selectedCompany, async () => {
    await refreshAllData()
})

onMounted(async() => {
    selectedCompany.value = sessionStore.getters.getSelectedCompany()

    await refreshAllData()
})

</script>

<template>
    <SpinnLoader :loading="loading" />
    <div class="main-card">
        <div class="mt-3">
            <CreateClientOrder
                v-if="selectedCompany"
                :selected-company-id="selectedCompany.id"
                @refresh-client-orders="refreshAllData()"
                >
            </CreateClientOrder>
        </div>

        <div class="b1-container mt-3">
            <v-card style="padding: 0.4em">
                <v-card v-if="clientOrders && clientOrders.length > 0" style="margin: 0.4em;">
                    <div class="d-flex justify-space-between align-center">
                        <span class="informative-text">
                            <v-chip
                                class="mt-1"
                                variant="tonal"
                                color="secondary"
                            >
                                <v-icon start class="ml-0">mdi-sort</v-icon>
                                Filtrer par client et numéro de commande
                            </v-chip>
                        </span>
                        <span class="informative-text">
                            <v-chip
                                class="mt-1"
                                variant="tonal"
                                :color="selectedClientFilter || commandNumberFilter ? 'blue' : 'secondary'"
                            >
                                <v-icon start class="ml-0">mdi-file-document-outline</v-icon>
                                <span v-if="selectedClientFilter || commandNumberFilter">
                                    Résultats de la recherche : {{ filteredClientOrders.length }}
                                </span>
                                <span v-else>
                                    Commandes client en cours : {{ clientOrders.length }}
                                </span>
                            </v-chip>
                        </span>
                    </div>

                    <div class="d-flex ml-4 mt-1 mr-4 justify-lg-space-between" style="margin-bottom: -16px; align-items: center;">
                        <div class="d-flex align-center">
                            <v-select
                                v-model="selectedClientFilter"
                                clearable
                                prepend-icon="mdi-account-outline"
                                label="Filtre client"
                                :items="[...new Set(clientOrders.map(order => order.client_name))]"
                                variant="underlined"
                                class="mr-2"
                                style="max-width: 16vw; min-width: 12vw;"
                            >
                                <template v-slot:selection="{ item }">
                                    <v-chip class="pa-3 ma-1" variant="elevated" color="blue">
                                        <v-icon class="mr-1">mdi-account-group</v-icon>
                                        {{ item.title }}
                                    </v-chip>
                                </template>
                            </v-select>

                            <v-text-field
                                v-model="commandNumberFilter"
                                clearable
                                prepend-icon="mdi-file-document-outline"
                                label="Filtre numéro de commande"
                                variant="underlined"
                                class="mr-2"
                                style="max-width: 16vw; min-width: 12vw;"
                            />
                        </div>
                        
                        <v-btn
                            class="no-effects"
                            icon
                            size="16"
                            @click="selectedClientFilter = null; commandNumberFilter = '';"
                        >
                            <v-icon color="secondary">mdi-refresh</v-icon>
                        </v-btn>
                    </div>
                </v-card>
   
                <v-data-table
                    :loading="loadingFiltering"
                    loading-text="Recherche des pièces..."
                    density="compact"
                    :items="filteredClientOrders"
                    :headers="clientOrdersHeadersSPE"
                    no-data-text="Aucune commande client enregistrée"
                >
                <template v-slot:item.client_name="{ item }">
                    <v-chip variant="outlined">
                        <v-icon class="mr-1">mdi-account-outline</v-icon>
                        {{ item.client_name }}
                    </v-chip>
                </template>
                <template v-slot:item.order_number="{ item }">
                    <v-chip variant="elevated" color="blue">                
                        <v-icon class="mr-1">mdi-file-document-outline</v-icon>
                        {{ item.order_number }}
                    </v-chip>
                </template>
                <template v-slot:item.reference_and_designation="{ item }">
                    <v-chip variant="outlined">
                        <v-icon class="mr-1">mdi-cog-outline</v-icon>
                        {{ item.reference_and_designation }}
                    </v-chip>
                </template>
                <template v-slot:item.quantity="{ item }">
                    <v-chip variant="elevated">
                        <v-icon color="success" class="mr-1">mdi-package-variant-closed-check</v-icon>
                        {{ item.quantity }}
                    </v-chip>
                </template>
                <template v-slot:item.price="{ item }">
                    <v-chip variant="tonal" color="blue">
                        {{ item.price ? item.price.toFixed(2) + ' €' : 'n/a' }}
                    </v-chip>
                </template>
                <template v-slot:item.delivery_date="{ item }">
                        {{ new Date(item.delivery_date).toLocaleDateString()  }}
                </template>
                <template v-slot:item.actions="{ item }">
                    <div class="actions-slot">
                    
                    </div>
                </template>
                </v-data-table>
            </v-card>

        </div>

        <div class="mt-2 mb-2">
            <CreateSupplierOrder
                v-if="selectedCompany"
                :selected-company-id="selectedCompany.id"
                @refresh-supplier-orders="refreshAllData()"
            />
        </div>

        <div class="b1-container mb-3">
            <v-card style="padding:0.4em">
                <CardTitle
                    title="Gestion des commandes fournisseur"
                    icon="mdi-package-variant"
                />
                <v-data-table
                    :loading="loading"
                    density="compact"
                    :items="supplierOrders"
                    :headers="supplierOrdersHeadersSPE"
                    no-data-text="Aucune commande fournisseur enregistrée"
                >
                    <template v-slot:item.supplier_name="{ item }">
                        <v-chip variant="outlined">
                            <v-icon class="mr-1">mdi-account-outline</v-icon>
                            {{ item.supplier_name }}
                        </v-chip>
                    </template>
                    <template v-slot:item.order_number="{ item }">
                        <v-chip variant="elevated" color="blue">
                            <v-icon class="mr-1">mdi-file-document-outline</v-icon>
                            {{ item.order_number }}
                        </v-chip>
                    </template>
                    <template v-slot:item.reference_and_designation="{ item }">
                        <v-chip variant="outlined">
                            <v-icon class="mr-1">mdi-cog-outline</v-icon>
                            {{ item.reference_and_designation }}
                        </v-chip>
                    </template>
                    <template v-slot:item.quantity="{ item }">
                        <v-chip variant="elevated">
                            <v-icon color="success" class="mr-1">mdi-package-variant-closed-check</v-icon>
                            {{ item.quantity }}
                        </v-chip>
                    </template>
                    <template v-slot:item.price="{ item }">
                        <v-chip variant="tonal" color="blue">
                            {{ item.price ? item.price.toFixed(2) + ' €' : 'n/a' }}
                        </v-chip>
                    </template>
                    <template v-slot:item.delivery_date="{ item }">
                        {{ new Date(item.delivery_date).toLocaleDateString()  }}
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <div class="actions-slot">
                        
                        </div>
                    </template>
                </v-data-table>
            </v-card>
            
        </div>
    </div>
</template>