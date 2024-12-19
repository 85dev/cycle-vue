<script setup>
// Services
import { ref, onMounted } from 'vue'
import sessionStore from '@/stores/sessionStore';
import { supplierHeaders } from '@/models/tableHeaders';

// Components
import apiCaller from '@/services/apiCaller';
import CreateSupplier from '@/components/modals/CreateSupplier.vue';

const suppliers = ref(null)
const userId = ref(null)
const loading = ref(false)

async function fetchSuppliers() {
    loading.value = true
    const response = await apiCaller.get(`users/${userId.value}/suppliers`);

    suppliers.value = response;
    loading.value = false
}

onMounted(async() => {
    sessionStore.actions.initializeAuthState()
    userId.value = sessionStore.getters.getUserID();

    await fetchSuppliers()
})
</script>

<template>
    <div class="main-card">
        <CreateSupplier origin="single"></CreateSupplier>
       
        <v-card title="Liste des fournisseurs" append-icon="mdi-progress-wrench" class="top-card">
            <v-data-table
                :loading="loading"
                loading-text="Recherche..."
                :headers="supplierHeaders"
                density="dense"
                hover
                :items="suppliers || []"
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
            <template v-slot:item.knowledge="{ item }">
                <v-chip
                    v-if="item.knowledge"
                    class="index-slot"
                    variant="text"
                >
                    {{ item.knowledge }}
                </v-chip>
                <v-chip
                    v-else
                    variant="text"
                >
                    Aucun savoir-faire renseigné
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