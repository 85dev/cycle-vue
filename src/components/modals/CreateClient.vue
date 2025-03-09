<script setup>
import { onMounted, ref, defineEmits, computed } from 'vue';
import sessionStore from '@/stores/sessionStore.js' // Import the new store

// Components
import SpinnLoader from '@/components/SpinnLoader.vue';

// Services
import apiCaller from '@/services/apiCaller.js';
import autocomplete from '@/services/addressAutocomplete.js'
import CardTitle from '../CardTitle.vue';

const userId = ref(null)
const address = ref(null)
const name = ref(null)
const autocompletedAddresses = ref([])
const clientLoading = ref(false)
const contacts = ref([{ email: '', first_name: '', last_name: '', role: '' }]);
const selectedCompany = computed(() => { return sessionStore.getters.getSelectedCompany() })

// For stock adding purposes
const consignmentStocks = ref([{ address: '', name: '', autocompleteOptions: [], loading: false }]);
const standardStocks = ref([{ address: '', name: '', autocompleteOptions: [], loading: false }]);

const emit = defineEmits(['refreshClients'])

const allowSubmit = computed(() => {
  // Check if there's at least one stock
  const hasStocks = consignmentStocks.value.length > 0 || standardStocks.value.length > 0;
  
  // Check if there's at least one contact with required fields
  const hasValidContact = contacts.value.some(contact => 
    contact.email && 
    contact.first_name && 
    contact.last_name && 
    contact.role
  );
  
  // Check if basic client info exists
  const hasBasicInfo = name.value && address.value;

  return hasStocks && hasValidContact && hasBasicInfo;
});

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

function addContact() {
  contacts.value.push({ email: '', first_name: '', last_name: '', role: '' });
}

function removeContact(index) {
  contacts.value.splice(index, 1);
}

