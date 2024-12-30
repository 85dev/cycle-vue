<script setup>
import { onMounted, ref } from 'vue'
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';

import { expeditionsIndexHeaders } from '@/models/tableHeaders'
import dateConverter from '@/services/dateConverter';
import DispatchExpedition from '@/components/modals/DispatchExpedition.vue';
import CreateExpedition from '@/components/modals/CreateExpedition.vue';
import ExpeditionDetails from '@/components/modals/ExpeditionDetails.vue';

const userId = ref(null)
const runningExpeditions = ref(null)
const deliveredExpeditions = ref(null)
const suppliers = ref([])

async function fetchSuppliers() {
    const response = await apiCaller.get(`users/${userId.value}/suppliers`)
    suppliers.value = response
}

async function fetchExpeditions() {
    const response = await apiCaller.get(`users/${userId.value}/undelivered_expeditions`) 
    runningExpeditions.value = response
}

async function fetchDeliveredExpeditions() {
    const response = await apiCaller.get(`users/${userId.value}/delivered_expeditions`) 
    deliveredExpeditions.value = response
}

function expeditionStatus(status) {
    if (status === 'undelivered') {
        return 'En transit'
    } else if (status === 'delivered') {
        return 'Livré'
    }
}

async function refreshExpeditions() {
    await fetchExpeditions()
    await fetchDeliveredExpeditions()
    await fetchSuppliers()
}

onMounted(async() => {
    sessionStore.actions.initializeAuthState()
    userId.value = sessionStore.getters.getUserID();

    await refreshExpeditions()
})

</script>

<template>
    <v-card class="main-card">
        <CreateExpedition
            v-if="userId && suppliers && suppliers.length > 0"
            origin="single"
            :user-id="userId"
            :suppliers="suppliers"
            @refresh-expeditions="refreshExpeditions()"
        ></CreateExpedition>
        <v-card class="b1-container mt-3">
            <v-card-title class="d-flex">
                EXPEDITIONS EN COURS
            </v-card-title>
            <v-data-table
            v-if="runningExpeditions && runningExpeditions.length > 0"
            :headers="expeditionsIndexHeaders"
            :items="runningExpeditions || []"
            density="dense"
            >
                <template v-slot:item.real_departure_time="{ item }">
                {{ new Date(item.real_departure_time).toLocaleDateString() }}
                </template>
                <template v-slot:item.arrival_time="{ item }">
                {{  item.arrival_time ? new Date(item.arrival_time).toLocaleDateString() : 'Pas de date d\'arrivée' }}
                </template>
                <template v-slot:item.status="{ item }">
                    <v-chip variant="elevated" color="blue" style="margin: 0.2em 0em">
                        <v-icon class="mr-1">mdi-ferry</v-icon>
                        {{ expeditionStatus(item.status) }}
                    </v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                <div class="actions-slot">
                    <DispatchExpedition 
                        :user-id="userId"
                        :expedition="item"
                        @refresh-expeditions="refreshExpeditions()"
                    >
                    </DispatchExpedition>
                </div>
                </template>
            </v-data-table>
            <div v-else class="d-flex flex-wrap align-items-center">
              <v-chip
                class="ma-1 mt-2"
                style="width: fit-content;"
                variant="tonal"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-backspace-reverse-outline</v-icon>
                <span class="mr-1" >Aucune expédition en cours</span>
              </v-chip>
            </div>
        </v-card>
        <v-card class="b1-container mb-3">
            <v-card-title class="d-flex">
                EXPEDITIONS TERMINEES
            </v-card-title>
            <v-data-table
                v-if="deliveredExpeditions && deliveredExpeditions.length > 0"
                no-data-text="Aucune expédition passée enregsitrée"
                :headers="expeditionsIndexHeaders"
                :items="deliveredExpeditions || []"
                density="dense"
            >
                <template v-slot:item.real_departure_time="{ item }">
                    {{ new Date(item.real_departure_time).toLocaleDateString() }}
                </template>
                <template v-slot:item.arrival_time="{ item }">
                    {{ new Date(item.arrival_time).toLocaleDateString() }}
                </template>
                <template v-slot:item.status="{ item }">
                    <v-chip variant="elevated" style="margin: 0.2em 0em" outlined>
                        <v-icon color="success" style="margin-right: 4px;" left>mdi-check-circle-outline</v-icon>
                        Livré
                    </v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                    <ExpeditionDetails
                        :user-id="userId"
                        :expedition="item"
                    ></ExpeditionDetails>
                </template>
            </v-data-table>
            <div v-else class="d-flex flex-wrap align-items-center">
              <v-chip
                class="ma-1 mt-2"
                style="width: fit-content;"
                variant="tonal"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-backspace-reverse-outline</v-icon>
                <span class="mr-1" >Aucune expédition terminée</span>
              </v-chip>
            </div>
        </v-card>
    </v-card>
</template>

<style scoped lang="scss">
@import url(../assets/main.scss);

.spacer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-top: 0.4em;
}
</style>