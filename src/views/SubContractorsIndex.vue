<script setup>
// Services
import { ref, onMounted } from 'vue'
import sessionStore from '@/stores/sessionStore';
import { subcontractorIndexHeaders } from '@/models/tableHeaders';

// Components
import apiCaller from '@/services/apiCaller';
import CreateClient from '@/components/modals/CreateClient.vue';
import CreateSubcontractor from '@/components/modals/CreateSubcontractor.vue';

const subcontractors = ref(null)
const userId = ref(null)
const loading = ref(false)

async function fetchSubcontractors() {
    loading.value = true
    const response = await apiCaller.get(`users/${userId.value}/subcontractors_index`);

    subcontractors.value = response;
    loading.value = false
}

onMounted(async() => {
    sessionStore.actions.initializeAuthState()
    userId.value = sessionStore.getters.getUserID();

    await fetchSubcontractors()
})
</script>

<template>
    <div class="main-card">
        <CreateSubcontractor origin="single"></CreateSubcontractor>
       
        <v-card title="Liste des sous-traitants" append-icon="mdi-progress-wrench" class="top-card">
            <v-data-table
                :loading="loading"
                loading-text="Recherche..."
                :headers="subcontractorIndexHeaders"
                density="dense"
                hover
                :items="subcontractors || []"
            >
            <template v-slot:item.name="{ item }">
                <v-chip
                    class="index-slot"
                    color="blue"
                    variant="elevated"
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
@import url(../assets/main.scss);

.top-card {
    margin: 0.4em 0.4em;
    width: 52vw;
}

.index-slot {
    margin: 0.4em 0em;
}
</style>