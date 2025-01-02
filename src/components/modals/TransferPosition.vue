<script setup>
// Vue
import { onMounted, ref, toRefs } from 'vue'

// Services
import apiCaller from '@/services/apiCaller';

// Data constant
import { transferHeaders } from '@/models/tableHeaders';

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
        type: String,
        required: true
    },
    origin: {
        type: String,
        required: true
    }
})

const emit = defineEmits('refresh')

const reactivePosition = toRefs(props.position)

const subContractorsList = ref([])
const logisticPlaceList = ref([])
const modifiedQuantity = ref(props.position.quantity)

const selectedClient = ref(null)
const selectedLogisticPlace = ref(null)
const selectedSubcontractor = ref(null)

async function fetchSubcontractors() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/subcontractors_index`)

    subContractorsList.value = response
}

async function fetchLogisticPlaces() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/logistic_places`)

    logisticPlaceList.value = response
}

async function submitTransfer() {

    let destinationType = null;
    let destinationName = null;
    let logisticPlaceId = null;
    let subContractorId = null;

    if (selectedSubcontractor.value) {
        destinationType = "subcontractor";
        destinationName = selectedSubcontractor.value;
        subContractorId = subContractorsList.value.find(sc => sc.name === selectedSubcontractor.value).id;
    } else if (selectedLogisticPlace.value) {
        destinationType = "logistic_place";
        destinationName = selectedLogisticPlace.value;
        logisticPlaceId = logisticPlaceList.value.find(lp => lp.name === selectedLogisticPlace.value).id;
    } else if (selectedClient.value) {
        destinationType = "client";
        destinationName = selectedClient.value;
    } else {
        console.error("No destination selected.");
        return;
    }

    const payload = {
        position_id: props.position.id,
        part_id: props.position.part_id,
        quantity: modifiedQuantity.value,
        destination_type: destinationType,
        destination_name: destinationName,
        subcontractor_id: subContractorId,
        logistic_place_id: logisticPlaceId,
        expedition_position_id: props.position.expedition_position_id
    };

    const response = await apiCaller.post(`companies/${props.selectedCompanyId}/expedition_positions/${props.position.expedition_position_id}/transfer_position`, payload);

    response.status === 200 || response.status === 201 ? emit('refresh') : console.error("Erreur lors de la transfert de la position");
}

onMounted(async() => {
    modifiedQuantity.value = props.position.quantity

    selectedClient.value = null
    selectedLogisticPlace.value = null
    selectedSubcontractor.value = null

    await fetchSubcontractors()
    await fetchLogisticPlaces()
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
                <v-card :title="`Transférer la position`" append-icon="mdi-truck-delivery-outline" style="padding: 0.4em;">
                    <span class="informative-text">
                    <v-chip
                      class="mt-2 mb-3"
                      variant="elevated"
                    >
                      <v-icon start class="ml-0">mdi-package-variant-closed-check</v-icon>
                      <span v-if="props.origin === 'subcontractor'">Quantité totale chez le sous-traitant : {{props.position.quantity}}</span>
                      <span v-else>Quantité totale sur lieu de stockage : {{props.position.quantity}}</span>
                    </v-chip>
                  </span>
                    <v-row class="pa-2 mr-4 ml-4">
                        <v-data-table
                            :item-selectable="false"
                            :items="[reactivePosition]"
                            variant="underlined"
                            density="dense"
                            :headers="transferHeaders"
                        >
                        <template v-slot:item.quantity="{item}">
                            <v-text-field
                                class="field-slot"
                                type="number"
                                v-model="modifiedQuantity"
                                variant="underlined"
                                label="Quantité"
                                clearable
                            ></v-text-field>
                        </template>
                        <template v-slot:item.sub_contractor="{ item }">
                            <v-select
                                class="field-slot"
                                variant="underlined"
                                clearable
                                :items="subContractorsList.map(sc => sc.name) || []"
                                v-model="selectedSubcontractor"
                                label="Sous-traitant"
                                aria-required="true"
                                :disabled="selectedLogisticPlace || selectedClient"
                            ></v-select>
                        </template>
                         <template v-slot:item.logistic_place="{ item }">
                            <v-select
                                class="field-slot"
                                variant="underlined"
                                clearable
                                :items="logisticPlaceList.map(sc => sc.name) || []"
                                v-model="selectedLogisticPlace"
                                label="Lieu de stockage"
                                aria-required="true"
                                :disabled="selectedSubcontractor || selectedClient"
                            ></v-select>
                        </template>
                        <template v-slot:item.client="{ item }">
                            <v-select
                                class="field-slot"
                                variant="underlined"
                                clearable
                                :items="[props.client]"
                                v-model="selectedClient"
                                label="Stockage client"
                                aria-required="true"
                                :disabled="selectedLogisticPlace || selectedSubcontractor"
                            ></v-select>
                        </template>
                        </v-data-table>
                    </v-row>       

                        <!-- Actions -->
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