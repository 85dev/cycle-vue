<script setup>
import { onMounted, computed, watch, ref, defineEmits } from 'vue';
import sessionStore from '@/stores/sessionStore.js' // Import the new store

// Services
import apiCaller from '@/services/apiCaller.js';
import CardTitle from '../CardTitle.vue';

const selectedCompany = ref(null)
const client = ref(null)
const clientsList = ref(null)
const clientsListDisplayed = ref(null)
const reference = ref(null)
const designation = ref(null)
const material = ref(null)
const weight = ref(0)
const drawing = ref(null)
const supplier = ref(null)
const suppliersList = ref([])
const suppliersListDisplayed = ref([])
const subcontractor = ref(null)
const subcontractorsList = ref([])
const subcontractorsListDisplayed = ref([])
const logisticPlaceList = ref([])
const logisticPlaceListDisplayed = ref([])

// Lifecycle
const allEntities = computed(() => {
    return [
        ...logisticPlaceList.value.map(lg => ({ id: lg.id, name: lg.name, type: 'LogisticPlace' })),
        ...suppliersList.value.map(supplier => ({ id: supplier.id, name: supplier.name, type: 'Supplier' })),
        ...subcontractorsList.value.map(sub => ({ id: sub.id, name: sub.name, type: 'SubContractor' })),
        ...clientsList.value.map(client => ({ id: client.id, name: client.name, type: 'Transaction' }))
    ];
});
const lifecycleSteps = ref([])
const lifecycleStepName = ref(null)
const lifecycleEntityType = ref(null) 
const lifecycleEntity = ref(null) 
const lifecycleEntityOptions = ['Supplier', 'SubContractor', 'LogisticPlace', 'Client']
const lifecycleStepsType = ['Production', 'Treatment', 'Assembling', 'Stockage', 'Transaction']

function getEntityList(type) {
    return allEntities.value
        .filter(entity => entity.type === type)
        .map(entity => entity.name);
}

function handleEntityTypeChange(step) {
    if (!step.entity_type) {
        step.entity_name = null;
    }
}

const emit = defineEmits('refreshParts')

const props = defineProps({
    origin: {
        type: String,
    },
})

function addLifecycleStep() {
    lifecycleSteps.value.push({
        step_name: null,
        entity_type: null,
        entity_id: null,
        entity_name: null
    });
}

function removeLifecycleStep(index) {
    lifecycleSteps.value.splice(index, 1);
}

// ADD AUTOMATICALLY DATA TO LIFECYCLE STEPS
function addDefaultLifecycleSteps() {
    // Remove outdated client steps before adding a new one
    lifecycleSteps.value = lifecycleSteps.value.filter(step => step.entity_type !== 'Client');

    if (client.value) {
        if (lifecycleSteps.value.length === 1) {
            lifecycleSteps.value = []
        }
        lifecycleSteps.value.push({
            step_name: 'Transaction',
            entity_type: 'Client',
            entity_id: clientsList.value.find(c => c.name === client.value)?.id,
            entity_name: client.value
        });
    }

    // Remove outdated supplier steps before adding new ones
    lifecycleSteps.value = lifecycleSteps.value.filter(step => step.step_name !== 'Production' || step.entity_type !== 'Supplier');

    if (supplier.value && supplier.value.length > 0) {
        supplier.value.forEach(sup => {
            lifecycleSteps.value.unshift({
                step_name: 'Production',
                entity_type: 'Supplier',
                entity_id: suppliersList.value.find(s => s.name === sup)?.id,
                entity_name: sup
            });
        });
    }

    // Remove outdated subcontractor steps before adding new ones
    lifecycleSteps.value = lifecycleSteps.value.filter(step => step.step_name !== 'Treatment' || step.entity_type !== 'SubContractor');

    if (subcontractor.value && subcontractor.value.length > 0) {
        subcontractor.value.forEach(sub => {
            lifecycleSteps.value.unshift({
                step_name: 'Treatment',
                entity_type: 'SubContractor',
                entity_id: subcontractorsList.value.find(s => s.name === sub)?.id,
                entity_name: sub
            });
        });
    }
}

watch([client, supplier, subcontractor], addDefaultLifecycleSteps);

async function fetchLogisticPlaces() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/logistic_places`)

    logisticPlaceList.value = response
    logisticPlaceListDisplayed.value = response.map(lg => lg.name)
}

async function fetchSubContractors() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/subcontractors_index`)

    subcontractorsList.value = response
    subcontractorsListDisplayed.value = response.map(sc => sc.name)
}

async function fetchClients() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/clients`)

    clientsList.value = response
    clientsListDisplayed.value = response.map(client => client.name)
}

async function fetchSuppliers() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/suppliers`)

    suppliersList.value = response
    suppliersListDisplayed.value = response.map(supplier => supplier.name)
}

async function submitPart() {
    const selectedClient = clientsList.value.find(c => c.name === client.value);
    const selectedSupplierIds = supplier.value.map(name => suppliersList.value.find(supplier => supplier.name === name)?.id);    
    const selectedSubcontractorIds = subcontractor.value ? subcontractor.value.map(name => subcontractorsList.value.find(sub => sub.name === name)?.id) : [];

    const payload = {
        supplier_ids: selectedSupplierIds,
        client_id: selectedClient?.id,
        subcontractor_ids: selectedSubcontractorIds.length > 0 ? selectedSubcontractorIds : null,
        part: {
            reference: reference.value,
            designation: designation.value,
            material: material.value,
            drawing: drawing.value,
            weight: weight.value,
        },
        lifecycles: lifecycleSteps.value.map((step, index) => ({
            step_name: step.step_name,
            entity_type: step.entity_type,
            entity_id: step.entity_id,
            sequence_order: index + 1
        }))
    };

    await apiCaller.post(`companies/${selectedCompany.value.id}/parts`, payload, true)

    emit('refreshParts')
}

