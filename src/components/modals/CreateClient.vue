<script setup>
import { onMounted, ref, defineEmits } from 'vue';
import sessionStore from '@/stores/sessionStore.js' // Import the new store

// Components
import SpinnLoader from '@/components/SpinnLoader.vue';

// Services
import apiCaller from '@/services/apiCaller.js';
import autocomplete from '@/services/addressAutocomplete.js'

const userId = ref(null)
const address = ref(null)
const name = ref(null)
const contactEmail = ref(null)
const contactName = ref(null)
const autocompletedAddresses = ref([])
const clientLoading = ref(false)

// For stock adding purposes
const consignmentStocks = ref([{ address: '', contact_name: '', contact_email: '', autocompleteOptions: [], loading: false }]);
const standardStocks = ref([{ address: '', contact_name: '', contact_email: '', autocompleteOptions: [], loading: false }]);

const emit = defineEmits(['refreshClients'])

function validateClientData() {
    if (!name.value || !address.value || !contactEmail.value || !contactName.value) {
        return false;
    }
    const isConsignmentValid = consignmentStocks.value.every(stock =>
        stock.address && stock.contact_name && stock.contact_email
    );
    const isStandardValid = standardStocks.value.every(stock =>
        stock.address && stock.contact_name && stock.contact_email
    );
    return isConsignmentValid && isStandardValid;
}

const props = defineProps({
    origin: {
        type: String,
    },
})

