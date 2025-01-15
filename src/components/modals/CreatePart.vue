<script setup>
import { onMounted, ref, defineEmits } from 'vue';
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
const suppliersList = ref(null)
const suppliersListDisplayed = ref(null)
const subcontractor = ref(null)
const subcontractorsList = ref(null)
const subcontractorsListDisplayed = ref(null)

const emit = defineEmits('refreshParts')

const props = defineProps({
    origin: {
        type: String,
    },
})

async function fetchSubContractors() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/subcontractors_index`)

    subcontractorsList.value = response
    subcontractorsListDisplayed.value = response.map(client => client.name)
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
    const selectedSupplierIds = supplier.value.map(name =>
        suppliersList.value.find(supplier => supplier.name === name)?.id
    );    const selectedSubcontractorIds = subcontractor.value.map(name =>
        subcontractorsList.value.find(sub => sub.name === name)?.id
    );

    const payload = {
        supplier_ids: selectedSupplierIds,
        client_id: selectedClient?.id || null,
        subcontractor_ids: selectedSubcontractorIds,
        part: {
            reference: reference.value,
            designation: designation.value,
            material: material.value,
            drawing: drawing.value,
            weight: weight.value,
        },
    };

    await apiCaller.post(`companies/${selectedCompany.value.id}/parts`, payload, true)

    emit('refreshParts')
}

onMounted(async() => {
    sessionStore.actions.initializeAuthState();  // Load user and auth token from localStorage

    // Set the selectedCompany from sessionStore
    selectedCompany.value = sessionStore.getters.getSelectedCompany();
    
    if (selectedCompany.value) {
        await fetchClients()
        await fetchSuppliers()
        await fetchSubContractors()
    }
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
                <v-list v-if="props.origin === 'menu'" variant="tonal" density="compact" nav style="width: 100%; transition: all 0.2s;">
                    <v-list-item v-bind="activatorProps" style="display: flex;" nav>
                        <div class="aligner">
                            <v-list-item-icon>
                            <v-icon style="margin-right: 0.4em;">mdi-tag-plus-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-title style="margin-right: 0.2em;">Ajouter une pièce</v-list-item-title>
                        </div>
                    </v-list-item>                
                </v-list>
            
                <v-chip
                    v-bind="activatorProps" v-else-if="props.origin !== 'menu'"
                    style="margin: 1em 0em -0.6em 0em;"
                    variant="elevated"
                    elevation="4"
                    color="blue"
                >
                    <v-icon class='mr-2'>mdi-plus-thick</v-icon>
                    <span>Ajouter une pièce</span>
                </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div style="padding: 0.4em;">
                <v-card>
                    <CardTitle 
                        title="Ajouter une nouvelle pièce"
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
                                ></v-select>

                                <v-select
                                    variant="underlined"
                                    class="form-part"
                                    multiple="true"
                                    :items="suppliersListDisplayed ? suppliersListDisplayed : []"
                                    v-model="supplier"
                                    label="Fournisseur"
                                    required
                                ></v-select>

                                <v-select
                                    variant="underlined"
                                    class="form-part"
                                    label="Sous-traitant(s)"
                                    multiple="true"
                                    v-model="subcontractor"
                                    :items="subcontractorsList ? subcontractorsListDisplayed : []"
                                    required
                                ></v-select>
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
                            Ajouter la pièce
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