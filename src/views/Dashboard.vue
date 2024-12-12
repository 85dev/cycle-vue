<script setup>
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import { ref, onMounted, computed } from 'vue'

const clientOrders = ref([])
const userId = ref(0)
const startDate = ref(null)
const endDate = ref(null)
const selectedClient = ref(null)
const selectedSupplier = ref(null)
const clients = ref([])
const suppliers = ref([])
const runningExpeditions = ref([])

async function fetchClientOrders() {
    const response = await apiCaller.get(`users/${userId.value}/future_user_client_orders`)
    clientOrders.value = response
}

async function fetchClients() {
    const response = await apiCaller.get(`users/${userId.value}/clients`)
    clients.value = response
}

async function fetchSuppliers() {
    const response = await apiCaller.get(`users/${userId.value}/suppliers`)
    suppliers.value = response
}

async function fetchExpeditions() {
    const response = await apiCaller.get(`users/${userId.value}/undelivered_expeditions`) 
    runningExpeditions.value = response
}

const filteredOrders = computed(() => {
  let orders = clientOrders.value;

  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    orders = orders.filter(order => {
      const deliveryDate = new Date(order.position_delivery_date);
      return deliveryDate >= start && deliveryDate <= end;
    });
  }

  if (selectedClient.value) {
    orders = orders.filter(order => order.client_name === selectedClient.value);
  }

  return orders;
});

const filteredExpeditions = computed(() => {
  let expeditions = runningExpeditions.value;

  if (selectedSupplier.value) {
    expeditions = expeditions.filter(expedition => expedition.supplier_name === selectedSupplier.value)
  }

  return expeditions;
});

const dateOptions = computed(() => {
  return Array.from(
    new Set(clientOrders.value.map(order => order.position_delivery_date.slice(0, 10)))
  );
});

const clientOptions = computed(() =>
  Array.from(new Set(clientOrders.value.map(order => order.client_name)))
);

const supplierOptions = computed(() =>
  Array.from(new Set(suppliers.value.map(supplier => supplier.name)))
);

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function daysLeft(date) {
    const today = new Date();
    const deliveryDate = new Date(date);
    const diffTime = deliveryDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
}

onMounted(async() => {
    sessionStore.actions.initializeAuthState()
    userId.value = sessionStore.getters.getUserID();

    await fetchClientOrders()
    await fetchClients()
    await fetchExpeditions()
    await fetchSuppliers()
})
</script>