async function fetchAddressAutocomplete(address, type, index = null) {
    if (address) {
        try {
            if (type === 'client') {
                clientLoading.value = true;
            } else if (type === 'consignment' && index !== null) {
                consignmentStocks.value[index].loading = true; // Add a loading flag for each stock
            } else if (type === 'standard' && index !== null) {
                standardStocks.value[index].loading = true; // Add a loading flag for each stock
            }

            const options = await autocomplete.fetchAddressAutocomplete(address);

            if (type === 'client') {
                autocompletedAddresses.value = options;
            } else if (type === 'consignment' && index !== null) {
                consignmentStocks.value[index].autocompleteOptions = options;
            } else if (type === 'standard' && index !== null) {
                standardStocks.value[index].autocompleteOptions = options;
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            if (type === 'client') {
                clientLoading.value = false;
            } else if (type === 'consignment' && index !== null) {
                consignmentStocks.value[index].loading = false;
            } else if (type === 'standard' && index !== null) {
                standardStocks.value[index].loading = false;
            }
        }
    }
}

function selectAddress(newAddress, type, index = null) {
    if (type === 'client') {
        address.value = newAddress;
        autocompletedAddresses.value = [];
    } else if (type === 'consignment' && index !== null) {
        consignmentStocks.value[index].address = newAddress;
        consignmentStocks.value[index].autocompleteOptions = [];
    } else if (type === 'standard' && index !== null) {
        standardStocks.value[index].address = newAddress;
        standardStocks.value[index].autocompleteOptions = [];
    }
}

function addConsignmentStock() {
  consignmentStocks.value.push({ address: '', contact_name: '', contact_email: '' });
}

function addStandardStock() {
  standardStocks.value.push({ address: '', contact_name: '', contact_email: '' });
}

function removeConsignmentStock(index) {
  consignmentStocks.value.splice(index, 1);
}

function removeStandardStock(index) {
  standardStocks.value.splice(index, 1);
}

async function submitClient() {
    const client = {
        client: {
            name: name.value,
            address: address.value,
            contactEmail: contactEmail.value,
            contactName: contactName.value,
            consignmentStocks: consignmentStocks.value.map(({ address, contact_name, contact_email }) => ({
                address,
                contact_name,
                contact_email
            })),
            standardStocks: standardStocks.value.map(({ address, contact_name, contact_email }) => ({
                address,
                contact_name,
                contact_email
            })),
        }
    }

    const response = await apiCaller.post(`users/${userId.value}/create_client`, client, true)

    emit('refreshClients')
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
        <v-list
          v-if="props.origin === 'menu'"
          variant="tonal"
          density="compact"
          nav
          style="width: 100%; transition: all 0.2s; margin-top: -0.65em;"
        >
          <v-list-item v-bind="activatorProps" style="display: flex; margin-bottom: -0.6em;" nav>
            <div style="display: flex; align-items: center;">
              <v-list-item-icon>
                <v-icon style="margin-right: 0.4em;">mdi-account-plus-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-title style="margin-right: 0.2em;">Ajouter un client</v-list-item-title>
            </div>
          </v-list-item>
        </v-list>
  
        <v-btn v-bind="activatorProps" v-if="props.origin === 'single'" style="margin: 1em 0em 0.6em 0em;">
          <v-icon style="margin-right: 0.4em">mdi-account-plus-outline</v-icon>
          Ajouter un client
        </v-btn>
      </template>
  
      <template v-slot:default="{ isActive }">
        <div style="padding: 0.4em;">
          <v-card title="Ajouter un nouveau client" style="padding: 0.4em;">
            <v-divider style="margin: 0em 1em 1em 1em;"></v-divider>  
            <v-form class="form-container">
            <!-- Client Information Section -->
            <v-card style="margin: 0.4em">
              <v-card-title>INFORMATIONS DU CLIENT</v-card-title>
              <v-card-text>
                <v-row 
                    style="margin-top: -1em;"
                    no-gutters
                >
                  <v-col cols="12" md="6">
                    <v-text-field
                      variant="underlined"
                      label="Nom du client"
                      v-model="name"
                      class="mr-2"
                      required
                    ></v-text-field>
                    <v-text-field
                      variant="underlined"
                      v-model="address"
                      @input="fetchAddressAutocomplete(address, 'client')"
                      class="mr-2"
                      label="Adresse"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      variant="underlined"
                      v-model="contactName"
                      class="mr-2"
                      label="Nom du contact principal"
                      required
                    ></v-text-field>
                    <v-text-field
                      variant="underlined"
                      v-model="contactEmail"
                      class="mr-2"
                      label="Email du contact"
                      required
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-row v-if="autocompletedAddresses.length && !clientLoading" style="margin-top: -2em;">
                  <v-col cols="12">
                    <v-chip-group
                      active-class="primary--text"
                      column
                      style="display: flex; flex-wrap: wrap;"
                    >
                      <v-chip
                        v-for="(address, index) in autocompletedAddresses"
                        :key="'client-address-' + index"
                        @click="selectAddress(address, 'client')"
                        style="margin: 0.2em;"
                      >
                        {{ address }}
                        <v-icon style="margin-left: 0.4em;" color="success">mdi-plus-circle-outline</v-icon>
                      </v-chip>
                    </v-chip-group>
                  </v-col>
                </v-row>

                <div v-if="clientLoading" class="aligner" style="margin-top: 1em;">
                    <SpinnLoader :loading="clientLoading"></SpinnLoader>
                </div>
              </v-card-text>
            </v-card>

            <!-- Consignment Stocks Section -->
            <v-card flat outlined>
              <v-card style="margin: 0.4em;">
                <v-card-title>
                  AJOUT DES LIEUX DE STOCKAGE CONSIGNATION
                </v-card-title>
                  <div style="margin-bottom: 0.4em;">
                      <span class="informative-text" style="display: flex; align-items: center;">
                          <v-icon color="success" style="margin-right: 6px;">mdi-help-circle-outline</v-icon>
                          Un stock consignation client concentre les références mises à disposition chez le client, les références ne sont facturées qu'au moment de leurs consommations.
                      </span>
                  </div>
                <v-divider color="transparent" style="margin:0em 1em 1.4em 1em; padding: 0em 2em;"></v-divider>
                <v-row 
                    v-for="(stock, index) in consignmentStocks" 
                    :key="'consignment-' + index" 
                    class="mb-4 align-center"
                    no-gutters
                    style="margin-top: -2em; padding: 0em 0.8em"
                    >
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="stock.address"
                      label="Adresse"
                      @input="fetchAddressAutocomplete(stock.address, 'consignment', index)"
                      required
                      variant="underlined"
                      class="mr-2"
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="stock.contact_name"
                      label="Nom du contact"
                      required
                      variant="underlined"
                      class="mr-2"
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="stock.contact_email"
                      label="Email du contact"
                      required
                      variant="underlined"
                      clearable
                      class="mr-2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="2" class="d-flex justify-end">
                    <v-btn @click="removeConsignmentStock(index)" icon small>
                        <v-icon>mdi-delete-outline</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col cols="12">
                    <v-chip-group
                      v-if="stock.autocompleteOptions && stock.autocompleteOptions.length"
                      active-class="primary--text"
                      column
                      style="display: flex; flex-wrap: wrap; margin-top: -0.6em; margin-bottom: 0.6em;"
                    >
                      <v-chip
                        v-for="(address, idx) in stock.autocompleteOptions"
                        :key="'consignment-address-' + idx"
                        @click="selectAddress(address, 'consignment', index)"
                        style="margin: 0.2em;"
                      >
                        {{ address }}
                        <v-icon style="margin-left: 0.4em;" color="success">mdi-plus-circle-outline</v-icon>
                      </v-chip>
                    </v-chip-group>
                  </v-col>
                    <div v-if="stock.loading" class="aligner" style="margin-top: 1em; margin-bottom: 3em; width: 100%;">
                        <SpinnLoader :loading="stock.loading"></SpinnLoader>
                    </div>
                </v-row>



                <div class="aligner">
                    <v-btn @click="addConsignmentStock" variant="elevated">
                        <v-icon start>mdi-plus-circle-outline</v-icon>
                        Ajouter position
                    </v-btn>
                </div>
              </v-card>
            </v-card>

            <!-- Standard Stocks Section -->
            <v-card flat outlined>
              <v-card style="margin: 0.4em;">
                <v-card-title>AJOUT DES LIEUX DE STOCKAGE STANDARD</v-card-title>
                <v-divider color="transparent" style="margin:0em 1em 1.4em 1em; padding: 0em 2em;"></v-divider>
                <v-row 
                    v-for="(stock, index) in standardStocks" 
                    :key="'standard-' + index" 
                    class="mb-4 align-center" 
                    style="margin-top: -2em; padding: 0em 0.8em"
                    no-gutters
                    >
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="stock.address"
                      label="Adresse"
                      @input="fetchAddressAutocomplete(stock.address, 'standard', index)"
                      required
                      class="mr-2"
                      variant="underlined"
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="stock.contact_name"
                      label="Nom du contact"
                      required
                      class="mr-2"
                      variant="underlined"
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="stock.contact_email"
                      label="Email du contact"
                      required
                      class="mr-2"
                      variant="underlined"
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="2" class="d-flex justify-end">
                    <v-btn @click="removeStandardStock(index)" icon small>
                        <v-icon>mdi-delete-outline</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col cols="12">
                    <v-chip-group
                      v-if="stock.autocompleteOptions && stock.autocompleteOptions.length"
                      active-class="primary--text"
                      column
                      style="display: flex; flex-wrap: wrap; margin: 0.4em 0em;"
                    >
                      <v-chip
                        v-for="(address, idx) in stock.autocompleteOptions"
                        :key="'standard-address-' + idx"
                        @click="selectAddress(address, 'standard', index)"
                        style="margin: 0.2em;"
                      >
                        {{ address }}
                        <v-icon style="margin-left: 0.4em;" color="success">mdi-plus-circle-outline</v-icon>
                      </v-chip>
                    </v-chip-group>
                  </v-col>
                  <div v-if="stock.loading" class="aligner" style="margin-top: 1em; width: 100%; margin-bottom: 3em;">
                    <SpinnLoader :loading="stock.loading"></SpinnLoader>
                </div>
            </v-row>



                <div class="aligner">
                    <v-btn @click="addStandardStock" variant="elevated">
                        <v-icon start>mdi-plus-circle-outline</v-icon>
                        Ajouter position
                    </v-btn>
                </div>
         
              </v-card>
            </v-card>
          </v-form>
  
            <v-card-actions style="margin-top: 1em;">
              <v-spacer></v-spacer>
              <v-btn color="red" text @click="isActive.value = false">Fermer</v-btn>
              <v-btn variant="elevated" color="success" @click="submitClient(); isActive.value = false">
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

.aligner {
    margin-top: -1em;
    margin-bottom: 1em;
}
</style>