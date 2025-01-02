<script setup>
import { onMounted, ref, defineEmits } from 'vue';
import sessionStore from '@/stores/sessionStore.js' // Import the new store

// Components
import SpinnLoader from '@/components/SpinnLoader.vue';
import CardTitle from '../CardTitle.vue';

// Services
import apiCaller from '@/services/apiCaller.js';
import autocomplete from '@/services/addressAutocomplete.js'
import { knowledgeList } from '@/models/preselectionData'

const userId = ref(null)
const address = ref(null)
const name = ref(null)
const contactEmail = ref(null)
const contactName = ref(null)
const autocompletedAddresses = ref([])
const selectedKnowledges = ref([]);
const loading = ref(false)

const props = defineProps({
    origin: {
        type: String,
    },
})

const emit = defineEmits(['refreshSuppliers'])

function toggleKnowledgeSelection(knowledge) {
    const index = selectedKnowledges.value.indexOf(knowledge.name);
    if (index === -1) {
        selectedKnowledges.value.push(knowledge.name);
    } else {
        selectedKnowledges.value.splice(index, 1);
    }
}

async function fetchAddressAutocomplete(address) {
    if (address) {
    try {
        loading.value = true
        autocompletedAddresses.value = await autocomplete.fetchAddressAutocomplete(address)
    } catch (error) {
        console.error('Error fetching addresses:', error);
    } finally {
        loading.value = false; // Stop loading spinner after fetching or error
    }
  }
}

async function submitClient() {
    const supplier = {
        supplier: {
            name: name.value,
            address: address.value,
            contactEmail: contactEmail.value,
            contactName: contactName.value,
            knowledge: selectedKnowledges.value.join(', ')
        }
    }

    await apiCaller.post(`users/${userId.value}/create_supplier`, supplier, true)

    emit('refreshSuppliers')
}

function selectAddress(newAddress) {
    address.value = newAddress;
}

onMounted(async() => {
    sessionStore.actions.initializeAuthState();  // Load user and auth token from localStorage

    // Set the userId from sessionStore
    userId.value = sessionStore.getters.getUserID();
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-list v-if="props.origin === 'menu'" variant="tonal" density="compact" nav style="width: 100%; transition: all 0.2s; margin-top: -0.15em; margin-bottom: 0.5em;">
                <v-list-item v-bind="activatorProps" style="display: flex; margin-bottom: -0.6em;" nav>
                    <div class="aligner">
                        <v-list-item-icon>
                        <v-icon style="margin-right: 0.4em;">mdi-account-multiple-plus-outline</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title style="margin-right: 0.2em;">Ajouter un fournisseur</v-list-item-title>
                    </div>
                </v-list-item>                
            </v-list>
            <v-btn v-bind="activatorProps" v-if="props.origin === 'single'" style="margin: 1em 0em 0.6em 0em;">
                <v-icon style="margin-right: 0.4em">mdi-account-multiple-plus-outline</v-icon>
                Ajouter un fournisseur
            </v-btn>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        title="Ajouter un nouveau fournisseur"
                        icon="mdi-factory"
                     ></CardTitle>
                    <v-divider style="margin: 0em 1em;"></v-divider>

                        <v-form class="form-container">

                            <v-text-field
                                variant="underlined"
                                class="form-part"
                                label="Nom du fournisseur"
                                v-model="name"
                                required
                            ></v-text-field>

                            <v-text-field
                                variant="underlined"
                                class="form-part"
                                v-model="address"
                                @input="fetchAddressAutocomplete(address)"
                                label="Addresse"
                                required
                            ></v-text-field>

                            <div style="display: flex; justify-content: center;" v-if="loading">
                                <SpinnLoader :loading="loading"></SpinnLoader>
                            </div>

                            <v-chip-group
                                style="display: flex; justify-content: center; margin: 0em 0.4em;"
                                v-if="autocompletedAddresses.length && !loading"
                                active-class="primary--text"
                                column
                            >
                                <v-chip
                                    v-for="(address, index) in autocompletedAddresses"
                                    :key="index"
                                    style="display: flex; justify-content: center; align-items: center;"
                                    @click="selectAddress(address)"
                                >
                                    {{ address }}
                                    <v-icon style="margin-left: 0.4em;" color="success">mdi-plus-circle-outline</v-icon>
                                </v-chip>
                            </v-chip-group>

                            <v-text-field
                                clearable
                                variant="underlined"   
                                class="form-part"
                                v-model="contactName"
                                label="Nom du contact"
                                required
                            ></v-text-field>

                            <v-text-field
                                clearable
                                variant="underlined"   
                                class="form-part"
                                v-model="contactEmail"
                                label="Email du contact"
                                required
                            ></v-text-field>

                            <v-card title="Savoir-faire" style="margin: 0em 1em">
                                <div class="knowledge-container" style="display: flex; flex-wrap: wrap; gap: 0.4em; justify-content: center; margin: 0.8em;">
                                    <v-chip 
                                        variant="elevated"
                                        v-for="(knowledge, index) in knowledgeList"
                                        :key="index"
                                        class="knowledge-chip"
                                        style="min-width: 120px; display: flex; align-items: center; justify-content: center; padding: 0.4em;"
                                        @click="toggleKnowledgeSelection(knowledge)"
                                        :color="selectedKnowledges.includes(knowledge.name) ? 'primary' : ''"
                                        outlined
                                    >
                                        <v-icon style="margin:0em 6px;">
                                            {{ selectedKnowledges.includes(knowledge.name) ? 'mdi-check-circle-outline' : knowledge.icon }}
                                        </v-icon>
                                        <span style="margin-right: 6px;">
                                            {{ knowledge.name }}
                                        </span>
                                    </v-chip>
                                </div>
                            </v-card>

                        </v-form>

                    <v-card-actions style="margin-bottom: 0.8em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn 
                            variant="elevated"
                            color="success"
                            @click="submitClient(); isActive.value = false">
                            Ajouter
                        </v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

.v-slide-group__content {
    display: flex;
    justify-content: center;
}
</style>