<script setup>
import { defineEmits, ref, computed, onMounted } from 'vue';
import { multipleDestinationHeaders } from '@/models/tableHeaders';

const props = defineProps({
    position: {
        type: Object,
        required: true
    },
    subcontractors: {
        type: Array,
        required: true
    },
    logisticPlaces: {
        type: Array,
        required: true
    },
    clientsList: {
        type: Array,
        required: true
    }
})

const emit = defineEmits('transferSplittedPositions')

// Reactive array to store split positions
const splitPositions = ref([]);

// Add a new empty destination
function addSplit() {
    splitPositions.value.push({
        id: props.position.id,
        part_id: props.position.part_id,
        part_reference: props.position.part_reference,
        part_designation: props.position.part_designation,
        destinationType: null,
        destinationName: null,
        quantity: (props.position.quantity / 2),
        clone: true
    });
}

// Remove a specific destination
function removeSplit(index) {
    splitPositions.value.splice(index, 1);
}

// Validate the total quantity
const isValidQuantity = computed(() => remainingQuantity.value === 0);

// Compute remaining quantity to dispatch between positions
const remainingQuantity = computed(() => {
    const totalAssignedQuantity = splitPositions.value.reduce((sum, item) => {
        return sum + parseInt(item.quantity || 0);
    }, 0);    
    return props.position.quantity - totalAssignedQuantity;
});

// Submit the updated destinations
function submitMultiDestinations() {
    emit('transferSplittedPositions', {
        id: props.position.id,
        splitted_positions: splitPositions.value,
    });
}

onMounted(() => {
    addSplit()
})
</script>

<template>
      <v-dialog class="secundary-dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                class="index-slot"
                variant="tonal"
                color="blue"
                style="margin-right: 0.6em; font-weight: 500;"
            >
                <v-icon start class="mr-1 ml-0">mdi-multicast</v-icon>
                <span class="ml-1">Multi-destinations</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card title="Gérér la multi-destination" style="padding: 0.4em;">
                    <div class="column-maker" style="margin-left: 6px; margin-bottom: 1em;">
                        <div>
                            <v-icon color="warning" style="margin-left: 12px;">mdi-alert-circle-outline</v-icon>
                            <span class="informative-text" style="margin-left: 6px;">Vous devez choisir une destination par position, <strong>une seule destination</strong> peut être sélectionnée</span>
                        </div>
                    </div>
                    <span style="margin-left: 1em">Position concernée : </span>
                    <v-chip
                        variant="elevated"
                    >
                    {{ props.position.part_reference + ' ' + props.position.part_designation }}
                    </v-chip>
                    <v-card style="margin: 1em;">
                       
                        <v-data-table
                            :items="splitPositions"
                            :headers="multipleDestinationHeaders"
                            density="dense"
                        >
                            <template v-slot:item.sub_contractor="{ item }">
                                <v-select
                                    class="field-slot"
                                    variant="underlined"
                                    clearable
                                    :items="subcontractors.map(sc => sc.name)"
                                    v-model="item.selectedSubcontractor"
                                    label="Sous-traitant"
                                    :disabled="item.selectedLogisticPlace || item.selectedClient"
                                ></v-select>
                            </template>

                            <template v-slot:item.logistic_place="{ item }">
                                <v-select
                                    class="field-slot"
                                    clearable
                                    variant="underlined"
                                    :items="logisticPlaces.map(lp => lp.name)"
                                    v-model="item.selectedLogisticPlace"
                                    label="Lieu de logistique"
                                    :disabled="item.selectedSubcontractor || item.selectedClient"
                                ></v-select>
                            </template>

                            <template v-slot:item.client="{ item }">
                                <v-select
                                    class="field-slot"
                                    clearable
                                    variant="underlined"
                                    v-model="item.selectedClient"
                                    :items="clientsList.map(lp => lp.name) || []"
                                    label="Client"
                                    aria-required="true"
                                    :disabled="item.selectedSubcontractor || item.selectedLogisticPlace"
                                >
                                </v-select>
                            </template>

                            <template v-slot:item.quantity="{ item }">
                                <v-text-field
                                    class="field-slot"
                                    v-model="item.quantity"
                                    label="Quantité"
                                    type="number"
                                    variant="underlined"
                                ></v-text-field>
                            </template>

                            <template v-slot:item.actions="{ index }">
                                <v-btn 
                                    style="margin-right: -3em;"
                                    icon 
                                    @click="removeSplit(index)" 
                                    >
                                    <v-icon>mdi-delete-outline</v-icon>
                                </v-btn>
                            </template>
                        </v-data-table>

                        <div class="aligner">
                            <v-btn
                                variant="elevated"
                                style="margin: 1em 0;"
                                @click="addSplit"
                            >
                                Ajouter une position
                            </v-btn>
                        </div>
                    </v-card>

                    <!-- Validation Message -->
                    <v-card style="margin: 1em; padding: 0.6em" class="informative-text-m">
                        <div v-if="!isValidQuantity">
                            <div>
                                <v-icon color="primary" style="margin-right: 6px">mdi-multicast</v-icon>
                                <span class="informative-text-m">Quantité à répartir : {{ props.position.quantity }}</span>
                            </div>
                            
                            <div class="informative-text-l">
                                <v-icon color="warning">mdi-alert-circle-outline</v-icon>
                                Reste à répartir : {{ remainingQuantity }}
                            </div>
                        </div>

                        <div v-else>
                            <div style="display: flex; align-items: center;">
                                <v-icon color="success" style="margin-right: 6px">mdi-check-circle-outline</v-icon>
                                <span class="informative-text-m">Quantité totale répartie</span>
                            </div>
                        </div>
                    </v-card>
                   

                    <!-- Actions -->
                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn color="red" @click="isActive.value = false">FERMER</v-btn>
                        <v-btn :disabled="!isValidQuantity" color="success" variant="elevated" @click="submitMultiDestinations">ENREGISTRER</v-btn>
                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

</style>