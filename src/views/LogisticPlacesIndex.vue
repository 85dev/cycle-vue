<script setup>
// Services
import { ref, onMounted } from 'vue'
import sessionStore from '@/stores/sessionStore';
import { subcontractorIndexHeaders } from '@/models/tableHeaders';

// Components
import apiCaller from '@/services/apiCaller';
import CreateLogisticPlace from '@/components/modals/CreateLogisticPlace.vue';

const logisticPlaces = ref(null)
const userId = ref(null)
const loading = ref(false)

async function fetchLogisticPlaces() {
    loading.value = true
    const response = await apiCaller.get(`users/${userId.value}/logistic_places`);

    logisticPlaces.value = response;
    loading.value = false
}

onMounted(async() => {
    sessionStore.actions.initializeAuthState()
    userId.value = sessionStore.getters.getUserID();

    await fetchLogisticPlaces()
})
</script>

<template>
    <div class="main-card">
        <CreateLogisticPlace origin="single"></CreateLogisticPlace>
       
        <v-card title="Liste des lieux de stockage" append-icon="mdi-progress-wrench" class="top-card">
            <v-data-table
                :loading="loading"
                loading-text="Recherche..."
                :headers="subcontractorIndexHeaders"
                density="dense"
                hover
                :items="logisticPlaces || []"
            >
            <template v-slot:item.name="{ item }">
                <v-chip
                    class="index-slot"
                    variant="elevated"
                    color="blue"
                >
                    <v-icon class="mr-2">mdi-account-outline</v-icon>
                    {{ item.name }}
                </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
                <div class="actions-slot">
                    
                </div>  
            </template>
            </v-data-table>
    
        </v-card>
    </div>
</template>

<style scoped lang="scss">

.top-card {
    margin: 0.4em 0.4em;
    width: 52vw;
}

.index-slot {
    margin: 0.4em 0em;
}
</style>