async function submitClient() {
    const client = {
        client: {
            name: name.value,
            address: address.value,
            contacts: contacts.value.map(({ email, first_name, last_name, role }) => ({ email, first_name, last_name, role, contactable_type: "client" })),
            consignment_stocks: consignmentStocks.value.map(({ address, name }) => ({ address, name })),
            standard_stocks: standardStocks.value.map(({ address, name }) => ({ address, name })),
        }
    }

    const response = await apiCaller.post(`companies/${selectedCompany.value.id}/create_client`, client, true)

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
        <v-card
          v-if="props.origin !== 'single'"
            class="clickable-card d-flex align-center justify-center flex-column"
            outlined
            v-bind="activatorProps"
            style="height: 100px; width: 200px;"
            elevation="2"
            @click="openModal"
        >
            <v-icon class="mr-2">mdi-account-plus-outline</v-icon>
            <span class="informative-text">Ajouter un client</span>
        </v-card>
  
        <v-btn v-bind="activatorProps" v-if="props.origin === 'single'" style="margin: 1em 0em 0.6em 0em;">
          <v-icon style="margin-right: 0.4em">mdi-account-plus-outline</v-icon>
          Ajouter un client
        </v-btn>
      </template>
  
      <template v-slot:default="{ isActive }">
        <div style="padding: 0.4em; overflow-y: auto;">
          <v-card style="padding: 0.4em;">
            <CardTitle
              title="Ajouter un nouveau client"
              icon="mdi-account-plus-outline"
            />
            <v-divider style="margin: 0em 1em 1em 1em;"></v-divider>  
            <v-form class="form-container">
            <!-- Client Information Section -->
            <v-card style="margin: 0.4em">
            <CardTitle
              title="Informations de la société"
              icon="mdi-card-account-details-outline"
              color="dark"
            />
              <v-card-text>
                <v-row 
                    style="margin-top: -0.6em;"
                    no-gutters
                >
                  <v-col cols="6">
                    <v-text-field
                      variant="underlined"
                      label="Nom de la société"
                      v-model="name"
                      class="mr-2"
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      variant="underlined"
                      v-model="address"
                      @input="fetchAddressAutocomplete(address, 'client')"
                      class="mr-2"
                      label="Adresse"
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

            <!-- Contacts Section -->
            <v-card flat outlined>
              <v-card style="margin: 0.4em;">
                <CardTitle
                  title="Contacts"
                  icon="mdi-account-multiple-outline"
                  color="dark"
                />
                <div style="margin-bottom: 0.4em;">
                      <span class="informative-text" style="display: flex; align-items: center;">
                          <v-icon color="success" style="margin-right: 6px;">mdi-help-circle-outline</v-icon>
                          Les personnes suivantes seront ajoutées comme contacts de la société.
                      </span>
                  </div>
                <v-divider color="transparent" style="margin:0em 1em 1.4em 1em; padding: 0em 2em;"></v-divider>
                <v-row 
                    v-for="(contact, index) in contacts" 
                    :key="'contact-' + index" 
                    class="mb-4 align-center"
                    no-gutters
                    style="margin-top: -2em; padding: 0em 0.8em"
                >
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="contact.email"
                      label="Email"
                      :rules="[validateEmail]"
                      required
                      variant="underlined"
                      class="mr-2"
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="contact.first_name"
                      label="Prénom"
                      required
                      variant="underlined"
                      class="mr-2"
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model="contact.last_name"
                      label="Nom"
                      required
                      variant="underlined"
                      class="mr-2"
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="contact.role"
                      label="Rôle"
                      required
                      variant="underlined"
                      class="mr-2"
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="1" class="d-flex justify-end">
                    <v-btn @click="removeContact(index)" class="no-effects" icon small>
                      <v-icon>mdi-delete-outline</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <div class="aligner">
                  <v-btn @click="addContact" variant="elevated">
                    <v-icon start>mdi-plus-circle-outline</v-icon>
                    Ajouter
                  </v-btn>
                </div>
              </v-card>
            </v-card>

            <div style="margin-bottom: 0.4em;">
              <span class="informative-text" style="display: flex; align-items: center;">
                <v-icon color="success" style="margin-right: 6px;">mdi-help-circle-outline</v-icon>
                Un stock consignation client concentre les références mises à disposition chez le client, les références ne sont facturées qu'au moment de leurs consommations.
              </span>
              <span class="informative-text" style="display: flex; align-items: center;">
                <v-icon color="warning" style="margin-right: 6px;">mdi-alert-circle-outline</v-icon>
                <strong>Ne renseignez que les lieux de stockage détenus par l'entreprise</strong>
              </span>
            </div>

            <!-- Consignment Stocks Section -->
            <v-row no-gutters>
              <!-- Right Column: Standard Stocks -->
              <v-col cols="12" md="6" class="pl-2">
                <v-card outlined style="margin: 0.4em;">
                  <CardTitle
                    title="Vos lieux de stockage standard"
                    icon="mdi-dolly"
                    color="dark"
                  />
                  <v-divider color="transparent" style="margin: 0em 1em 1.4em 1em; padding: 0em 2em;"></v-divider>
                  
                  <v-row 
                    v-for="(stock, index) in standardStocks" 
                    :key="'standard-' + index" 
                    class="mb-4 align-center" 
                    no-gutters
                    style="margin-top: -2em; padding: 0em 0.8em"
                  >
                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model="stock.name"
                        label="Nom du stock"
                        required
                        variant="underlined"
                        class="mr-2"
                        clearable
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="7">
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
                    <v-col cols="12" md="1" class="d-flex justify-end">
                      <v-btn @click="removeStandardStock(index)" class="no-effects" icon small>
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
                      Ajouter
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
              <!-- Right Column: Consignment Stocks -->
              <v-col cols="12" md="6" class="pr-2">
                <v-card outlined style="margin: 0.4em;">
                  <CardTitle
                    title="Vos lieux de stockage consignation"
                    icon="mdi-package-variant-closed-check"
                    color="dark"
                  />
                  <v-divider color="transparent" style="margin: 0em 1em 1.4em 1em; padding: 0em 2em;"></v-divider>
                  
                  <v-row 
                    v-for="(stock, index) in consignmentStocks" 
                    :key="'consignment-' + index" 
                    class="mb-4 align-center"
                    no-gutters
                    style="margin-top: -2em; padding: 0em 0.8em"
                  >
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="stock.name"
                      label="Nom du stock"
                      required
                      variant="underlined"
                      class="mr-2"
                      clearable
                    ></v-text-field>
                  </v-col>
                    <v-col cols="12" md="7">
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
                    <v-col cols="12" md="1" class="d-flex justify-end">
                      <v-btn @click="removeConsignmentStock(index)" class="no-effects" icon small>
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
                      Ajouter
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-form>

          <div style="margin-bottom: 0.4em;">
            <span class="informative-text" style="display: flex; align-items: center;">
              <v-icon color="warning" style="margin-right: 6px;">mdi-alert-circle-outline</v-icon>
              Au moins un lieu de stockage (consignation ou standard) doit être enregistré pour valider la fiche client.
            </span>
          </div>
  
            <v-card-actions style="margin-top: 1em;">
              <v-spacer></v-spacer>
              <v-btn color="red" text @click="isActive.value = false">Fermer</v-btn>
                <v-btn variant="elevated" :disabled="!allowSubmit" color="success" @click="submitClient(); isActive.value = false">
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