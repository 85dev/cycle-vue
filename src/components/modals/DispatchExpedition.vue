<script setup>
import apiCaller from '@/services/apiCaller';
import dateConverter from '@/services/dateConverter';
import { onMounted, computed, ref } from 'vue'
import { expeditionPositionHeaders } from '@/models/tableHeaders.js'

import HandleSplittedPosition from './HandleSplittedPosition.vue';
import CardTitle from '../CardTitle.vue';

const props = defineProps({
    expedition: {
        type: Object,
        required: true
    },
    selectedCompanyId: {
        type: Number,
        required: true
    }
})

const emit = defineEmits(['refreshExpeditions'])

const indices = ref(null)
const subContractorsList = ref(null)
const logisticPlaceList = ref(null)
const clientsList = ref(null)
const partIds = ref([])
const arrivalTime = ref(dateConverter.formatISODate(new Date()))

const positionCounts = computed(() => {
  const subcontractorCounts = {};
  const logisticPlaceCounts = {};
  const clientCounts = {};

  indices.value?.forEach((item) => {
    const selectedSC = item.selectedSubcontractor;
    const selectedLP = item.selectedLogisticPlace;
    const selectedCL = item.selectedClient

    if (selectedSC) {
      subcontractorCounts[selectedSC] = (subcontractorCounts[selectedSC] || 0) + 1;
    }

    if (selectedLP) {
      logisticPlaceCounts[selectedLP] = (logisticPlaceCounts[selectedLP] || 0) + 1;
    }

    if (selectedCL) {
        clientCounts[selectedCL] = (clientCounts[selectedCL] || 0) + 1;
    }
  });

  return {
    subcontractorCounts,
    logisticPlaceCounts,
    clientCounts,
    hasSelections: Object.keys(subcontractorCounts).length > 0 || Object.keys(logisticPlaceCounts).length > 0 || Object.keys(clientCounts).length > 0,
  };
});

function handleSplitUpdate({ id, splitted_positions }) {
    const originalIndex = indices.value.findIndex(item => item.id === id);
    if (originalIndex !== -1) {
        indices.value.splice(originalIndex, 1, ...splitted_positions);
    }
}

async function fetchExpeditionIndices() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/expeditions/${props.expedition.id}/supplier_orders`)

    indices.value = response

    indices.value = indices.value.map(index => {
    if (index.part_id) {
        partIds.value.push(index.part_id); // Add part_id to partIds array
    }
    return {
        ...index,
        selectedSubcontractor: null,
        selectedLogisticPlace: null,
        selectedClient: null,
        clone: false,
        quantity: index.quantity || 0 // Initialize with the existing or default quantity
    };
    });

    partIds.value = [...new Set(partIds.value)];
}

async function fetchClients() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients_by_part_ids?part_ids=${partIds.value}`)

    clientsList.value = response
}

async function fetchSubcontractors() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/subcontractors_index`)

    subContractorsList.value = response
}

async function fetchLogisticPlaces() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/logistic_places`)

    logisticPlaceList.value = response
}

async function submitDispatch() {
    const payload = {
        supplier_order_indices_ids: indices.value.map(index => index.id),
        subcontractors: indices.value.map(index => index.selectedSubcontractor || ''),
        logistic_places: indices.value.map(index => index.selectedLogisticPlace || ''),
        references: indices.value.map(index => index.part_reference),
        designations: indices.value.map(index => index.part_designation),
        clients: indices.value.map(index => index.selectedClient || ''),
        quantities: indices.value.map(index => index.quantity),
        clones: indices.value.map(index => index.clone || false),
        arrival_time: arrivalTime.value
    }

    const response = await apiCaller.post(`companies/${props.selectedCompanyId}/expeditions/${props.expedition.id}/dispatch_expedition`, payload)

    emit('refreshExpeditions')
}

