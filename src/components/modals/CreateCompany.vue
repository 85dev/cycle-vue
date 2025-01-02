<script setup>
// Services
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import autocomplete from '@/services/addressAutocomplete.js'

// Components
import SpinnLoader from '../SpinnLoader.vue';
import CardTitle from '../CardTitle.vue';

// Vue essentials
import { ref, watch, onMounted } from 'vue';

// internal logic
const userId = ref(0)
const autocompletedAddresses = ref([])
const loading = ref(false)
const company = ref({
  name: '',
  legal_structure: '',
  address: '',
  country: '',
  tax_id: '',
  registration_number: '',
  website: '',
  authorized_signatory: '',
  tax_rate: 20.0,
  invoice_prefix: '',
  invoice_terms: '',
  legal_notice: ''
});

function selectAddress(newAddress) {
    company.value.address = newAddress;

    const addressParts = newAddress.split(' ');
    company.value.country = addressParts[addressParts.length - 1];

    autocompletedAddresses.value = []
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

async function submitCompany() {
    const payload = {
        company: { ...company.value }
    };

    const response = await apiCaller.post(`users/${userId.value}/companies`, payload, false)
}

watch(() => company.value.address, (newAddress) => {
  if (!newAddress) {
    company.value.country = null; // Reset the country if address is null or undefined
  }
});

onMounted(() => {
    userId.value = sessionStore.getters.getUserID()
})
</script>

<template>
      <v-dialog class="secundary-dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-card
                v-bind="activatorProps"
                class="d-flex flex-column align-center"
                elevation="2"
                style="width: 200px; text-align: center; cursor: pointer; padding: 2em"
                >
                <v-icon size="48" color="orange">mdi-office-building-plus</v-icon>
                <span style="margin-top: 1em;">Créer un compte entreprise</span>
            </v-card>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card>
                    <CardTitle
                        title="Créer une entreprise"
                        icon="mdi-office-building"
                    />
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <div style="padding: 1em">
                        <v-chip class="mb-2" variant="elevated">
                            <v-icon class="mr-2">mdi-card-account-details-outline</v-icon>
                            Informations sur la société
                        </v-chip>
                        <v-row class="compact-row">
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Nom complet"
                            v-model="company.name"
                            class="mr-2"
                            required
                        ></v-text-field>
                        </v-col>
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Structure légale"
                            v-model="company.legal_structure"
                            class="mr-2"
                            required
                        ></v-text-field>
                        </v-col>
                    </v-row>

                    <v-row class="compact-row">
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Adresse"
                            v-model="company.address"
                            clearable
                            @input="fetchAddressAutocomplete(company.address)"
                            class="mr-2"
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
                                    style="display: flex; justify-content: center; align-items: center; height: fit-content; min-height: 32px; padding: 0em 1em; border-radius: 12px;"
                                    @click="selectAddress(address)"
                                >
                                    {{ address }}
                                    <v-icon style="margin-left: 0.4em;" color="success">mdi-plus-circle-outline</v-icon>
                                </v-chip>
                            </v-chip-group>
                        </v-col>
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Pays"
                            disabled
                            v-model="company.country"
                            class="mr-2"
                            required
                        ></v-text-field>
                        </v-col>
                    </v-row>

                    <v-row class="compact-row">
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Numéro d'identification fiscale"
                            v-model="company.tax_id"
                            class="mr-2"
                            required
                        ></v-text-field>
                        </v-col>
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Numéro d'enregistrement"
                            v-model="company.registration_number"
                            class="mr-2"
                            required
                        ></v-text-field>
                        </v-col>
                    </v-row>

                    <v-row class="compact-row">
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Site web"
                            v-model="company.website"
                            class="mr-2"
                        ></v-text-field>
                        </v-col>
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Signataire autorisé"
                            v-model="company.authorized_signatory"
                            class="mr-2"
                        ></v-text-field>
                        </v-col>
                    </v-row>

                    <v-chip class="mt-6 mb-2" variant="elevated">
                            <v-icon class="mr-2">mdi-currency-usd</v-icon>
                            Informations de facturation
                        </v-chip>
                    <v-row class="compact-row">
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Taxe sur la valeur ajoutée (%)"
                            v-model="company.tax_rate"
                            class="mr-2"
                        ></v-text-field>
                        </v-col>
                        <v-col cols="6">
                        <v-text-field
                            variant="underlined"
                            label="Préfixe de facture"
                            v-model="company.invoice_prefix"
                            class="mr-2"
                        ></v-text-field>
                        </v-col>
                    </v-row>

                    <v-row class="compact-row">
                        <v-col cols="6">
                        <v-textarea
                            variant="underlined"
                            label="Conditions de facturation"
                            v-model="company.invoice_terms"
                            class="mr-2"
                        ></v-textarea>
                        </v-col>
                        <v-col cols="6">
                        <v-textarea
                            variant="underlined"
                            label="Mentions légales"
                            v-model="company.legal_notice"
                            class="mr-2"
                        ></v-textarea>
                        </v-col>
                    </v-row>
                    </div>

                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            variant="tonal"
                            text="FERMER"
                            @click="isActive.value = false"
                        />

                        <v-btn
                            variant="elevated"
                            color="success"
                            text="CREER"
                            @click="submitCompany(); isActive.value = false"
                        />

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

.compact-row {
    margin-bottom: -2.8em;
}
</style>