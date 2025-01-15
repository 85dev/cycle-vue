<script setup>
import { ref, onMounted } from 'vue'

// Services
import apiCaller from '@/services/apiCaller';
import CardTitle from '../CardTitle.vue';
import SpinnLoader from '../SpinnLoader.vue';

const props = defineProps({
    selectedCompanyId: {
        type: Number,
        required: true
    },
    position: {
        type: Object,
        required: true
    },
    logisticPlace: {
        type: Object,
    },
    origin: {
        type: String,
        required: true
    },
    client: {
        type: Object,
    },
    clientOrders: {
        type: Array
    },
    subcontractors: {
        type: Array,
    },
    logisticPlaces: {
        type: Array,
    }
})

const loading = ref(false)
const selectedContact = ref(null)
const selectedClientOrder = ref(null)
const transferDate = ref(new Date().toISOString().split('T')[0]);
const selectedLogisticPlaceDeparture = ref(null)
const selectedSubcontractorDeparture = ref(null)
const selectedClientArrival = ref(null)
const selectedLogisticPlaceArrival = ref(null)
const selectedSubcontractorArrival = ref(null)
const deliverySlip = ref(null)
const contacts = ref([])
const brutWeight = ref(0)
const packagingInformations = ref('')
const transportConditions = ref('')
const createdObjectId = ref(0)
const lastDeliverySlip = ref({})

