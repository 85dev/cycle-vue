<script setup>
// Services
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import CardTitle from '../CardTitle.vue';
import { searchCompanyHeaders } from '@/models/tableHeaders'

// Vue essentials
import { ref, onMounted, watch } from 'vue';

const userId = ref(0)
const companies = ref([])
const selectedCompany = ref([])
const requestedOwnerRights = ref(false) // New reactive variable for ownership request
const filteredCompanies = ref([])
const searchQuery = ref("")
const loading = ref(false);
const timeout = ref(null);

function selectedCompanyName() {
    const selectedIds = Array.isArray(selectedCompany.value?.[0])
        ? selectedCompany.value[0]
        : selectedCompany.value;

    if (!selectedIds || selectedIds.length === 0) {
        return 'Aucune entreprise sélectionnée';
    }
    
    const company = companies.value.find(cp => selectedIds.includes(cp.id));
    
    return company ? company.name : 'Nom introuvable';
}

async function fetchCompanies() {
    const response = await apiCaller.get(`users/${userId.value}/companies_index`)
    companies.value = response;
    filteredCompanies.value = [...response]; //
}

async function submitRequest() {
    const response = await apiCaller.get(`accounts/${userId.value}/companies/${selectedCompany.value}/request_access?requested_owner_rights=${requestedOwnerRights.value}`)
    
    sessionStore.actions.fetchPendingAccounts()
}

function selectCompany(event, {item}) {
    selectedCompany.value = item.name; // Set the company name as selected
}

watch(searchQuery, (newQuery) => {
    if (!newQuery) {
        filteredCompanies.value = [...companies.value]; // Reset to all companies if query is null or empty
        return; // Exit the function early
    }

    loading.value = true;

    if (timeout.value) {
        clearTimeout(timeout.value);
    }

    timeout.value = setTimeout(() => {
        filteredCompanies.value = companies.value.filter(company =>
        company.name.toLowerCase().includes(newQuery.toLowerCase())
    );
    loading.value = false
    }, 800);

});

watch(selectedCompany, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        requestedOwnerRights.value = false; // Reset requestedOwnerRights whenever selectedCompany changes
    }
});

onMounted(async() => {
    userId.value = sessionStore.getters.getUserID()

    await fetchCompanies()
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
                <v-icon size="48" color="blue">mdi-account-multiple-plus</v-icon>
                <span style="margin-top: 1em;">Rejoindre une entreprise</span>
            </v-card>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card>
                    <CardTitle
                        title="Rejoindre une entreprise"
                        icon="mdi-account-plus"
                    />
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <div style="padding: 0em 1em; margin-top: 0.8em;">
                       
                        <span class="informative-text" style="margin-left: 0em">
                            Recherchez l'entreprise que vous souhaitez rejoindre :
                        </span>
        
                        <v-text-field
                            variant="underlined"
                            clearable
                            v-model="searchQuery"
                            lable="Société"
                            prepend-icon="mdi-magnify"
                        >
                            <template v-slot:selection="{ item }">
                                <v-chip class="pt-2 pb-2 ma-1 pr-4 pl-4" variant="elevated" color="blue">
                                    <v-icon class="mr-1">mdi-account-group</v-icon>
                                    {{ item.title }}
                                </v-chip>
                            </template>
                        </v-text-field>

                        <v-card>
                            <v-data-table
                                v-model="selectedCompany"
                                show-select
                                select-strategy="single"
                                :loading="loading"
                                loading-text="Chargement des entreprises..."
                                density="compact"
                                items-per-page="5"
                                :headers="searchCompanyHeaders"
                                @click:row="selectCompany"
                                hover
                                no-data-text="Aucune entreprise trouvée"
                                :items="filteredCompanies"
                            >
                                <template v-slot:item.name="{ item }">
                                <v-chip class="index-slot" variant="outlined">
                                    <v-icon class="mr-1">mdi-office-building</v-icon>
                                    {{ item.name }}
                                </v-chip>
                                </template>
                                <template v-slot:item.id="{ item }">
                                <v-chip class="index-slot" variant="tonal" color="secondary">
                                    {{ item.id }}
                                </v-chip>
                                </template>
                                <template v-slot:item.address="{ item }">
                                    <v-chip class="index-slot" variant="outlined" color="blue">
                                        <v-icon class="mr-1">mdi-map-marker</v-icon>
                                        {{ item.address ? item.address.substring(0, 25) + (item.address.length > 25 ? '...' : '') : 'Non renseignée' }}
                                    </v-chip>
                                </template>
                            </v-data-table>
                        </v-card>
                        <v-card class="pa-2 mt-2">
                            <v-chip
                                class="mt-2 mb-2 ml-2"
                                variant="outlined"
                                color="blue"
                            >
                                Entreprise sélectionnée : <strong class="ml-1">{{ selectedCompanyName() }}</strong>
                            </v-chip>

                            <v-checkbox
                                :disabled="selectedCompany.length === 0"
                                style="margin-bottom: -2em;"
                                v-model="requestedOwnerRights"
                                color="blue"
                                label="Demander également les droits propriétaire"
                            />
                        </v-card>
                            
                    </div>

                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            variant="tonal"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>

                        <v-btn
                            :disabled="selectedCompany.length === 0"
                            variant="elevated"
                            color="success"
                            text="ENVOYER LA DEMANDE"
                            @click="submitRequest(); isActive.value = false"
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