onMounted(async() => {
    selectedCompany.value = sessionStore.getters.getSelectedCompany();
    
    if (selectedCompany.value) {
        await fetchLogisticPlaces()
        await fetchClients()
        await fetchSuppliers()
        await fetchSubContractors()
    }

    addLifecycleStep()
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-card
                v-if="props.origin === 'menu'"
                class="clickable-card d-flex align-center justify-center flex-column"
                outlined
                v-bind="activatorProps"
                style="height: 100px; width: 200px;"
                elevation="2"
                @click="openModal"
            >
                <v-icon class="mr-2">mdi-tag-plus-outline</v-icon>
                <span class="informative-text">Ajouter une référence</span>
            </v-card>
            <v-chip
                v-bind="activatorProps" v-if="props.origin !== 'menu'"
                style="margin: 1em 0em -0.6em 0em;"
                variant="elevated"
                elevation="4"
                color="blue"
            >
                <v-icon class='mr-2'>mdi-plus-thick</v-icon>
                <span>Ajouter une référence</span>
            </v-chip> 
      </template>
  
        <template v-slot:default="{ isActive }">
            <div style="padding: 0.4em; overflow: auto;">
                <v-card>
                    <CardTitle 
                        title="Ajouter une nouvelle référence"
                        icon="mdi-cog"
                    ></CardTitle>
                    <v-divider style="margin: 0em 1em;"></v-divider>

                        <v-form class="form-container" style="margin-top:0.4em;">

                            <v-row style="margin: 0em 0.4em">
                                <v-select
                                    variant="underlined"
                                    class="form-part"
                                    label="Client"
                                    v-model="client"
                                    :items="clientsListDisplayed ? clientsListDisplayed : []"
                                    required
                                />

                                <v-select
                                    variant="underlined"
                                    class="form-part"
                                    label="Sous-traitant(s)"
                                    multiple="true"
                                    v-model="subcontractor"
                                    :items="subcontractorsList ? subcontractorsListDisplayed : []"
                                    required
                                />

                                <v-select
                                    variant="underlined"
                                    class="form-part"
                                    multiple="true"
                                    :items="suppliersListDisplayed ? suppliersListDisplayed : []"
                                    v-model="supplier"
                                    label="Fournisseur"
                                    required
                                />
                                
                            </v-row>

                            <v-row style="margin: 0em 0.4em">
                                <v-text-field
                                    clearable
                                    variant="underlined"   
                                    class="form-part"
                                    v-model="designation"
                                    label="Désignation"
                                    required
                                />

                                <v-text-field
                                    clearable
                                    variant="underlined"   
                                    class="form-part"
                                    v-model="reference"
                                    label="Référence"
                                    required
                                />
                            </v-row>

                            <v-row style="margin: 0em 0.4em">
                                <v-text-field
                                    clearable
                                    variant="underlined"   
                                    class="form-part"
                                    v-model="drawing"
                                    label="Numéro de dessin"
                                    required 
                                />

                                <v-text-field
                                    clearable
                                    variant="underlined"   
                                    class="form-part"
                                    v-model="weight"
                                    label="Poids unitaire (gr, grammes)"
                                    required 
                                />

                                <v-text-field
                                    clearable
                                    variant="underlined"   
                                    class="form-part"
                                    v-model="material"
                                    label="Matière"
                                    required 
                                />
                            </v-row>

                            <v-card class="ml-4 mr-4">
                                <CardTitle title="Cycle de vie de la référence" icon="mdi-cog-refresh-outline" color="blue" />
                                <span class="informative-text">
                                    <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
                                    <strong>Faites attention à ajuster les informations automatiquement générées</strong>
                                </span>
                                <v-list v-if="lifecycleSteps.length">
                                    <v-list-item v-for="(step, index) in lifecycleSteps" :key="index">
                                        <v-row class="d-flex align-center">
                                            <v-col cols="4">
                                                <v-select 
                                                    variant="underlined" 
                                                    label="Nom de l'étape" 
                                                    v-model="step.step_name" 
                                                    :items="lifecycleStepsType" 
                                                    required 
                                                    clearable
                                                />
                                            </v-col>
                                            <v-col cols="4">
                                                <v-select 
                                                    variant="underlined" 
                                                    label="Type d'entité" 
                                                    v-model="step.entity_type" 
                                                    :items="lifecycleEntityOptions"
                                                    @update:model-value="handleEntityTypeChange(step)"
                                                    clearable
                                                />
                                            </v-col>
                                            <v-col cols="3">
                                                <v-select 
                                                    variant="underlined" 
                                                    label="Entité associée" 
                                                    v-model="step.entity_name"
                                                    :items="getEntityList(step.entity_type)"
                                                    clearable
                                                />
                                            </v-col>
                                            <v-col cols="auto">
                                                <v-btn class="no-effects" icon @click="removeLifecycleStep(index)" size="small">
                                                    <v-icon>mdi-delete-outline</v-icon>
                                                </v-btn>
                                            </v-col>
                                        </v-row>
                                    </v-list-item>
                                </v-list>
                                <div class="d-flex align-center justify-center">
                                    <v-btn variant="elevated" class="mb-4" @click="addLifecycleStep">
                                        <v-icon class="mr-1">mdi-plus</v-icon> Ajouter une étape
                                    </v-btn>
                                </div>
                                
                            </v-card>
                        </v-form>

                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            variant="text"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn 
                            variant="elevated"
                            color="success"
                            @click="submitPart(); isActive.value = false">
                            Ajouter la référence
                        </v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";
</style>