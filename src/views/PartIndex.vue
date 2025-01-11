<script setup>
// Services
import { ref, onMounted, watch, computed } from 'vue'
import sessionStore from '@/stores/sessionStore';
import { partHeaders } from '@/models/tableHeaders';
import { useRouter } from 'vue-router';

// Components
import apiCaller from '@/services/apiCaller';
import DeletePart from '@/components/modals/DeletePart.vue';
import CreatePart from '@/components/modals/CreatePart.vue';
import EditPart from '@/components/modals/EditPart.vue';
import CardTitle from '@/components/CardTitle.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';

const userParts = ref(null)
const filteredParts = ref(null)
const selectedCompany = computed(() => {
  return sessionStore.getters.getSelectedCompany()
})
const router = useRouter();
const searchKeyword = ref(null)
const loading = ref(false)
const clients = ref([])
const selectedClient = ref(null)

let timeout = null

function routeToPart(event, {item}) {
    const parsedItem = JSON.parse(JSON.stringify(item));

    router.push({ name: `PartRelatedData`, params: { id: parsedItem.id } });
}

async function fetchParts() {
    loading.value = true
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts`);

    userParts.value = response;
    filteredParts.value = response;

    loading.value = false
}

async function fetchClients() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/clients`);

    clients.value = response;
}

// Watch function to filter parts based on searchKeyword
watch([selectedClient, searchKeyword], ([newClientName, newKeyword]) => {
    if (newClientName == null && newKeyword == null) {
        return;
    }
    
    if (timeout) {
        clearTimeout(timeout);
    }

    loading.value = true;

    timeout = setTimeout(() => {
        let filtered = userParts.value;

        if (newClientName) {
            filtered = filtered.filter(part => part.client_name === newClientName);
        }

        if (newKeyword) {
            const keyword = newKeyword.toLowerCase();
            filtered = filtered.filter(part =>
                (part.designation && part.designation.toLowerCase().includes(keyword)) ||
                (part.reference && part.reference.toLowerCase().includes(keyword))
            );
        }

        filteredParts.value = filtered;
        loading.value = false;
    }, 800); // Set a debounce delay of 300ms
});

watch(() => selectedCompany.value, // Watching the computed value's reactive property
    async (newCompany, oldCompany) => {
        if (newCompany && newCompany.id !== oldCompany?.id) {
            await fetchClients();
            await fetchParts();
        }
    }
);

async function fetchData() {
    loading.value = true

    setTimeout(async() => {
        await fetchParts()
        await fetchClients()
        loading.value = false
    }, 600);
}

onMounted(async() => {
    sessionStore.actions.initializeAuthState()
    selectedCompany.value = sessionStore.getters.getSelectedCompany();

    if (selectedCompany.value) {
        await fetchData()
    }
})
</script>

