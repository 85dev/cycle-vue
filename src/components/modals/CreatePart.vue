<script setup>
import { onMounted, computed, watch, ref, defineEmits } from 'vue';
import sessionStore from '@/stores/sessionStore.js';
import { VueDraggableNext } from 'vue-draggable-next';

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
        ...clientsList.value.map(client => ({ id: client.id, name: client.name, type: 'Client' }))
    ];
});
const lifecycleSteps = ref([])
const lifecycleEntityOptions = ['Supplier', 'SubContractor', 'LogisticPlace', 'Client']

function getEntityList(type) {
    return allEntities.value
        .filter(entity => entity.type === type)
        .map(entity => entity.name);
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
function addDefaultLifecycleSteps() {
    // **1️⃣ Ensure only one client step**
    lifecycleSteps.value = lifecycleSteps.value.filter(step => step.entity_type !== 'Client');

    if (client.value) {
        const clientExists = lifecycleSteps.value.some(step => step.entity_type === 'Client');
        if (!clientExists) {
            lifecycleSteps.value.unshift({
                step_name: 'Vente au client',
                entity_type: 'Client',
                entity_id: clientsList.value.find(c => c.name === client.value)?.id,
                entity_name: client.value
            });
        }
    }

    // **2️⃣ Ensure only one "Production" step**
    lifecycleSteps.value = lifecycleSteps.value.filter(step => step.step_name !== 'Production');

    if (supplier.value && supplier.value.length > 0) {
        const firstSupplier = supplier.value[0]; // Only take the first supplier
        const productionExists = lifecycleSteps.value.some(step => step.step_name === 'Production');

        if (!productionExists) {
            lifecycleSteps.value.unshift({
                step_name: 'Production',
                entity_type: 'Supplier',
                entity_id: suppliersList.value.find(s => s.name === firstSupplier)?.id,
                entity_name: firstSupplier
            });
        }
    }

    // **3️⃣ Handle subcontractor steps**
    // Remove outdated subcontractor steps that are not in the selected list
    lifecycleSteps.value = lifecycleSteps.value.filter(step => 
        step.entity_type !== 'SubContractor' || subcontractor.value.includes(step.entity_name)
    );

    // Add missing subcontractors
    if (subcontractor.value && subcontractor.value.length > 0) {
        subcontractor.value.forEach(sub => {
            const exists = lifecycleSteps.value.some(step => step.entity_type === 'SubContractor' && step.entity_name === sub);
            if (!exists) {
                lifecycleSteps.value.unshift({
                    step_name: 'Traitement spécifique à préciser',
                    entity_type: 'SubContractor',
                    entity_id: subcontractorsList.value.find(s => s.name === sub)?.id,
                    entity_name: sub
                });
            }
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
                                <CardTitle v-if="lifecycleSteps.length > 0" title="Cycle de vie de la référence" icon="mdi-cog-refresh-outline" />
                                <span v-if="lifecycleSteps.length > 0" class="informative-text">
                                    <v-icon color="warning" class="mr-2">mdi-cursor-move</v-icon>
                                    <strong>Ajustez les informations générées automatiquement, les éléments de la liste sont déplaçables</strong> 
                                </span>
                                <VueDraggableNext
                                    class="dragArea list-group w-full mr-4 ml-4 mt-2"
                                    :list="lifecycleSteps"
                                    item-key="entity_id"
                                    handle=".drag-handle"
                                    animation="200"
                                    ghost-class="ghost"
                                    @end="onDragEnd"
                                >
                                    <div
                                        class="list-group-item bg-gray-300 m-1 p-3 rounded-md text-center d-flex align-center"
                                        v-for="(step, index) in lifecycleSteps"
                                        :key="step.entity_id || index"
                                    >

                                        <v-row class="d-flex align-center ml-4" style="margin-top: -20px;">
                                            <v-col cols="1">
                                                <v-icon class="drag-handle mr-2" size="20" style="cursor: grab;">mdi-gesture-tap</v-icon>
                                                <v-chip variant="elevated" color="white">
                                                    {{ index + 1 }}
                                                </v-chip>
                                            </v-col>
                                            <v-col cols="3">
                                                <v-text-field 
                                                    label="Description de l'étape" 
                                                    v-model="step.step_name"
                                                    variant="underlined"
                                                />
                                            </v-col>
                                            
                                            <v-col cols="3">
                                                <v-select 
                                                    variant="underlined"
                                                    v-model="step.entity_type" 
                                                    :items="lifecycleEntityOptions" 
                                                    label="Type" 
                                                    clearable 
                                                />
                                            </v-col>

                                            <v-col cols="3">
                                                <v-select 
                                                    label="Entité" 
                                                    variant="underlined"
                                                    v-model="step.entity_name"
                                                    :items="getEntityList(step.entity_type)"
                                                />
                                            </v-col>
                                            <v-col cols="1">
                                                <v-btn class="ml-auto no-effects" icon @click="removeLifecycleStep(index)">
                                                    <v-icon>mdi-delete-outline</v-icon>
                                                </v-btn>
                                            </v-col>
                                            
                                        </v-row>
                                    </div>
                                </VueDraggableNext>

                                <div class="d-flex align-center justify-center">
                                    <v-btn variant="elevated" class="mb-2 mt-2" @click="addLifecycleStep">
                                        <v-icon class="mr-1">mdi-plus</v-icon> 
                                        <span>{{ lifecycleSteps.length === 0 ? 'Créer le schéma' : 'Ajouter une étape' }}</span>
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