<template>
    <div class="main-card">
              <div class="b1-hand-container">
                <v-card class="b1-container" style="margin: 0.6em;">
                  <v-card-title class="d-flex">
                    PLANNING DES COMMANDES CLIENT
                  </v-card-title>
                  <v-card v-if="clientOrders && clientOrders.length > 0" style="margin:2px 10px;">
                  <span class="informative-text">
                    <v-chip
                      class="mt-2"
                      variant="tonal"
                      color="secondary"
                    >
                      <v-icon start class="ml-0">mdi-sort</v-icon>
                      Filtrer par dates et par client
                    </v-chip>
                  </span>
                  <div class="space-between">
                    <div class="d-flex ml-4 mt-1" style="margin-bottom: -16px">
                    <v-select
                      v-model="startDate"
                      clearable
                      prepend-icon="mdi-calendar-start-outline"
                      label="Date de début"
                      :items="dateOptions"
                      variant="underlined"
                      class="mr-2"
                      style="max-width: 16vw; min-width: 10vw;"
                      required
                    />

                    <v-select
                      v-model="endDate"
                      clearable
                      prepend-icon="mdi-calendar-end-outline"
                      label="Date de fin"
                      :items="dateOptions"
                      variant="underlined"
                      style="max-width: 16vw; min-width: 10vw;"
                      class="mr-2"
                      required
                    />

                    <v-select
                      clearable
                      v-model="selectedClient"
                      prepend-icon="mdi-account-multiple-outline"
                      label="Client"
                      :items="clientOptions"
                      variant="underlined"
                      style="max-width: 16vw; min-width: 10vw;"
                      required
                    />
                  </div>
                  <v-btn
                      class="no-effects mr-4 mt-4"
                      icon 
                      size='16'
                      @click="endDate = null; startDate = null; selectedClient = null;"
                      >
                      <v-icon color="secondary">mdi-refresh</v-icon>
                  </v-btn>
                  </div>
                  
                  </v-card>
                <v-timeline
                  v-if="filteredOrders && filteredOrders.length > 0"
                  style="overflow-x: scroll;"
                  direction="horizontal"
                  line-thickness="8"
                  line-color="orange"
                >
                    <v-timeline-item
                        v-for="order in filteredOrders"
                        :key="order.id"
                        elevation="6"
                        icon="mdi-dolly"
                        icon-color="white"
                        dot-color="blue"
                    > 
                    <template v-slot:opposite>
                      <v-chip style="height: fit-content;" class="d-flex align-center text-body-2 mb-1 mt-2" variant="text">
                          <span class="mr-2" style="margin-left: 2px; display: flex; flex-direction: column;">Date de livraison : <strong>{{ formatDate(order.position_delivery_date) }}</strong></span>
                      </v-chip>
                      <v-chip
                        variant="tonal"
                        color="orange"
                      >
                        <v-icon class="mr-2 ml-1">mdi-truck-alert-outline</v-icon>
                        {{ daysLeft(order.position_delivery_date) }} jour(s) avant livraison
                      </v-chip>  
                    </template>
                        <template v-slot:default>
                            <div
                              class="informative-text"
                              variant="elevated"
                              style="display: flex; flex-direction: column; align-items: center; padding: 0.6em"
                            >
                              <span class="d-flex align-center flex-column ga-1">
                                <v-chip variant="elevated" style="width: fit-content;" color="blue">
                                  <v-icon class="mr-2 ml-1">mdi-account-outline</v-icon>
                                  <span class="mr-3">{{ order.client_name }}</span>
                                </v-chip>

                                <v-card style="width: fit-content;" class="mt-1">
                                  <v-chip 
                                    class="text-body-2" 
                                    variant="text" 
                                    style="margin-bottom: -14px"
                                  >
                                  <v-icon class="mr-1">mdi-file-document-outline</v-icon>
                                  <span style="margin-left: 2px; display: flex; align-items: center;">
                                    Commande : 
                                    <strong style="margin-left: 4px;">{{ order.order_number }}</strong>
                                  </span>
                                  </v-chip>

                                  <v-chip 
                                    class="text-body-2" 
                                    variant="text" 
                                    style="margin-bottom: -12px"
                                  >
                                  <v-icon class="mr-1">mdi-cog-outline</v-icon>
                                  <span style="margin-left: 2px; display: flex; align-items: center;">
                                    Référence : 
                                    <strong style="margin-left: 4px;">{{ order.part_designation + ' ' + order.part_reference   }}</strong>
                                  </span>
                                  </v-chip>
                                
                                  <v-chip 
                                    style="display: flex; align-items: center; justify-content: space-between;" 
                                    class="text-body-2 mb-1" 
                                    variant="text"
                                  >
                                    <v-icon class="mr-1">mdi-package-variant-closed-check</v-icon>
                                    <span style="margin-left: 2px; display: flex; align-items: center;">
                                      Quantité : 
                                      <strong style="margin-left: 4px;">{{ order.position_quantity }}</strong>
                                    </span>
                                  </v-chip>
                                </v-card>
                               
                              </span>   
                            </div>
                        </template>
                    </v-timeline-item>
                </v-timeline>
                <div v-else class="informative-text mt-4" style="display: flex; align-items: center">
                    <v-chip
                      variant="tonal"
                      color="secondary"
                    >
                      <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                      <span>Pas de commande client en cours</span>
                    </v-chip>
                  </div>
                </v-card>
                <v-card class="b1-container" style="margin: 0.6em;">
                  <v-card-title class="d-flex" style="font-weight: 700; font-size: 1em;">
                    EXPEDITIONS EN COURS
                  </v-card-title>
                  <v-card v-if="runningExpeditions && runningExpeditions.length > 0" style="margin:2px 10px;">
                    <span class="informative-text">
                      <v-chip
                        class="mt-2"
                        variant="tonal"
                        color="secondary"
                      >
                        <v-icon start class="ml-0">mdi-sort</v-icon>
                        Filtrer par fournisseur
                      </v-chip>
                    </span>
                    <div class="space-between">
                      <div class="d-flex ml-4 mt-1" style="margin-bottom: -16px">
                        <v-select
                          v-model="selectedSupplier"
                          clearable
                          prepend-icon="mdi-account-wrench-outline"
                          label="Fournisseur"
                          :items="supplierOptions"
                          variant="underlined"
                          class="mr-2"
                          style="max-width: 16vw; min-width: 10vw;"
                          required
                        />
                      </div>
                      <v-btn
                        class="no-effects mr-4 mt-4"
                        icon 
                        size="16"
                        @click="selectedSupplier = null;"
                      >
                        <v-icon color="secondary">mdi-refresh</v-icon>
                      </v-btn>
                    </div>
                  </v-card>
                  <v-timeline 
                    v-if="filteredExpeditions && filteredExpeditions.length > 0" 
                    style="overflow-x: scroll;" 
                    direction="horizontal" 
                    line-thickness="8" 
                    line-color="blue">
                    <v-timeline-item
                      v-for="expedition in filteredExpeditions"
                      :key="expedition.id"
                      elevation="6"
                      icon="mdi-ferry"
                      icon-color="white"
                      dot-color="orange"
                    >
                      <template v-slot:opposite>
                        <v-chip
                          style="height: fit-content;"
                          class="d-flex align-center text-body-2 mb-1 mt-2"
                          variant="text"
                        >
                          <span class="mr-2" style="margin-left: 2px; display: flex; flex-direction: column;">
                            Arrivée prévue : <strong>{{ formatDate(expedition.arrival_time) }}</strong>
                          </span>
                        </v-chip>
                        <v-chip variant="tonal" color="red">
                          <v-icon class="mr-2 ml-1">mdi-clock-outline</v-icon>
                          {{ daysLeft(expedition.arrival_time) }} jour(s) avant départ
                        </v-chip>
                      </template>
                      <template v-slot:default>
                        <div
                          class="informative-text"
                          variant="elevated"
                          style="display: flex; flex-direction: column; align-items: center; padding: 0.6em"
                        >
                          <span class="d-flex align-center flex-column ga-1">
                            <v-chip variant="elevated" style="width: fit-content;" color="blue">
                              <v-icon class="mr-2 ml-1">mdi-factory</v-icon>
                              <span class="mr-3">{{ expedition.supplier_name }}</span>
                            </v-chip>

                            <v-card class="d-flex flex-column mt-1">
                              <v-chip
                                class="text-body-2"
                                variant="text"
                                style="margin-bottom: -14px"
                              >
                                <v-icon class="mr-1">mdi-truck-check-outline</v-icon>
                                <span style="margin-left: 2px; display: flex; align-items: center;">
                                  Expédition : 
                                  <strong style="margin-left: 4px;">{{ expedition.number }}</strong>
                                </span>
                              </v-chip>
                              <v-chip
                                class="text-body-2"
                                variant="text"
                              >
                                <v-icon class="mr-1">mdi-package-variant-closed</v-icon>
                                <span style="margin-left: 2px; display: flex; align-items: center;">
                                  Nombre de position(s) : 
                                  <strong style="margin-left: 4px;">{{ expedition.positions_count }}</strong>
                                </span>
                              </v-chip>
                            </v-card>
                          </span>
                        </div>
                      </template>
                    </v-timeline-item>
                  </v-timeline>
                  <div v-else class="informative-text mt-4" style="display: flex; align-items: center">
                    <v-chip
                      variant="tonal"
                      color="secondary"
                    >
                      <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                      Pas d'expéditions en cours ou à venir
                    </v-chip>
                  </div>
                </v-card>
            </div>
    </div>

</template>

<style lang="scss" scoped>
@import url(../assets/main.scss);

</style>