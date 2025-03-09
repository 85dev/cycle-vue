<script setup>
// Vue
import { onMounted, ref, toRefs, watch } from 'vue'

// Services
import apiCaller from '@/services/apiCaller';
import CardTitle from '../CardTitle.vue';
import GenerateDeliverySlipPDF from './GenerateDeliverySlipPDF.vue';

// Internal logic
const props = defineProps({
    selectedCompanyId: {
        type: Number,
        required: true
    },
    position: {
        type: Object,
        required: true
    },
    client: {
        type: Object,
        required: true
    },
    origin: {
        type: String,
        required: true
    },
    clientOrders: {
        type: Array
    },
    subContractorsList: {
        type: Array
    },
    logisticPlaceList: {
        type: Array
    }
})

console.log(props.clientOrders);

const emit = defineEmits('refresh')

const reactivePosition = toRefs(props.position)
const modifiedQuantity = ref(props.position.quantity)
const transferDate = ref(new Date().toISOString().split('T')[0]);
const selectedClient = ref(false)
const selectedClientOrder = ref(null)
const selectedLogisticPlace = ref(null)
const selectedSubcontractor = ref(null)
const partialDelivery = ref(false)
const transferData = ref({
    type: null,
    name: null,
    isSelected: false,
});

function createPayload() {
    let destinationType = null;
    let destinationName = null;
    let logisticPlaceId = null;
    let subContractorId = null;
    let clientOrderId = selectedClient.value ? props.clientOrders.find(co =>   `${co.client_order_number} (${new Date(co.delivery_date).toLocaleDateString()})` === selectedClientOrder.value)?.id : null;

    if (selectedSubcontractor.value) {
        destinationType = "subcontractor";
        destinationName = selectedSubcontractor.value;
        subContractorId = props.subContractorsList.find(sc => sc.name === selectedSubcontractor.value)?.id;
    } else if (selectedLogisticPlace.value) {
        destinationType = "logistic_place";
        destinationName = selectedLogisticPlace.value;
        logisticPlaceId = props.logisticPlaceList.find(lp => lp.name === selectedLogisticPlace.value)?.id;
    } else if (selectedClient.value) {
        destinationType = "client";
        destinationName = props.client.name;
    }
    return {
        position_id: props.position.id,
        part_id: props.position.part_id,
        transfer_date: transferDate.value,
        quantity: modifiedQuantity.value,
        destination_type: destinationType,
        destination_name: destinationName,
        subcontractor_id: subContractorId,
        logistic_place_id: logisticPlaceId,
        expedition_position_id: props.position.expedition_position_id,
        is_partial: partialDelivery.value,
        ...(selectedClient.value && clientOrderId ? { client_order_id: clientOrderId } : {})
    };
}

function handleArrival(payload) {
    if (payload) {
        selectedClient.value = null;
        selectedLogisticPlace.value = null;
        selectedSubcontractor.value = null;

        if (payload.quantity) {
            modifiedQuantity.value = payload.quantity
        }

        if (payload.type === "client") {
            selectedClient.value = true;
        } else if (payload.type === "logistic_place") {
            selectedLogisticPlace.value = payload.name;
        } else if (payload.type === "subcontractor") {
            selectedSubcontractor.value = payload.name;
        }
        
        selectedClient.value = payload.isSelected
    }
}

async function submitTransfer() {
    const payload = createPayload();
    if (!payload.destination_type) {
        console.error("No destination selected.");
        return;
    }

    const response = await apiCaller.post(`companies/${props.selectedCompanyId}/expedition_positions/${props.position.expedition_position_id}/transfer_position`, payload);

    response.status === 200 || response.status === 201 ? emit('refresh') : console.error("Erreur lors de la transfert de la position");
}

watch([selectedLogisticPlace, selectedSubcontractor, selectedClient], () => {
    transferData.value = {
        type: selectedSubcontractor.value
            ? 'subcontractor'
            : selectedLogisticPlace.value
            ? 'logistic_place'
            : selectedClient.value
            ? 'client'
            : null,
        name: selectedSubcontractor.value || selectedLogisticPlace.value || null,
        isSelected: !!selectedClient.value,
        quantity: modifiedQuantity.value,
    };
});

onMounted(() => {
    modifiedQuantity.value = props.position.quantity
})
</script>

