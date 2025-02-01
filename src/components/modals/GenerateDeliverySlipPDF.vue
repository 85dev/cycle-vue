<script setup>
import { ref, onMounted, computed, watch } from 'vue'

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
    },
    clientList: {
        type: Array,
        default: () => []
    },
    transferData: {
        type: Object
    }
})

const emit = defineEmits(['catch-arrival', 'refresh']);

const arrivalData = computed(() => ({
    type: selectedSubcontractorArrival.value
            ? 'subcontractor'
            : selectedLogisticPlaceArrival.value
            ? 'logistic_place'
            : selectedClient.value
            ? 'client'
            : null,
    name: selectedSubcontractorArrival.value || selectedLogisticPlaceArrival.value | selectedClientArrival.value || null,
}));

const loading = ref(false)
const selectedContact = ref(null)
const selectedClientOrders = ref(null)
const transferDate = ref(new Date().toISOString().split('T')[0]);
const selectedLogisticPlaceDeparture = ref(null)
const selectedSubcontractorDeparture = ref(null)
const selectedClientArrival = ref(null)
const selectedClientArrivalBoolean = ref(false)
const selectedClient = ref(null)
const selectedLogisticPlaceArrival = ref(null)
const selectedSubcontractorArrival = ref(null)
const deliverySlip = ref(null)
const contacts = ref([])
const brutWeight = ref(0)
const packagingInformations = ref('')
const transportConditions = ref('')
const createdObjectId = ref(0)
const lastDeliverySlip = ref({})
const clientForOrders = ref(null)
const reactiveOrders = ref([])
const selectedOrders = ref([])
const reactiveClientOrder = ref(null)
const expeditionPositions = ref([])
const clientStocks = ref([])

async function fetchContacts() {
    if (props.client) {
        const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${props.client.id}/contacts_by_client`)
        contacts.value = response
    } else if (clientForOrders.value) {
        const clientId = props.clientList.find(c => c.name === clientForOrders.value)?.id
        const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${clientId}/contacts_by_client`)
        contacts.value = response
    } else {
        console.warn("No client found to fetch contacts");
    }
}

async function fetchLastSlip() {
    if (props.client) {
        const response = await apiCaller.get(`pdf_generator/${props.client.id}/last_delivery_slip`)
        lastDeliverySlip.value = response.delivery_slip
    }
}

async function fetchClientOrders() {
    const clientId = props.clientList.find(c => c.name === clientForOrders.value)?.id
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${clientId}/client_orders_by_client`)

    reactiveOrders.value = response
    reactiveClientOrder.value = null
    selectedContact.value = null
}

async function fetchExpeditionPositions() {
    const clientId = props.clientList.find(c => c.name === clientForOrders.value)?.id
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${clientId}/expedition_positions_by_client`)

    expeditionPositions.value = response
}

