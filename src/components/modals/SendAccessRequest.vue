<script setup>
// Components
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import SpinnLoader from '../SpinnLoader.vue';

// Services
import { ref, onMounted } from 'vue';
import CardTitle from '../CardTitle.vue';
import Popup from '../Popup.vue';

const loading = ref(false)
const userId = ref(0)
const email = ref(null)
const selectedCompany = ref(null)
const ownedCompanies = ref([])
const requestedOwnerRights = ref(false)

const snackbarVisible = ref(false);
const snackbarMessage = ref('');
const snackbarType = ref('');

const emit = defineEmits(['refresh'])

function triggerSnackbar(message, type) {
  snackbarMessage.value = message;
  snackbarType.value = type;
  snackbarVisible.value = true;
}

async function fetchOwnedCompanies() {
    const response = await apiCaller.get(`users/${userId.value}/owner_companies_index`, false)
    ownedCompanies.value = response;
}

async function sendRequest() {
    if (!selectedCompany.value || !email.value) {
        triggerSnackbar("Cochez une entreprise et renseignez un email valide.", "red");
        return;
    }

    loading.value = true;

    try {
        const payload = {
            company_id: selectedCompany.value.id,
            requested_owner_rights: requestedOwnerRights.value,
            email: email.value
        };

        const response = await apiCaller.post(`users/${userId.value}/send_access_request`, payload, false);

        if (response?.status === 200 || response?.status === 201) {
            triggerSnackbar(response.data?.message || "Demande envoyée avec succès.", "success");
            emit("refresh");
        } else {
            triggerSnackbar(response.data?.error || "Une erreur est survenue.", "red");
        }

    } catch (error) {
        if (error.response) {
            const errorMessage = error.response.data?.error || "Une erreur est survenue.";
            triggerSnackbar(errorMessage, "red");
        } else {
            triggerSnackbar("Erreur de connexion. Veuillez réessayer.", "red");
        }
    } finally {
        loading.value = false;
    }
}

onMounted(async() => {
    userId.value = sessionStore.getters.getUserID()
    await fetchOwnedCompanies()
})
</script>

<template>
    <Popup
        :alertText="snackbarMessage"
        :snackbar="snackbarVisible"
        :alertType="snackbarType"
        @updateSnackbar="(value) => (snackbarVisible = value)"
    />
    <SpinnLoader :loading="loading" text="Validation de l'accès"></SpinnLoader>
      <v-dialog class="secundary-dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-list variant="elevated" density="compact" nav style="width: 100%; transition: all 0.2s; margin-top: -0.80em;">
                <v-list-item color="blue" v-bind="activatorProps" style="display: flex;" nav>
                    <div class="aligner">
                        <v-list-item-icon>
                        <v-icon style="margin-right: 0.4em;">mdi-account-multiple-plus-outline</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title style="margin-right: 0.2em;">Accorder un accès</v-list-item-title>
                    </div>
                </v-list-item>                
            </v-list>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        title="Autoriser l'accès"
                        icon="mdi-account-check-outline"
                    />
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <v-card style="padding: 0.4em; margin: 0em 12px">
                        <v-chip variant="elevated" class="d-flex align-center justify-center ma-2" color="blue" style="width: fit-content;">
                            <v-icon class="mr-2">mdi-office-building-outline</v-icon>
                            <span>Sélectionnez le compte entreprise sur lequel autoriser l'accès</span>
                        </v-chip>
                            <v-radio-group
                                style="margin-bottom: -18px;"
                                v-if="ownedCompanies && ownedCompanies.length > 0"
                                v-model="selectedCompany"
                            >
                            <v-radio
                                v-for="company in ownedCompanies"
                                :key="company.id"
                                :label="company.name"
                                :value="company"
                                color="blue"
                            ></v-radio>
                        </v-radio-group>

                        <span class="informative-text mr-2 ml-2"> 
                            <v-icon class="mr-2" color="warning">mdi-alert-circle-outline</v-icon>
                            L'utilisateur ayant les droits propriétaire pourra gérer les accès et les informations de l'entreprise.
                        </span>
                        <v-checkbox
                            v-model="requestedOwnerRights"
                            color="success"
                            label="Attribuer les droits propriétaire"
                        />
                        
                        <v-text-field 
                            style="margin-top: -24px;"
                            class="ml-2 mr-2"
                            variant="solo"
                            v-model="email"
                            label="Email de l'utilisateur à autoriser"
                        />
                    </v-card>
                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            variant="tonal"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>

                        <v-btn
                            variant="elevated"
                            color="success"
                            text="VALIDER"
                            @click="sendRequest();"
                        ></v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

</style>