async function fetchContacts() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${props.client.id}/contacts_by_client`)
    contacts.value = response
}

async function fetchLastSlip() {
    const response = await apiCaller.get(`pdf_generator/${props.client.id}/last_delivery_slip`)
    lastDeliverySlip.value = response.delivery_slip
}

async function generatedPdf() {
    const departureAddress = selectedSubcontractorDeparture.value
    ? `${selectedSubcontractorDeparture.value}, ${props.subcontractors.find(subC => subC.name === selectedSubcontractorDeparture.value)?.address || "Adresse non trouvée"}`
    : `${selectedLogisticPlaceDeparture.value}, ${props.logisticPlaces.find(lp => lp.name === selectedLogisticPlaceDeparture.value)?.address || "Adresse non trouvée"}`;

    const arrivalAddress = selectedSubcontractorArrival.value
        ? `${selectedSubcontractorArrival.value}, ${props.subcontractors.find(subC => subC.name === selectedSubcontractorArrival.value)?.address || "Adresse non trouvée"}`
        : selectedLogisticPlaceArrival.value
        ? `${selectedLogisticPlaceArrival.value}, ${props.logisticPlaces.find(lp => lp.name === selectedLogisticPlaceArrival.value)?.address || "Adresse non trouvée"}`
        : `${props.client.name}, ${props.client.address || "Adresse client non trouvée"}`;

    const payload = {
        position_id: props.position.expedition_position_id,
        part_id: props.position.part_id,
        delivery_slip: deliverySlip.value,
        transfer_date: transferDate.value,
        brut_weight: brutWeight.value,
        transport_conditions: transportConditions.value,
        packaging_informations: packagingInformations.value,
        departure_address: departureAddress,
        arrival_address: arrivalAddress,
        client_order_id: selectedClientOrder.value 
            ? props.clientOrders.find(order => order.client_order_number === selectedClientOrder.value)?.client_order_id 
            : null,
        contact_id: contacts.value.find(
            contact => `${contact.first_name} ${contact.last_name}` === selectedContact.value
        )?.id || null
    };

    const response = await apiCaller.post(
        `companies/${props.selectedCompanyId}/expedition_positions/${props.position.expedition_position_id}/delivery_slip`, payload
    );

    const responseData = await response.json();
    createdObjectId.value = responseData.delivery_slip_id
}

async function downloadPdf() {
    loading.value = true
    setTimeout(async() => {
        const response = await apiCaller.getJson(`pdf_generator/${createdObjectId.value}/generate_pdf`, false);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Open the Blob URL in a new tab
        window.open(url, '_blank');
        loading.value = false
    }, 1200);
}

async function processPdf() {
    await generatedPdf()
    await downloadPdf()
}

onMounted(async() => {
    if (props.origin === 'subcontractor') {
        selectedSubcontractorDeparture.value = props.position.subcontractor_name
    } else if (props.origin === 'logistic_place') {
        selectedLogisticPlaceDeparture.value = props.position.logistic_place_name
    }
    await fetchLastSlip()
    await fetchContacts()
})
</script>

<template>
    <SpinnLoader :loading="loading" text="Génération du document" />
     <v-dialog class="secundary-dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn
                v-bind="activatorProps"
                class="index-slot mr-4"
                variant="text"
                color="blue"
            >
                <v-icon start class="ml-1">mdi-download-box-outline</v-icon>
                <span class="mr-1 ">Générer le bordereau</span>
            </v-btn>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        title="Générer un bordereau de livraison"
                        icon="mdi-file-pdf-box"
                    />
                    <span class="informative-text d-flex align-center mb-4" v-if="lastDeliverySlip && props.client">
                        <v-chip variant="tonal" color="secundary">
                            Dernier bordereau généré pour {{ props.client.name }} :
                            <strong class="ml-1">{{ lastDeliverySlip.number }}</strong>
                        </v-chip>
                    </span>
                    <v-card style="margin: 0.4em">
                        <v-row class="mr-4 ml-4 pa-2" style="margin-top: -1em;">
                            <v-col cols="6">
                                <v-text-field
                                    class="field-slot"
                                    v-model="deliverySlip"
                                    variant="underlined"
                                    label="Numéro de bordereau"
                                    clearable
                                />
                            </v-col>
                            <v-col cols="6">
                                <v-select
                                    v-if="props.clientOrders"
                                    v-model="selectedClientOrder"
                                    label="Commande client"
                                    variant="underlined"
                                    :items="props.clientOrders.map(c => c.client_order_number)"
                                />
                            </v-col>   
                        </v-row>         
                        
                        <v-row class="mr-4 ml-4 pa-2" style="margin-top: -3em;">
                            <v-col cols="6">
                                <v-select 
                                    v-if="props.clientOrders"
                                    v-model="selectedContact"
                                    clearable
                                    label="Référent"
                                    variant="underlined"
                                    :items="contacts.map(c => `${c.first_name} ${c.last_name}`)"
                                />
                            </v-col>
                            <v-col cols="6">
                                <v-text-field
                                    class="field-slot"
                                    v-model="brutWeight"
                                    type="number"
                                    variant="underlined"
                                    label="Poids brut (kg)"
                                    clearable
                                />
                            </v-col>
                        </v-row>
                      
                            <v-row class="mr-4 ml-4 pa-2" style="margin-top: -3em;">
                                <v-col cols="6">
                                    <v-textarea
                                        v-model="packagingInformations"
                                        label="Conditionnement et packaging"
                                        variant="underlined"
                                    />
                                </v-col>
                                <v-col cols="6">
                                    <v-textarea
                                        v-model="transportConditions"
                                        clearable
                                        label="Conditions de transport"
                                        variant="underlined"
                                    />
                                </v-col>
                            </v-row>
                    </v-card>
                    <v-card style="margin:0.4em">
                        <span class="informative-text">
                            <v-chip variant="elevated" class="mt-2" elevation="4">
                                <v-icon class="mr-2">mdi-sign-direction</v-icon>
                                Lieu de départ :
                            </v-chip>
                        </span>
                        <v-row class="mr-4 ml-4 pa-2" style="margin-top: -0.3em;">
                                <v-select
                                    class="field-slot mr-2"
                                    v-model="selectedSubcontractorDeparture"
                                    :items="props.subcontractors.map(subC => subC.name)"
                                    variant="underlined"
                                    label="Sous-traitant"
                                    clearable
                                    :disabled="selectedLogisticPlaceDeparture"
                                />
                                <v-select
                                    class="field-slot mr-2"
                                    v-model="selectedLogisticPlaceDeparture"
                                    :items="props.logisticPlaces.map(subC => subC.name)"
                                    variant="underlined"
                                    label="Lieu logistique"
                                    clearable
                                    :disabled="selectedSubcontractorDeparture"
                                />
                        </v-row>
                    </v-card>


                    <v-card style="margin:0.4em">
                        <span class="informative-text">
                            <v-chip variant="elevated" color="blue" class="mt-2" elevation="4">
                                <v-icon class="mr-2">mdi-subdirectory-arrow-left</v-icon>
                                Lieu d'arrivée :
                            </v-chip>
                        </span>

                        <v-row class="mr-4 ml-4 pa-2" style="margin-top: -0.3em;">
                                <v-select
                                    class="field-slot mr-2"
                                    v-model="selectedSubcontractorArrival"
                                    :items="props.subcontractors.map(subC => subC.name)"
                                    variant="underlined"
                                    label="Sous-traitant"
                                    clearable
                                    :disabled="selectedLogisticPlaceArrival || selectedClientArrival"
                                />
                                <v-select
                                    class="field-slot mr-2"
                                    v-model="selectedLogisticPlaceArrival"
                                    :items="props.logisticPlaces.map(subC => subC.name)"
                                    variant="underlined"
                                    label="Lieu logistique"
                                    clearable
                                    :disabled="selectedClientArrival || selectedSubcontractorArrival "
                                />
                                <v-checkbox
                                    class="ml-2"
                                    v-model="selectedClientArrival"
                                    label="Chez le client"
                                    variant="underlined"
                                    color="blue"
                                    :disabled="selectedLogisticPlaceArrival || selectedSubcontractorArrival "
                                />
                        </v-row>
                    </v-card>
                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                            variant="text"
                            @click="isActive.value = false"
                        >
                            Fermer
                        </v-btn>
                        <v-btn
                            class="ml-4 d-flex align-center"
                            color="success"
                            variant="elevated"
                            @click="processPdf()"
                        >
                            <v-icon class="ml-1 mr-1">mdi-download-box-outline</v-icon>
                            Télécharger .PDF
                        </v-btn>
                    </v-card-actions>    
                </v-card>
            </div>
        </template>
    </v-dialog>
</template>

<style scoped>

</style>