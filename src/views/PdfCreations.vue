<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import CardTitle from '@/components/CardTitle.vue';
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import GenerateDeliverySlipPDF from '@/components/modals/GenerateDeliverySlipPDF.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';

const loading = ref(false)
const deliverySlips = ref([])
const selectedCompany = computed(() => { return sessionStore.getters.getSelectedCompany() }) 
const subcontractorsList = ref([])
const clientsList = ref([])
const suppliersList = ref([])
const logisticPlaceList = ref([])
const orderSlips = ref([])
const tab = ref(null)

const getTransitIcon = (method) => {
    switch (method) {
        case "Boat": return "mdi-ferry";
        case "Flight": return "mdi-airplane";
        case "Train": return "mdi-train";
        default: return "mdi-help-circle"; // Fallback icon
    }
};

const getTransitColor = (method) => {
    switch (method) {
        case "Boat": return "blue";
        case "Flight": return "warning";
        case "Train": return "success";
        default: return "white"; // Fallback color
    }
};

async function fetchDeliverySlips() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/delivery_slips_by_company`)
    deliverySlips.value = response
}

async function fetchOrderSlips() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/order_slips_by_company`)
    orderSlips.value = response
}

async function fetchSubContractors() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/subcontractors_index`)
    subcontractorsList.value = response
}

async function fetchClients() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/clients`)
    clientsList.value = response
}

async function fetchSuppliers() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/suppliers`)
    suppliersList.value = response
}

async function fetchLogisticPlaces() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/logistic_places`)
    logisticPlaceList.value = response
}

async function downloadPdf(item, type) {
    loading.value = true;
    setTimeout(async () => {
        let endpoint = "";
        
        if (type === "order_slip") {
            endpoint = `pdf_generator/${item.id}/generate_order_slip_single_position_pdf`;
        } else if (type === "delivery_slip") {
            endpoint = `pdf_generator/${item.id}/generate_delivery_slip_pdf`;
        } else {
            console.error("Invalid PDF type");
            loading.value = false;
            return;
        }

        try {
            const response = await apiCaller.getJson(endpoint, false);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error downloading PDF:", error);
        } finally {
            loading.value = false;
        }
    }, 1200);
}

watch(selectedCompany, async (newCompany, oldCompany) => {
  if (newCompany?.id !== oldCompany?.id) { // Only trigger fetchData if the company has changed
    await refreshAllData();
  }
});

async function refreshAllData() {
    loading.value = true;
    setTimeout(async() => {
        await fetchOrderSlips()
        await fetchDeliverySlips()
        await fetchSubContractors()
        await fetchClients()
        await fetchSuppliers()
        await fetchLogisticPlaces()

        loading.value = false;
    }, 600);
}

onMounted(async() => {
   await refreshAllData()
})
</script>

