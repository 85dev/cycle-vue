<script setup>
import { onMounted, ref, defineEmits, computed } from 'vue';
import sessionStore from '@/stores/sessionStore.js' // Import the new store

// Components
import CardTitle from '../CardTitle.vue';
import Microloader from '../Microloader.vue';

// Services
import apiCaller from '@/services/apiCaller.js';
import autocomplete from '@/services/addressAutocomplete.js'

const selectedCompany = computed(() => { return sessionStore.getters.getSelectedCompany() })
const address = ref(null)
const name = ref(null)
const autocompletedAddresses = ref([])
const loading = ref(false)
const spinnLoading = ref(false)
const contacts = ref([{ email: '', first_name: '', last_name: '', role: '' }]);
const knowledge = ref('')

const props = defineProps({
    origin: {
        type: String,
    },
})

function addContact() {
  contacts.value.push({ email: '', first_name: '', last_name: '', role: '' });
}

function removeContact(index) {
  contacts.value.splice(index, 1);
}

const emit = defineEmits(['refreshSuppliers'])

async function fetchAddressAutocomplete(address) {
    if (address) {
    try {
        spinnLoading.value = true;
        autocompletedAddresses.value = await autocomplete.fetchAddressAutocomplete(address)
    } catch (error) {
        console.error('Error fetching addresses:', error);
    } finally {
        spinnLoading.value = false;
    }
  }
}

async function submitSupplier() {
    const supplier = {
        supplier: {
            name: name.value,
            address: address.value,
            knowledge: knowledge.value,
            contacts: contacts.value.map(({ email, first_name, last_name, role }) => ({ email, first_name, last_name, role, contactable_type: "supplier" })),
        }
    }

    await apiCaller.post(`companies/${selectedCompany.value.id}/create_supplier`, supplier, true)

    emit('refreshSuppliers')
}

function selectAddress(newAddress) {
    address.value = newAddress;
}

onMounted(async() => {
    selectedCompany.value = sessionStore.getters.getSelectedCompany()
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
                    <v-icon class="mr-2">mdi-factory</v-icon>
                    <span class="informative-text">Ajouter un fournisseur</span>
            </v-card>
            <v-btn v-bind="activatorProps" v-if="props.origin === 'single'" style="margin: 1em 0em 0.6em 0em;">
                <v-icon style="margin-right: 0.4em">mdi-factory</v-icon>
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
                            />

                            <v-text-field
                                variant="underlined"
                                class="form-part"
                                v-model="address"
                                @input="fetchAddressAutocomplete(address)"
                                label="Addresse"
                                required
                            />

                            <div style="display: flex; justify-content: center;" v-if="spinnLoading">
                                <Microloader class="mt-0 mb-4" :loading="spinnLoading"/>
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

                            <v-textarea
                                variant="underlined"
                                class="form-part"
                                label="Savoir-faire / expertise"
                                v-model="knowledge"
                                required
                            />
                            <v-card flat outlined>
                                <v-card style="margin: 0.4em;">
                                    <CardTitle
                                    title="Contacts"
                                    icon="mdi-account-multiple-outline"
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
                                        <v-btn @click="removeContact(index)" icon small>
                                        <v-icon>mdi-delete-outline</v-icon>
                                        </v-btn>
                                    </v-col>
                                    </v-row>
                                    <div class="aligner mb-3">
                                    <v-btn @click="addContact" variant="elevated">
                                        <v-icon start>mdi-plus-circle-outline</v-icon>
                                        Ajouter
                                    </v-btn>
                                    </div>
                                </v-card>
                            </v-card>
                        </v-form>

                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        />
            
                        <v-btn 
                            variant="elevated"
                            color="success"
                            @click="submitSupplier(); isActive.value = false">
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