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
            origin="single"
            :user-id="userId"
            :suppliers="suppliers"
            @refresh-expeditions="refreshExpeditions()"
        ></CreateExpedition>
        <v-card style="margin: 1em" title="Index des expéditions en cours" class="b1-container">
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
                {{ new Date(item.arrival_time).toLocaleDateString() }}
                </template>
                <template v-slot:item.status="{ item }">
                    <v-chip variant="elevated" :color="dateConverter.getStatus(item).color" style="margin: 0.2em 0em" outlined>
                        <v-icon style="margin-right: 4px;" left>{{ dateConverter.getStatus(item).icon }}</v-icon>
                        {{ dateConverter.getStatus(item).message }}
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
            <div class="aligner" v-else>
                <span class="informative-text">
                    <v-icon>mdi-help-circle-outline</v-icon>
                    Aucune expédition actuellement en transit
                </span>
            </div>
        </v-card>
        <v-card style="margin: 0em 1em 0.7em 1em" title="Index des expéditions passées" class="b1-container">
            <v-data-table
            v-if="deliveredExpeditions"
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
                    <v-chip variant="elevated" color="success" style="margin: 0.2em 0em" outlined>
                        <v-icon style="margin-right: 4px;" left>mdi-check-circle-outline</v-icon>
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