<template>
    <SpinnLoader :loading="loading" />
    <div class="main-card">
        <CreatePart 
            :origin="'single'"
            @refresh-parts="fetchParts()"
        ></CreatePart>

        <v-card class="b1-container" style="margin-top: 1.4em;">
            <div class="d-flex flex-column">
                <span class="informative-text">
                    <v-chip
                      class="mt-2"
                      variant="tonal"
                      color="secondary"
                    >
                      <v-icon start class="ml-0">mdi-sort</v-icon>
                      Filtrer par référence, désignation et client
                    </v-chip>
                </span>
            </div>
        <v-row style="width: 100%;">
            <v-col cols="8" class="d-flex align-content-center">
                <v-text-field
                    class="ml-4"
                    variant="underlined"
                    prepend-icon="mdi-magnify"
                    label="Recherchez une pièce..."
                    clearable
                    v-model="searchKeyword"
                />
            </v-col>
            <v-col cols="4">
                <v-select
                    prepend-icon="mdi-account-outline"  
                    variant="underlined"
                    :items="clients.map(cl => cl.name) || []"
                    label="Filtrez par client"
                    clearable
                    v-model="selectedClient"
                >
                <template v-slot:selection="{ item }">
                    <v-chip
                        v-if="item"
                        class="ma-1"
                        variant="elevated"
                        color="primary"
                    >
                        {{ item.title }}
                    </v-chip>
                </template>
                </v-select>
            </v-col>
        </v-row>
        <div class="aligner" style="margin: -1.6em 0em 0.2em 0em">
            <v-icon style="margin-right: -12px;">mdi-alert-circle-outline</v-icon>
            <span class="informative-text">La recherche d'une pièce s'applique sur les champs <strong>référence</strong> et <strong>désignation</strong></span>
        </div>
        </v-card>

        <v-card class="b1-container" style="margin-bottom: 0.8em; margin-top: 0.2em;">
            <CardTitle
                title="Catalogue des pièces"
                icon="mdi-list-box-outline"
            />
            <v-data-table
                :loading="loading"
                loading-text="Recherche..."
                density="compact"
                hover
                no-data-text="Aucune pièce ne répond à vos critères de recherche"
                :headers="partHeaders"
                :items="filteredParts || []"
                @click:row="routeToPart"
            >
            <template v-slot:item.reference="{ item }">
                <v-chip class="index-slot" variant="elevated" color="white">
                    <v-icon class="mr-1">mdi-cog-outline</v-icon>
                    {{ item.reference + ' ' + item.designation }}
                </v-chip>
            </template>
            <template v-slot:item.latest_supplier_price="{ item }">
                <v-chip
                    v-if="item.latest_supplier_price"
                    class="index-slot"
                    variant="outlined"
                    color="blue"
                >
                    {{ item.latest_supplier_price }}
                </v-chip>
                <v-chip 
                    variant="tonal"
                    color="secondary"
                    v-else
                >
                    <v-icon>
                        mdi-help-circle-outline
                    </v-icon>
                </v-chip>
            </template>
            <template v-slot:item.latest_client_price="{ item }">
                <v-chip
                    v-if="item.latest_client_price"
                    class="index-slot"
                    variant="outlined"
                    color="blue"
                >
                    {{ item.latest_client_price }}
                </v-chip>
                <v-chip 
                    variant="tonal"
                    color="secondary"
                    v-else
                >
                    <v-icon>
                        mdi-help-circle-outline
                    </v-icon>
                </v-chip>
            </template>
            <template v-slot:item.urgencies="{ item }">
                <div class="actions-slot">
                    <v-chip
                        v-if="item.unsorted_positions_count > 0"
                        class="index-slot"
                        variant="elevated"
                        color="red"
                        style="margin-right: 0.6em; font-weight: 600;"
                    >
                        <v-icon start class="ml-1">mdi-gesture-spread</v-icon>
                        <span class="mr-1">Position à trier</span>
                    </v-chip>
                    <v-chip
                        v-else
                        class="index-slot"
                        variant="outlined"
                        color="success"
                        style="font-weight: 500;"
                    >
                        <v-icon>mdi-check-circle-outline</v-icon>
                    </v-chip>
                </div>
            </template>
            <template v-slot:item.actions="{ item }">
                
                <div class="actions-slot">
                    <EditPart
                        v-if="selectedCompany && item"
                        :selected-company-id="selectedCompany.id"
                        :part-id="item.id"
                    />
                    <DeletePart
                        v-if="selectedCompany && item"
                        :selected-company-id="selectedCompany.id"
                        :part-id="item.id"
                        :designation="item.designation"
                        :reference="item.reference"
                        @refresh-parts="fetchParts()"
                    />
                    <td class="arrow-cell">
                        <v-icon class="hover-arrow">mdi-chevron-right</v-icon>
                    </td>
                </div>  
            </template>
            </v-data-table>
    
        </v-card>
    </div>
</template>

<style scoped lang="scss">
@import url(../assets/main.scss);


.parts-table .table-row {
    position: relative;
    cursor: pointer;
}

.parts-table .arrow-cell {
    text-align: right;
    padding: 0 16px;
}

.parts-table .hover-arrow {
    visibility: hidden;
    transition: visibility 0.2s, opacity 0.2s;
    opacity: 0;
    font-size: 1.5rem;
    color: var(--v-primary-base);
}

.parts-table .table-row:hover .hover-arrow {
    visibility: visible;
    opacity: 1;
}

.top-card {
    margin: 0.4em 0.4em;
    width: 52vw;
}

.index-slot {
    margin: 0.4em 0em;
}

</style>