onMounted(async() => {
    await fetchExpeditionIndices()
    await fetchSubcontractors()
    await fetchLogisticPlaces()
    await fetchClients()
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
                <span class="mr-1">Répartir</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        :title="`Répartition de l'expédition ${props.expedition.number}`"
                        icon="mdi-multicast"
                    />
                    <div class="column-maker" style="margin-left: 6px;">
                        <div>
                            <v-icon color="warning" style="margin-left: 12px;">mdi-alert-circle-outline</v-icon>
                            <span class="informative-text" style="margin-left: 6px;">Vous devez choisir une destination par position, <strong>une seule destination</strong> peut être sélectionnée</span>
                        </div>
                        <div>
                            <v-icon color="success" style="margin-left: 12px;">mdi-progress-question</v-icon>
                            <span class="informative-text" style="margin-left: 6px;"><strong>Si une position a plusieurs destinations</strong>, gérez le en cliquant sur <strong>multi-destinations</strong></span>
                        </div>
                    </div>
                    
                    <v-card style="margin: 0.6em;">
                        <v-card-title>
                            CHOIX DES DESTINATIONS PAR POSITION
                        </v-card-title>
                        <v-text-field
                            v-model="arrivalTime"
                            type="date"
                            variant="outlined"
                            label="Date d'arrivée"
                            class="mr-4 ml-4"
                            style="max-width: 160px"
                            density="compact"
                        />
                        <v-data-table
                            :item-selectable="true"
                            :items="indices || []"
                            variant="underlined"
                            density="compact"
                            :headers="expeditionPositionHeaders"
                            v-model="indices"
                        >
                        <template v-slot:item.part_reference="{ item }">
                            <v-chip
                                v-if="!item.clone"
                                variant="elevated"
                                clearable
                            >{{ item.part_designation + ' ' + item.part_reference }}
                            </v-chip>
                            <v-chip
                                v-if="item.clone"
                                variant="tonal"
                                clearable
                            >{{ item.part_designation + ' ' + item.part_reference }}
                            </v-chip>
                        </template>
                        <template v-slot:item.sub_contractor="{ item }">
                            <v-select
                                class="field-slot"
                                variant="underlined"
                                density="compact"
                                clearable
                                :items="subContractorsList.map(sc => sc.name) || []"
                                v-model="item.selectedSubcontractor"
                                label="Sous-traitant"
                                aria-required="true"
                                :disabled="item.selectedLogisticPlace || item.selectedClient"
                            ></v-select>
                        </template>
                        <template v-slot:item.logistic_place="{ item }">
                            <v-select
                                class="field-slot"
                                clearable
                                density="compact"
                                variant="underlined"
                                :items="logisticPlaceList.map(lp => lp.name) || []"
                                v-model="item.selectedLogisticPlace"
                                label="Lieu de stockage"
                                aria-required="true"
                                :disabled="item.selectedSubcontractor || item.selectedClient"
                            ></v-select>
                        </template>
                        <template v-slot:item.client="{ item }">
                            <v-select
                                class="field-slot"
                                clearable
                                density="compact"
                                variant="underlined"
                                v-model="item.selectedClient"
                                :items="clientsList.map(lp => lp.name) || []"
                                label="Client"
                                aria-required="true"
                                :disabled="item.selectedSubcontractor || item.selectedLogisticPlace"
                            >
                            </v-select>
                        </template>
                        <template v-slot:item.actions="{ item }">
                            <HandleSplittedPosition 
                                v-if="item && subContractorsList && logisticPlaceList && clientsList && !item.clone"
                                :position="item"
                                :subcontractors="subContractorsList"
                                :logistic-places="logisticPlaceList"
                                :clients-list="clientsList"
                                @transferSplittedPositions="handleSplitUpdate"
                            >
                            </HandleSplittedPosition>
                            <v-chip 
                                v-if="item.clone"
                                variant="tonal"
                                color="orange"
                            >
                                <v-icon class="mr-1">mdi-call-split</v-icon>
                                Position divisée
                            </v-chip>
                        </template>
                        </v-data-table>
                    </v-card>

                    <v-card title="Répartition actuelle par destination" v-if="positionCounts.hasSelections" style="margin: 0.6em; padding-bottom: 0.8em;">
                        <div v-if="Object.keys(positionCounts.subcontractorCounts).length > 0">
                            <span style="margin-left: 1.2em" class="informative-text-l">
                                Vers sous-traitant(s) :
                            </span>
                            <ul>
                            <li
                                v-for="(count, subcontractor) in positionCounts.subcontractorCounts"
                                :key="subcontractor"
                                style="margin-left: 2em"
                            >
                                {{ subcontractor }} : {{ count }} position(s)
                            </li>
                            </ul>
                        </div>
                        <div v-if="Object.keys(positionCounts.logisticPlaceCounts).length > 0">
                            <span style="margin-left: 1.2em" class="informative-text-l">
                                Vers lieu(x) de stockage :
                            </span>
                            <ul>
                            <li
                                v-for="(count, logisticPlace) in positionCounts.logisticPlaceCounts"
                                :key="logisticPlace"
                                style="margin-left: 2em"
                            >
                                {{ logisticPlace }} : {{ count }} position(s)
                            </li>
                            </ul>
                        </div>
                        <div v-if="Object.keys(positionCounts.clientCounts).length > 0">
                            <span style="margin-left: 1.2em" class="informative-text-l">
                                Vers client :
                            </span>
                            <ul>
                            <li
                                v-for="(count, client) in positionCounts.clientCounts"
                                :key="client"
                                style="margin-left: 2em"
                            >
                                {{ client }} : {{ count }} position(s)
                            </li>
                            </ul>
                        </div>
                    </v-card>

                    <v-card-actions style="margin-bottom: 0.8em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn variant="elevated" @click="submitDispatch(); isActive.value = false" color="success">
                            Répartir l'expédition
                        </v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import url(../../assets/main.scss);

.field-slot {
    min-width: 120px;
    padding-top: 0.6em;
}
</style>