<template>
    <SpinnLoader :loading="loading"/>
    <div class="main-card mt-6 mb-6">
        <v-card class="b1-container d-flex align-center justify-center" variant="elevated">
            <v-tabs v-model="tab">
                <v-tab value="one">
                    <v-icon start class="mr-2">mdi-view-dashboard</v-icon>
                    Bordereaux de livraison
                </v-tab>
                <v-tab value="two">
                    <v-icon start class="mr-2">mdi-chart-box</v-icon>
                    Bons de commande
                </v-tab>
            </v-tabs>
        </v-card>
        
        <v-card class="b1-container">
            <v-tabs-window v-model="tab">
                <v-tabs-window-item value="one">
                    <v-card style="margin: 0.4em">
                <div class="mr-4 ml-4 mt-2 mb-2">
                    <GenerateDeliverySlipPDF
                        origin="pdf-page"
                        :selected-company-id="selectedCompany.id"
                        :subcontractors="subcontractorsList"
                        :logistic-places="logisticPlaceList"
                        :client-list="clientsList"
                        @refresh="refreshAllData()"
                    />
                </div>
                <v-data-table
                    no-data-text="Pas de bordereau enregistré"
                    :items="deliverySlips"
                    :loading="loading"
                    loading-text="Chargement des données..."
                    :headers="[
                    { title: 'Numéro', value: 'number' },
                    { title: 'Date de transfert', value: 'transfer_date' },
                    { title: 'Addresse de départ', value: 'departure_address' },
                    { title: 'Addresse d\'arrivée', value: 'arrival_address' },
                    { title: 'Actions', value: 'actions' }
                    ]"
                >
                    <template v-slot:item.number="{ item }">
                        <v-chip variant="elevated" color="white">
                            <v-icon class="mr-1">mdi-file-document-outline</v-icon>
                            {{ item.number }}
                        </v-chip>
                    </template>
                    <template v-slot:item.transfer_date="{ item }">
                        <v-chip variant="text" color="success">
                            <v-icon class="mr-1">mdi-clock-outline</v-icon>
                            {{ item.transfer_date }}
                        </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-chip @click="downloadPdf(item, 'delivery_slip')" style="font-weight: 500;" variant="text" color="blue">
                            <v-icon class="mr-1">mdi-download-box-outline</v-icon>
                            Télécharger PDF
                        </v-chip>
                    </template>
                </v-data-table>
            </v-card>
                </v-tabs-window-item>
                <v-tabs-window-item value="two">
                    <v-card style="margin: 0.4em">
                <div class="d-flex align-center justify-lg-space-between mr-4">
                   <!-- Add generateOrderSlipPdf -->
                </div>
                <v-data-table
                    no-data-text="Pas de bordereau enregistré"
                    :items="orderSlips"
                    :loading="loading"
                    loading-text="Chargement des données..."
                    :headers="[
                        { title: 'Numéro', value: 'supplier_order_number' },
                        { title: 'Fournisseur', value: 'supplier_name' },
                        { title: 'Réference & désignation', value: 'reference_and_designation' },
                        { title: 'Date de livraison', value: 'delivery_date' },
                        { title: 'Transit par', value: 'transit_method' },
                        { title: 'Transporteur', value: 'transporter' },
                        { title: 'Actions', value: 'actions' }
                    ]"
                >
                    <template v-slot:item.supplier_order_number="{ item }">
                        <v-chip variant="text">
                            <v-icon class="mr-1">mdi-file-document-outline</v-icon>
                            {{ item.supplier_order_number }}
                        </v-chip>
                    </template>
                    <template v-slot:item.supplier_name="{ item }">
                        <v-chip variant="text" color="blue">
                            <v-icon class="mr-1">mdi-factory</v-icon>
                            {{ item.supplier_name }}
                        </v-chip>
                    </template>
                    <template v-slot:item.reference_and_designation="{ item }">
                        <v-chip variant="text">
                            <v-icon class="mr-1">mdi-barcode-scan</v-icon>
                            {{ item.reference_and_designation }}
                        </v-chip>
                    </template>
                    <template v-slot:item.delivery_date="{ item }">
                        <v-chip variant="text">
                            {{ new Date(item.delivery_date).toLocaleDateString() }}
                        </v-chip>
                    </template>
                    <template v-slot:item.transit_method="{ item }">
                        <v-chip
                            variant="text"
                            :color="getTransitColor(item.transit_method)"
                        >
                            <v-icon class="mr-1">{{ getTransitIcon(item.transit_method) }}</v-icon>
                            {{ item.transit_method }}
                        </v-chip>
                    </template>
                    <template v-slot:item.transporter="{ item }">
                        <v-chip variant="elevated" color="white">
                            <v-icon class="mr-1">mdi-truck</v-icon>
                            {{ item.transporter }}
                        </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-chip @click="downloadPdf(item, 'order_slip')" style="font-weight: 500;" variant="text" color="blue">
                            <v-icon class="mr-1">mdi-download-box-outline</v-icon>
                            Télécharger PDF
                        </v-chip>
                    </template>
                </v-data-table>
            </v-card>
                </v-tabs-window-item>
            </v-tabs-window>
        </v-card>
    </div>
</template>