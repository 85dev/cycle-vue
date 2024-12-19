<script setup>
// Services
import { ref, onMounted } from 'vue'
import sessionStore from '@/stores/sessionStore';
import { clientHeaders } from '@/models/tableHeaders';

// Components
import apiCaller from '@/services/apiCaller';
import CreateClient from '@/components/modals/CreateClient.vue';

const clients = ref(null)
const userId = ref(null)
const loading = ref(false)

async function fetchClients() {
    loading.value = true
    const response = await apiCaller.get(`users/${userId.value}/clients`);
    clients.value = response;
    loading.value = false
}

onMounted(async() => {
    sessionStore.actions.initializeAuthState()
    userId.value = sessionStore.getters.getUserID();

    await fetchClients()
})
</script>

<template>
    <div class="main-card">
        <CreateClient 
            origin="single"
            @refresh-clients="fetchClients()"
        />
       
        <v-card title="Liste des clients" append-icon="mdi-progress-wrench" class="top-card">
            <v-data-table
                :loading="loading"
                loading-text="Recherche..."
                :headers="clientHeaders"
                density="dense"
                hover
                :items="clients || []"
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
@import url(../assets/main.scss);

.top-card {
    margin: 0.4em 0.4em;
    width: 52vw;
}

.index-slot {
    margin: 0.4em 0em;
}
</style>