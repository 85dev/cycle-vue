<script setup>
// Services
import { ref, onMounted, watch, computed } from 'vue'
import sessionStore from '@/stores/sessionStore';
import { partHeaders, stockHeaders } from '@/models/tableHeaders';
import { useRouter } from 'vue-router';

// Components
import apiCaller from '@/services/apiCaller';
import DeletePart from '@/components/modals/DeletePart.vue';
import CreatePart from '@/components/modals/CreatePart.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';
import CardTitle from '@/components/CardTitle.vue';

const userParts = ref(null)
const stockParts = ref(null)
const filteredParts = ref(null)
const filteredStockParts = ref(null)
const suppliers = ref(null)
const refreshTrigger = computed(() => { return sessionStore.getters.getRefreshTrigger })
const selectedCompany = computed(() => sessionStore.getters.getSelectedCompany())
const router = useRouter();
const loading = ref(false)
const clients = ref([])
const tab = ref(null)

// For filtering purposes
const searchKeyword = ref(null)
const selectedClient = ref(null)
const selectedSupplier = ref(null)


function routeToPart(event, { item }) {
    router.push({ name: "PartRelatedData", params: { id: item.id } });
}

async function fetchParts() {
    try {
        const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts`);
        userParts.value = response;
        filteredParts.value = response;
    } catch (error) {
        console.error("Error fetching parts:", error);
    }
}

async function fetchStockParts() {
    try {
        const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts_stocks`);
        stockParts.value = response;
        filteredStockParts.value = response;
    } catch (error) {
        console.error("Error fetching stock parts:", error);
    }
}

async function fetchSuppliers() {
    try {
        const response = await apiCaller.get(`companies/${selectedCompany.value.id}/suppliers`);
        suppliers.value = response;
    } catch (error) {
        console.error("Error fetching stock parts:", error);
    }
}

