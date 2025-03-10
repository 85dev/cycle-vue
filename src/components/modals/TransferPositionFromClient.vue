<script setup>
// Vue
import { onMounted, ref, toRefs } from 'vue'

// Services
import apiCaller from '@/services/apiCaller';
import CardTitle from '../CardTitle.vue';

// Data constant
import { transferClientHeaders } from '@/models/tableHeaders';

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
    subContractorsList: {
        type: Array
    },
    logisticPlaceList: {
        type: Array
    }
})

const emit = defineEmits('refresh')

const reactivePosition = toRefs(props.position)

const modifiedQuantity = ref(props.position.quantity)
const transferDate = ref(new Date().toISOString().split('T')[0]);
const selectedLogisticPlace = ref(null)
const selectedSubcontractor = ref(null)

function createPayload() {
    let destinationType = null;
    let destinationName = null;
    let logisticPlaceId = null;
    let subContractorId = null;

    if (selectedSubcontractor.value) {
        destinationType = "subcontractor";
        destinationName = selectedSubcontractor.value;
        subContractorId = props.subContractorsList.find(sc => sc.name === selectedSubcontractor.value)?.id;
    } else if (selectedLogisticPlace.value) {
        destinationType = "logistic_place";
        destinationName = selectedLogisticPlace.value;
        logisticPlaceId = props.logisticPlaceList.find(lp => lp.name === selectedLogisticPlace.value)?.id;
    }

    return {
        client_position_id: props.position.id,
        part_id: props.position.part_id,
        transfer_date: transferDate.value,
        quantity: modifiedQuantity.value,
        destination_type: destinationType,
        destination_name: destinationName,
        subcontractor_id: subContractorId,
        logistic_place_id: logisticPlaceId
    };
}

async function submitTransfer() {
    const payload = createPayload();
    if (!payload.destination_type) {
        console.error("No destination selected.");
        return;
    }

    const response = await apiCaller.post(`companies/${props.selectedCompanyId}/client_positions/${props.position.id}/transfer_position_from_client`, payload);

    response.status === 200 || response.status === 201 ? emit('refresh') : console.error("Error during position transfer.");
}

onMounted(async () => {
    modifiedQuantity.value = props.position.quantity;
    selectedLogisticPlace.value = null;
    selectedSubcontractor.value = null;
});
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
                    <div class="d-flex justify-lg-space-between align-center" style="width: 100%">
                        <CardTitle 
                            title="Transférer la position"
                            icon="mdi-truck-delivery-outline"
                        />
                    </div>
                    <span class="informative-text">
                        <v-chip variant="elevated">
                            <v-icon class="mr-1">mdi-package-variant-closed-check</v-icon>
                            {{ props.position.quantity }} pièce(s) disponible(s) au transfert
                        </v-chip>
                    </span>
                    <v-card style="margin: 0.4em">
                        <v-container class="pa-4">
                        <!-- Transfer Information -->
                        <CardTitle title="Informations de transfert" icon="mdi-calendar-clock" />
                        <v-row class="align-center">
                            <v-col cols="6">
                                <v-text-field
                                    type="date"
                                    v-model="transferDate"
                                    variant="underlined"
                                    label="Date du transfert"
                                    clearable
                                />
                            </v-col>
                            <v-col cols="6">
                                <v-text-field
                                    type="number"
                                    v-model="modifiedQuantity"
                                    variant="underlined"
                                    label="Quantité"
                                    clearable
                                    :error="modifiedQuantity > props.position.quantity"
                                    :error-messages="modifiedQuantity > props.position.quantity ? 'Quantité invalide' : ''"
                                />
                            </v-col>
                        </v-row>

                        <!-- Destination Selection -->
                        <CardTitle title="Choix du destinataire" icon="mdi-truck-fast-outline" />

                        <v-row class="align-center">
                            <v-col cols="6">
                                <v-select
                                    variant="underlined"
                                    clearable
                                    :items="props.subContractorsList.map(sc => sc.name) || []"
                                    v-model="selectedSubcontractor"
                                    label="Sous-traitant"
                                    :disabled="selectedLogisticPlace"
                                />
                            </v-col>
                            <v-col cols="6">
                                <v-select
                                    variant="underlined"
                                    clearable
                                    :items="props.logisticPlaceList.map(lp => lp.name) || []"
                                    v-model="selectedLogisticPlace"
                                    label="Lieu de stockage"
                                    :disabled="selectedSubcontractor"
                                />
                            </v-col>
                        </v-row>

                        <!-- Client Order Selection -->
                        <CardTitle v-if="selectedClient" title="Assigner une commande client" icon="mdi-file-document-outline" />
                        <v-row v-if="selectedClient" class="align-center">
                            <v-col cols="6">
                                <v-select
                                    variant="underlined"
                                    clearable
                                    :items="props.clientOrders.map(co => `${co.client_order_number} (${new Date(co.delivery_date).toLocaleDateString()})`) || []"
                                    v-model="selectedClientOrder"
                                    label="Commande client"
                                />
                            </v-col>
                            <v-col cols="6" class="d-flex align-center">
                                <v-checkbox
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