<template>
    <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                class="index-slot"
                variant="text"
                color="blue"
                style="margin-right: 0.6em; font-weight: 500;"
            >
                <v-icon start class="ml-1">mdi-gesture-spread</v-icon>
                <span class="mr-1">Transférer</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <div class="d-flex justify-lg-space-between align-center pr-4" style="width: 100%">
                        <CardTitle 
                            title="Transférer la position"
                            icon="mdi-truck-delivery-outline"
                        />
                        <GenerateDeliverySlipPDF
                            v-if="props"
                            :selected-company-id="props.selectedCompanyId"
                            :subcontractors="props.subContractorsList"
                            :logistic-places="props.logisticPlaceList"
                            :position="props.position"
                            :origin="props.origin" 
                            :client="props.client"
                            :client-orders="props.clientOrders" 
                            :quantity="modifiedQuantity"
                            :transfer-data="transferData"
                            @catch-arrival="handleArrival"
                            @refresh="refreshAllData()"
                        />
                    </div>
                    
                    <span class="informative-text d-flex flex-column mb-2">
                    <v-chip
                      variant="elevated"
                      style="width: fit-content;"
                    >
                      <v-icon start class="ml-0">mdi-package-variant-closed-check</v-icon>
                      <span v-if="props.origin === 'subcontractor'">Quantité du lot chez le sous-traitant : <strong>{{props.position.quantity}}</strong></span>
                      <span v-else>Quantité totale sur lieu de stockage : {{props.position.quantity}}</span>
                    </v-chip>
                    <span class="informative-text mt-2" style="margin-left: 0;" v-if="props.position.quantity < modifiedQuantity">
                        <v-chip variant="elevated" color="red">
                            <v-icon class="mr-2">mdi-alert-circle-outline</v-icon>
                            La quantité à transférer doit être inférieure à celle disponible
                        </v-chip>
                    </span>
                  </span>
                  <v-card style="margin: 0.4em">
                        <v-container class="pa-4">
                            <!-- Transfer Information -->
                            <v-row class="align-center">
                            <v-col cols="6">
                                <v-text-field
                                class="field-slot"
                                type="date"
                                v-model="transferDate"
                                variant="underlined"
                                label="Date du transfert"
                                clearable
                                />
                            </v-col>
                            <v-col cols="6">
                                <v-text-field
                                class="field-slot"
                                type="number"
                                v-model="modifiedQuantity"
                                variant="underlined"
                                label="Quantité"
                                clearable
                                />
                            </v-col>
                            </v-row>

                            <!-- Destination Section -->
                            <CardTitle title="Choix du destinataire" icon="mdi-truck-fast-outline" />

                            <v-row class="align-center">
                            <!-- Subcontractor Selection -->
                            <v-col cols="4">
                                <v-select
                                class="field-slot"
                                variant="underlined"
                                clearable
                                :items="props.subContractorsList.map(sc => sc.name) || []"
                                v-model="selectedSubcontractor"
                                label="Sous-traitant"
                                :disabled="selectedLogisticPlace || selectedClient"
                                />
                            </v-col>

                            <!-- Logistic Place Selection -->
                            <v-col cols="4">
                                <v-select
                                class="field-slot"
                                variant="underlined"
                                clearable
                                :items="props.logisticPlaceList.map(lp => lp.name) || []"
                                v-model="selectedLogisticPlace"
                                label="Lieu de stockage"
                                :disabled="selectedSubcontractor || selectedClient"
                                />
                            </v-col>

                            <!-- Client Checkbox -->
                            <v-col cols="4" v-if="props.origin !== 'client'">
                                <v-checkbox
                                class="field-slot"
                                v-model="selectedClient"
                                label="Transférer au client"
                                variant="underlined"
                                color="success"
                                :disabled="selectedSubcontractor || selectedLogisticPlace"
                                />
                            </v-col>
                            </v-row>

                            <CardTitle v-if="selectedClient" title="Assigner la commande client correspondante" icon="mdi-file-document-outline" />

                            <v-row v-if="selectedClient" class="align-center">
                            <v-col cols="4">
                                <v-select
                                class="field-slot"
                                variant="underlined"
                                clearable
                                :items="props.clientOrders.map(co =>  `${co.client_order_number} (${new Date(co.delivery_date).toLocaleDateString()})`) || []"
                                v-model="selectedClientOrder"
                                label="Commande client correspondante"
                                :disabled="!selectedClient"
                                />
                            </v-col>
                            <v-col cols="4" class="d-flex align-center">
                                <v-checkbox
                                class="field-slot"
                                variant="underlined"
                                v-model="partialDelivery"
                                label="Livraison partielle"
                                color="success"
                                />
                            </v-col>
                            </v-row>
                        </v-container>
                        </v-card>

                        <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn color="red" @click="isActive.value = false">FERMER</v-btn>
                        <v-btn :disabled="modifiedQuantity > props.position.quantity" color="success" variant="elevated" @click="submitTransfer(); isActive.value = false">Transférer</v-btn>
                        </v-card-actions>
                </v-card>

                
            </div>
        </template>
    </v-dialog>
</template>