// Fetch clients (for filtering in General Catalog)
async function fetchClients() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/clients`);
    clients.value = response;
}

watch([selectedClient, searchKeyword, selectedSupplier], applyFilters);

function applyFilters() {
    const keyword = searchKeyword.value ? searchKeyword.value.toLowerCase() : null;
    const supplier = selectedSupplier.value;
    const client = selectedClient.value;

    filteredParts.value = userParts.value.filter(part => {
        return (
            (!client || part.client_name === client) &&
            (!keyword || (part.designation && part.designation.toLowerCase().includes(keyword)) || 
                        (part.reference && part.reference.toLowerCase().includes(keyword))) &&
            (!supplier || (Array.isArray(part.supplier_ids) && part.supplier_ids.includes(supplier)))
        );
    });

    filteredStockParts.value = stockParts.value.filter(part => {
        return (
            (!client || part.client_name === client) &&
            (!keyword || (part.reference_and_designation && part.reference_and_designation.toLowerCase().includes(keyword))) &&
            (!supplier || (Array.isArray(part.supplier_ids) && part.supplier_ids.includes(supplier)))
        );
    });
}

watch(selectedCompany, async (newCompany, oldCompany) => {
  if (newCompany?.id !== oldCompany?.id) {
    await refreshAllData();
  }
});

watch(refreshTrigger.value, async() => {
  await refreshAllData()
})

async function refreshAllData() {
    loading.value = true

    setTimeout(async() => {
        await fetchSuppliers();
        await fetchParts();
        await fetchStockParts();
        await fetchClients();
        loading.value = false
    }, 500);
}

onMounted(async () => {
    sessionStore.actions.initializeAuthState();
    selectedCompany.value = sessionStore.getters.getSelectedCompany();

    if (selectedCompany.value) {
        await refreshAllData()
    }
});
</script>

<template>
    <SpinnLoader :loading="loading" />
    <div class="main-card mt-6 mb-6">
        <v-card class="b1-container d-flex align-center justify-center" variant="elevated">
          <v-tabs v-model="tab">
            <v-tab value="one">
              <v-icon start class="mr-2">mdi-view-dashboard</v-icon>
              Catalogue des pièces
            </v-tab>
            <v-tab value="two">
              <v-icon start class="mr-2">mdi-warehouse</v-icon>
              Stocks & Disponibilités
            </v-tab>
          </v-tabs>
        </v-card>

        <v-card class="b1-container">
                    <div class="d-flex align-center justify-lg-space-between">
                        <CardTitle 
                            title="Filtres de recherche"
                            icon="mdi-sort"
                        />
                        <div class="mr-3 mb-5">
                            <CreatePart origin="single" @refresh-parts="refreshAllData()" />
                        </div>
                    </div>
                    <v-row style="width: 100%; margin-top: -8px;">
                        <v-col cols="4">
                            <v-text-field
                                class="ml-4"
                                variant="solo"
                                prepend-icon="mdi-magnify"
                                label="Recherchez une pièce..."
                                clearable
                                v-model="searchKeyword"
                            />
                        </v-col>
                        <v-col cols="4">
                            <v-select
                                v-if="suppliers"
                                prepend-icon="mdi-factory"
                                variant="solo"
                                :items="suppliers.map(supplier => ({ title: supplier.name, value: supplier.id })) || []"
                                label="Filtrez par fournisseur"
                                clearable
                                v-model="selectedSupplier"
                            />
                        </v-col>
                        <v-col cols="4">
                            <v-select
                                prepend-icon="mdi-account-outline"
                                variant="solo"
                                :items="clients.map(cl => cl.name) || []"
                                label="Filtrez par client"
                                clearable
                                v-model="selectedClient"
                            />
                        </v-col>
                    </v-row>
                </v-card>

        <v-tabs-window v-model="tab">
            <!-- 🟢 General Parts Catalog -->
            <v-tabs-window-item value="one">
                <v-card class="b1-container" style="margin-top: 0.8em;">
                    <v-data-table
                        :loading="loading"
                        density="compact"
                        hover
                        no-data-text="Aucune pièce enregistrée"
                        :headers="partHeaders"
                        :items="filteredParts || []"
                        @click:row="routeToPart"
                    >
                    <template v-slot:item.reference="{ item }">
                        <v-chip variant="elevated" color="white">
                            <v-icon class="mr-1">mdi-barcode-scan</v-icon>
                            {{ item.reference + ' ' + item.designation }}
                        </v-chip>
                    </template>
                    <template v-slot:item.material="{ item }">
                        <v-chip variant="text">
                            <v-icon class="mr-1">mdi-cube-scan</v-icon>
                            {{ item.material }}
                        </v-chip>
                    </template>
                    <template v-slot:item.drawing="{ item }">
                        <v-chip variant="text">
                            {{ item.drawing }}
                        </v-chip>
                    </template>
                    <template v-slot:item.latest_supplier_price="{ item }">
                        <v-chip
                            v-if="item.latest_supplier_price"
                            variant="outlined"
                            color="blue"
                        >
                            {{ item.latest_supplier_price }}
                        </v-chip>
                        <v-chip variant="tonal" color="secondary" v-else>
                            <v-icon>mdi-help-circle-outline</v-icon>
                        </v-chip>
                    </template>
                    <template v-slot:item.latest_client_price="{ item }">
                        <v-chip
                            v-if="item.latest_client_price"
                            class="index-slot"
                            variant="outlined"
                            color="blue"
                        >
                            {{ item.latest_client_price }}
                        </v-chip>
                        <v-chip variant="tonal" color="secondary" v-else>
                            <v-icon>mdi-help-circle-outline</v-icon>
                        </v-chip>
                    </template>
                    <template v-slot:item.urgencies="{ item }">
                        <div class="actions-slot">
                            <v-chip
                                v-if="item.unsorted_positions_count > 0"
                                class="index-slot"
                                variant="elevated"
                                color="red"
                                style="margin-right: 0.6em; font-weight: 600;"
                            >
                                <v-icon start class="ml-1">mdi-gesture-spread</v-icon>
                                <span class="mr-1">Position à répartir</span>
                            </v-chip>
                            <v-chip
                                v-else
                                class="index-slot"
                                variant="outlined"
                                color="success"
                                style="font-weight: 500;"
                            >
                                <v-icon>mdi-check-circle-outline</v-icon>
                            </v-chip>
                        </div>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <div class="actions-slot">
                            <DeletePart
                                v-if="selectedCompany && item"
                                :selected-company-id="selectedCompany.id"
                                :part-id="item.id"
                                :designation="item.designation"
                                :reference="item.reference"
                                @refresh-parts="refreshAllData()"
                            />
                            <td class="arrow-cell">
                                <v-icon class="hover-arrow ml-2">mdi-chevron-right</v-icon>
                            </td>
                        </div>  
                    </template>
                    </v-data-table>
                </v-card>
            </v-tabs-window-item>

            <v-tabs-window-item value="two">
                <v-card class="b1-container" style="margin-top: 0.8em;">
                    <v-data-table
                        :loading="loading"
                        density="comfortable"
                        hover
                        no-data-text="Aucune pièce ou aucun stock enregistré"
                        :headers="stockHeaders"
                        :items="filteredStockParts || []"
                        @click:row="routeToPart"
                    >
                    <template v-slot:item.reference_and_designation="{ item }">
                        <v-chip variant="elevated" color="white">
                            <v-icon class="mr-1">mdi-barcode-scan</v-icon>
                            {{ item.reference_and_designation }}
                        </v-chip>
                    </template>
                    <template v-slot:item.consignment_stock="{ item }">
                        <v-chip
                            variant="text"
                            :color="item.consignment_stock >= 0 ? 'dark' : 'warning'"
                        >
                            <v-icon class="mr-1">mdi-package-variant-closed</v-icon>
                            {{ item.consignment_stock }}
                        </v-chip>
                    </template>

                    <template v-slot:item.subcontractor_stock="{ item }">
                        <v-chip
                            variant="text"
                            :color="item.subcontractor_stock >= 0 ? 'dark' : 'warning'"
                        >
                        <v-icon class="mr-1">mdi-package-variant-closed</v-icon>
                            {{ item.subcontractor_stock }}
                        </v-chip>
                    </template>

                    <template v-slot:item.logistic_place_stock="{ item }">
                        <v-chip
                            variant="text"
                            :color="item.logistic_place_stock >= 0 ? 'dark' : 'warning'"
                        >
                        <v-icon class="mr-1">mdi-package-variant-closed</v-icon>
                            {{ item.logistic_place_stock }}
                        </v-chip>
                    </template>

                    <template v-slot:item.total_current_stock="{ item }">
                        <v-chip
                            variant="elevated"
                            :color="item.total_current_stock >= 0 ? 'white' : 'warning'"
                        >
                        <v-icon class="mr-1">mdi-package-variant-closed</v-icon>
                            {{ item.total_current_stock }}
                        </v-chip>
                    </template>

                    <template v-slot:item.reserved_stock="{ item }">
                        <v-chip
                            variant="text"
                        >
                            <v-icon class="mr-1">mdi-package-variant-closed</v-icon>
                            {{ item.reserved_stock }}
                        </v-chip>
                    </template>

                    <template v-slot:item.supplier_orders="{ item }">
                        <v-chip
                            variant="text"
                        >
                            <v-icon class="mr-1">mdi-package-variant</v-icon>
                            {{ item.supplier_orders }}
                        </v-chip>
                    </template>

                    <template v-slot:item.expeditions="{ item }">
                        <v-chip variant="text">
                            <v-icon class="mr-1">mdi-truck-fast-outline</v-icon>
                            {{ item.expeditions }}
                        </v-chip>
                    </template>

                    <template v-slot:item.total_available_stock="{ item }">
                        <v-chip
                            variant="elevated"
                            color="white"
                        >
                        <v-icon class="mr-1" :color="item.total_available_stock <= 0 ? 'red' : 'black'">
                            {{ item.total_available_stock <= 0 ? 'mdi-alert-circle-outline' : 'mdi-package-variant-closed-check' }}
                        </v-icon>
                        {{ item.total_available_stock }}
                        </v-chip>
                    </template>

                    <template v-slot:item.total_future_stock="{ item }">
                        <v-chip
                            variant="elevated"
                            color="white"
                        >
                            <v-icon class="mr-1" :color="item.total_future_stock <= 0 ? 'red' : 'black'">
                            {{ item.total_future_stock <= 0 ? 'mdi-alert-circle-outline' : 'mdi-calendar-clock' }}
                            </v-icon>
                            {{ item.total_future_stock }}
                        </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <div class="actions-slot">
                            <td class="arrow-cell">
                                <v-icon class="hover-arrow ml-2">mdi-chevron-right</v-icon>
                            </td>
                        </div>
                    </template>
                    </v-data-table>
                </v-card>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<style lang="scss" scoped>
@import url(../assets/main.scss);

.v-chip {
    font-weight: 500;
}
</style>