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
const logisticPlaceList = ref(null)

async function fetchDeliverySlips() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/delivery_slips_by_company`)
    deliverySlips.value = response
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

async function downloadPdf(item) {
    loading.value = true
    setTimeout(async() => {
        const response = await apiCaller.getJson(`pdf_generator/${item.id}/generate_pdf`, false);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Open the Blob URL in a new tab
        window.open(url, '_blank');
        loading.value = false
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
        await fetchDeliverySlips()
        await fetchSubContractors()
        await fetchClients()
        await fetchSuppliers()
        await fetchLogisticPlaces()

        loading.value = false;
    }, 1200);
}

onMounted(async() => {
   await refreshAllData()
})
</script>

<template>
    <SpinnLoader :loading="loading"/>
    <div class="main-card">
        <v-card class="b1-container">
            <CardTitle 
                title="Gestion et création des documents PDF"
                icon="mdi-file-pdf-box"
            />
            <v-card style="margin: 0.4em">
                <div class="d-flex align-center justify-lg-space-between mr-4">
                    <CardTitle 
                        title="Bordereaux de livraison"
                        icon="mdi-file-pdf-box"
                        color="warning"
                    />
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
                    { title: 'Poids', value: 'brut_weight' },
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
                    <template v-slot:item.brut_weight="{ item }">
                        <v-chip variant="elevated" color="white">
                            <v-icon class="mr-1">mdi-weight</v-icon>
                            {{ item.brut_weight }}
                        </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-chip @click="downloadPdf(item)" variant="elevated" color="white">
                            <v-icon class="mr-1">mdi-download-box-outline</v-icon>
                            Télécharger en pdf
                        </v-chip>
                    </template>
                </v-data-table>
            </v-card>
            
        </v-card>
    </div>
</template>