async function fetchClientStocks() {
    if (clientForOrders.value) {
        const clientId = props.clientList.find(c => c.name === clientForOrders.value)?.id;
        const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${clientId}/stocks_by_client`);
        
        clientStocks.value = response;
    }
}


async function generatedPdf() {
    if (props.origin === 'subcontractor' || props.origin === 'logistic_place') {
        const departureAddress = selectedSubcontractorDeparture.value
            ? `${selectedSubcontractorDeparture.value}, ${props.subcontractors.find(subC => subC.name === selectedSubcontractorDeparture.value)?.address || "Adresse non trouvée"}`
            : `${selectedLogisticPlaceDeparture.value}, ${props.logisticPlaces.find(lp => lp.name === selectedLogisticPlaceDeparture.value)?.address || "Adresse non trouvée"}`;

        const arrivalAddress = selectedSubcontractorArrival.value
            ? `${selectedSubcontractorArrival.value}, ${
                props.subcontractors.find(subC => subC.name === selectedSubcontractorArrival.value)?.address || "Adresse non trouvée"
            }`
            : selectedLogisticPlaceArrival.value
            ? `${selectedLogisticPlaceArrival.value}, ${
                props.logisticPlaces.find(lp => lp.name === selectedLogisticPlaceArrival.value)?.address || "Adresse non trouvée"
            }`
            : selectedClientArrival.value
            ? `${selectedClientArrival.value}, ${
                clientStocks.value.find(stock => stock.name === selectedClientArrival.value)?.address || "Adresse stock non trouvée"
            }`
            : `${props.client.name}, ${props.client.address || "Adresse client non trouvée"}`;

        const payload = {
            expedition_position_ids: props.position.expedition_position_id,
            part_id: props.position.part_id,
            delivery_slip: deliverySlip.value,
            transfer_date: transferDate.value,
            brut_weight: brutWeight.value,
            transport_conditions: transportConditions.value,
            packaging_informations: packagingInformations.value,
            departure_address: departureAddress,
            arrival_address: arrivalAddress,
            client_order_ids: selectedClientOrders.value && selectedClientOrders.value.length
                ? selectedClientOrders.value.map(orderNumber => 
                    props.clientOrders.find(order => order.client_order_number === orderNumber)?.client_order_id
                ).filter(id => id !== undefined) // Ensure no undefined IDs are included
                : [],
            contact_id: contacts.value.find(
                contact => `${contact.first_name} ${contact.last_name}` === selectedContact.value
            )?.id || null
        };

        const response = await apiCaller.post(
            `companies/${props.selectedCompanyId}/delivery_slip`, payload
        );

        const responseData = await response.json();
        createdObjectId.value = responseData.delivery_slip_id
    } else {
        const departureAddress = selectedSubcontractorDeparture.value
            ? `${selectedSubcontractorDeparture.value}, ${props.subcontractors.find(subC => subC.name === selectedSubcontractorDeparture.value)?.address || 'Adresse non trouvée'}`
            : `${selectedLogisticPlaceDeparture.value}, ${props.logisticPlaces.find(lp => lp.name === selectedLogisticPlaceDeparture.value)?.address || 'Adresse non trouvée'}`;

        const arrivalAddress = selectedSubcontractorArrival.value
            ? `${selectedSubcontractorArrival.value}, ${
                props.subcontractors.find(subC => subC.name === selectedSubcontractorArrival.value)?.address || "Adresse non trouvée"
            }`
            : selectedLogisticPlaceArrival.value
            ? `${selectedLogisticPlaceArrival.value}, ${
                props.logisticPlaces.find(lp => lp.name === selectedLogisticPlaceArrival.value)?.address || "Adresse non trouvée"
            }`
            : selectedClientArrival.value
            ? (() => {
                const selectedStock = clientStocks.value.find(stock => stock.name === selectedClientArrival.value);
                const clientName = props.clientList.find(client => client.name === clientForOrders.value)?.name;
                return selectedStock
                    ? `${clientName ? `${clientName}` : ""}, ${selectedStock.name}, ${selectedStock.address || "Adresse stock non trouvée"}`
                    : "Adresse stock non trouvée";
            })()
            : `${props.client?.name || "Client inconnu"}, ${props.client?.address || "Adresse client non trouvée"}`;
                console.log("Final Arrival Address:", arrivalAddress);

        const payload = {
            expedition_position_ids: selectedOrders.value.map(item => item.expedition_position_id),
            delivery_slip: deliverySlip.value,
            transfer_date: transferDate.value,
            brut_weight: brutWeight.value,
            packaging_informations: packagingInformations.value,
            transport_conditions: transportConditions.value,
            departure_address: departureAddress,
            arrival_address: arrivalAddress,
            client_order_ids: reactiveClientOrder.value.map(selectedOrder =>
                                reactiveOrders.value.find(order => order.order_number === selectedOrder)?.id
                                ).filter(id => id !== undefined),
            contact_id: contacts.value.find(contact => `${contact.first_name} ${contact.last_name}` === selectedContact.value)?.id || null,
        };

        loading.value = true;
        const response = await apiCaller.post(
            `companies/${props.selectedCompanyId}/delivery_slip`,
            payload
        );

        const responseData = await response.json();
        createdObjectId.value = responseData.delivery_slip_id;
    }
}

async function processDataFetches() {
    loading.value = true
    setTimeout(async() => {
        await fetchLastSlip()
        await fetchClientOrders(); 
        await fetchExpeditionPositions(); 
        await fetchContacts();
        await fetchClientStocks();
        loading.value = false
    }, 400);
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

watch(
    [selectedSubcontractorArrival, selectedLogisticPlaceArrival, selectedClientArrival],
    () => {
        emit('catch-arrival', arrivalData.value);
    }
);

onMounted(async() => {
    if (props.transferData && (props.origin === 'subcontractor' && props.origin === 'logistic_place')) {
        if (props.transferData.type === 'subcontractor') {
        selectedSubcontractorArrival.value = props.transferData.name;
        selectedLogisticPlaceArrival.value = null;
        selectedClientArrival.value = null;
        } else if (props.transferData.type === 'logistic_place') {
            selectedLogisticPlaceArrival.value = props.transferData.name;
            selectedSubcontractorArrival.value = null;
            selectedClientArrival.value = null;
        } else if (props.transferData.type === 'client') {
            selectedClientArrival.value = props.transferData.name;
            selectedSubcontractorArrival.value = null;
            selectedLogisticPlaceArrival.value = null;
        }
    }
    
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
            <v-chip
                v-if="props.origin === 'subcontractor' || props.origin === 'logistic_place'"
                v-bind="activatorProps"
                variant="elevated"
                color="white"
                elevation="2"
            >
                <v-icon start class="mr-1 ml-1">mdi-download-box-outline</v-icon>
                Générer le bordereau
            </v-chip>
            <v-chip 
                v-else
                v-bind="activatorProps"
                variant="elevated"
                color="white"
                elevation="2"
            >
                <v-icon start class="mr-1 ml-1">mdi-download-box-outline</v-icon>
                Générer un bordereau
            </v-chip>
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
                    <v-card v-if="props.origin !== 'subcontractor' && props.origin !== 'logistic_place'" style="margin: 0.4em">
                        <v-select 
                            class="mr-6 ml-6 mt-2"
                            :items="props.clientList.map(c => c.name)"
                            v-model="clientForOrders"
                            variant="underlined"
                            clearable
                            label="Sélectionnez un client pour définir les positions et les addresses des stocks"
                            @update:model-value="processDataFetches()"
                        />
                        <v-row class="mr-3 ml-3" style="margin-top: -1.6em;" v-if="clientForOrders">
                            <v-col cols="6">
                                <v-select
                                    variant="underlined"
                                    label="Sélectionnez une ou plusieurs commande(s)"
                                    multiple
                                    :items="reactiveOrders.map(o => o.order_number)"
                                    v-model="reactiveClientOrder"
                                />
                            </v-col>
                            <v-col cols="6">
                                <v-select 
                                    v-model="selectedContact"
                                    clearable
                                    label="Référent"
                                    variant="underlined"
                                    :items="contacts.map(c => `${c.first_name} ${c.last_name}`)"
                                />
                            </v-col>
                        </v-row>
                        <div v-if="expeditionPositions.subcontractors && expeditionPositions.subcontractors.length">
                            <div
                                v-for="subcontractor in expeditionPositions.subcontractors"
                                :key="subcontractor.subcontractor_id"
                            >
                                <v-card style="margin: 0.4em">
                                    <CardTitle 
                                        icon="mdi-account-wrench"
                                        :title="subcontractor.subcontractor_name"
                                    />
                                <v-data-table
                                    v-if="subcontractor.positions"
                                    :items="subcontractor.positions"
                                    show-select
                                    :headers="[
                                    { title: 'Référence', value: 'part_reference' },
                                    { title: 'Désignation', value: 'part_designation' },
                                    { title: 'Quantité', value: 'quantity' },
                                    { title: 'Numéro d\'expédition', value: 'expedition_number' },
                                    { title: 'Date de livraison souhaitée', value: 'delivery_date' }
                                    ]"
                                    v-model="selectedOrders"
                                    density="compact"
                                    return-object
                                >
                                
                                    <template v-slot:item.delivery_date="{ item }">
                                    <v-chip variant="tonal" color="blue">
                                        <v-icon class="mr-1">mdi-calendar-clock</v-icon>
                                        {{ new Date(item.delivery_date).toLocaleDateString() }}
                                    </v-chip>
                                    </template>
                                </v-data-table>
                                </v-card>
                            </div>
                    </div>

                    <!-- Logistic Places Section -->
                    <div v-if="expeditionPositions.logistic_places && expeditionPositions.logistic_places.length">
                        <div
                            v-for="logisticPlace in expeditionPositions.logistic_places"
                            :key="logisticPlace.logistic_place_id"
                        >
                            <v-card style="margin: 0.4em">
                                <CardTitle 
                                    icon="mdi-home-map-marker"
                                    :title="logisticPlace.logistic_place_name"
                                />
                            <v-data-table
                                :items="logisticPlace.positions"
                                show-select
                                select-strategy="multiple"
                                :headers="[
                                { title: 'Référence', value: 'part_reference' },
                                { title: 'Désignation', value: 'part_designation' },
                                { title: 'Quantité', value: 'quantity' },
                                { title: 'Numéro d\'expédition', value: 'expedition_number' },
                                { title: 'Date de livraison souhaitée', value: 'delivery_date' }
                                ]"
                                return-object
                                v-model="selectedOrders"
                                density="compact"
                            >
                                <template v-slot:item.delivery_date="{ item }">
                                <v-chip variant="tonal" color="green">
                                    <v-icon class="mr-1">mdi-calendar-clock</v-icon>
                                    {{ new Date(item.delivery_date).toLocaleDateString() }}
                                </v-chip>
                                </template>
                            </v-data-table>
                            </v-card>
                        </div>
                    </div>
                    </v-card>
                    <v-card style="margin: 0.4em">
                        <v-row class="mr-2 ml-2 pa-2" style="margin-top: -1em;">
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
                        
                        <v-row class="mr-2 ml-2 pa-2" style="margin-top: -3em;">
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
                                <v-select
                                    v-if="props.clientOrders"
                                    v-model="selectedClientOrders"
                                    multiple
                                    label="Commande client"
                                    variant="underlined"
                                    :items="props.clientOrders.map(c => c.client_order_number)"
                                />
                            </v-col>
                        </v-row>
                      
                            <v-row class="mr-2 ml-2 pa-2" style="margin-top: -3em;">
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
                        <div class="d-flex flex-column">
                            <span class="informative-text">
                                <v-chip variant="elevated" color="blue" class="mt-2" elevation="4">
                                    <v-icon class="mr-2">mdi-subdirectory-arrow-left</v-icon>
                                    Lieu d'arrivée :
                                </v-chip>
                            </span>

                            <span class="informative-text" v-if="!clientForOrders && props.origin !== 'subcontractor' && props.origin !== 'logistic_place'">
                                <v-chip variant="text">
                                    <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
                                    Sélectionnez d'abord un client pour afficher ses stocks :
                                </v-chip>
                            </span>
                        </div>
    
                        <v-row class="mr-4 ml-4 pa-2" style="margin-top: -1.4em;">
                                <v-select
                                    class="field-slot mr-2"
                                    v-model="selectedSubcontractorArrival"
                                    :items="props.subcontractors.map(subC => subC.name)"
                                    variant="underlined"
                                    label="Sous-traitant"
                                    clearable
                                    :disabled="selectedLogisticPlaceArrival || selectedClientArrival || selectedClient"
                                />
                                <v-select
                                    class="field-slot mr-2"
                                    v-model="selectedLogisticPlaceArrival"
                                    :items="props.logisticPlaces.map(subC => subC.name)"
                                    variant="underlined"
                                    label="Lieu logistique"
                                    clearable
                                    :disabled="selectedClientArrival || selectedSubcontractorArrival || selectedClient"
                                />
                                <v-select
                                    v-if="props.origin !== 'subcontractor' && props.origin !== 'logistic_place'"
                                    class="ml-2"
                                    variant="underlined"
                                    v-model="selectedClientArrival"
                                    label="Sélectionnez un stock client"
                                    :items="clientStocks.map(c => c.name) || ['Sélectionnez un client']"
                                    clearable
                                    :disabled="selectedLogisticPlaceArrival || selectedSubcontractorArrival || clientStocks.length === 0"
                                />
                                <v-checkbox
                                     v-if="props.origin === 'subcontractor' || props.origin === 'logistic_place'"
                                    color="blue"
                                    class="ml-2"
                                    variant="underlined"
                                    v-model="selectedClient"
                                    label="Chez le client"
                                    :disabled="selectedLogisticPlaceArrival || selectedSubcontractorArrival || selectedClientArrival"
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