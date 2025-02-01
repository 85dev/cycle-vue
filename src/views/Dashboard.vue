<script setup>
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import { ref, onMounted, computed, watch } from 'vue'
import ArchivateOrder from '@/components/modals/ArchivateOrder.vue';
import CardTitle from '@/components/CardTitle.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';
import router from '@/router';

const selectedCompany = computed(() => {
  return sessionStore.getters.getSelectedCompany()
})
const clientOrders = ref([])
const startDate = ref(null)
const endDate = ref(null)
const selectedClient = ref(null)
const selectedSupplier = ref(null)
const clients = ref([])
const suppliers = ref([])
const runningExpeditions = ref([])
const kpiData = ref({})
const loading = ref(false)
const userId = ref(0)

async function fetchKPIs() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/kpi_metrics`)
    kpiData.value = response
}

async function fetchClientOrders() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/future_company_client_orders`)
    clientOrders.value = response
}

async function fetchClients() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/clients`)
    clients.value = response
}

async function fetchSuppliers() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/suppliers`)
    suppliers.value = response
}

async function fetchExpeditions() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/undelivered_expeditions`) 
    runningExpeditions.value = response
}

function getKpiIcon(key) {
  const icons = {
    runningExpeditions: 'mdi-ferry',
    delayedOrders: 'mdi-clock-alert-outline',
    futureOrders: 'mdi-clock-outline',
    totalActiveOrders: 'mdi-package-variant'
  }
  return icons[key] || 'mdi-chart-box-outline'
}

function getKpiIconStyle(key) {
  const colors = {
    runningExpeditions: 'blue',
    delayedOrders: 'red',
    futureOrders: 'success',
    totalActiveOrders: 'warning',
  };

  return colors[key] || 'white';
}
function formatMetricValue(value, key) {
  if (key === 'onTimeDeliveryRate') {
    return `${value}%`
  }
  return value
}

function formatKpiLabel(key) {
  const labels = {
    runningExpeditions: 'Expéditions en cours',
    delayedOrders: 'Commandes en retard',
    futureOrders: 'Commandes à 6 mois',
    totalActiveOrders: 'Commandes à 30 jours'
  }
  return labels[key] || key
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

watch(() => selectedCompany.value, // Watching the computed value's reactive property
    async (newCompany, oldCompany) => {
        if (newCompany && newCompany.id !== oldCompany?.id) {
            await refreshAllData(); // Trigger refresh on change
        }
    }
);

async function refreshAllData() {
  loading.value = true;
  
  setTimeout(async() => {
    await fetchClientOrders()
    await fetchClients()
    await fetchExpeditions()
    await fetchSuppliers()
    await fetchKPIs()
    loading.value = false;
  }, 300);
}

onMounted(async() => {
    await sessionStore.actions.initializeAuthState()
    userId.value = await sessionStore.getters.getUserID();
    selectedCompany.value = await sessionStore.getters.getSelectedCompany();

    if (selectedCompany.value) {
      await refreshAllData()
    }

    if (!userId.value) {
      router.push('/login')
    }
})
</script>

<template>
    <SpinnLoader :loading="loading" />
    <div v-if="selectedCompany" class="main-card mb-3">
              <div class="b1-hand-container mt-1 mb-1">
                <v-card class="b1-container">
                  <CardTitle
                        title="Indicateurs d'activité courante"
                        icon="mdi-cube-send"
                  />
                  <v-row dense class="mr-2 ml-2 mb-2">
                    <v-col v-for="(metric, key) in kpiData" :key="key" cols="6" sm="3" md="4">
                      <v-card variant="elevated" color="white">
                        <v-card-title class="informative-text">
                          <span class="d-flex align-center justify-center">
                            <div>
                              <v-icon :color="getKpiIconStyle(key)" class="mr-2">{{ getKpiIcon(key) }}</v-icon>
                              {{ formatKpiLabel(key) }}
                            </div>
                            <div class="text-h6 text-blue font-weight-bold ml-3 mt-1">
                              {{ formatMetricValue(metric, key) }}
                            </div>
                          </span>
                        </v-card-title>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card>
                <v-card class="b1-container">
                  <CardTitle
                        title="Planning des commandes client"
                        icon="mdi-human-dolly"
                  />
                  <v-card v-if="clientOrders && clientOrders.length > 0" style="margin:2px 10px;">
                    <div class="d-flex justify-space-between align-center">
                      <span class="informative-text">
                        <v-chip
                          class="mt-1"
                          variant="tonal"
                          color="secondary"
                        >
                          <v-icon start class="ml-0">mdi-sort</v-icon>
                          Filtrer par dates et par client
                        </v-chip>
                      </span>
                      <span class="informative-text">
                        <v-chip
                          class="mt-1"
                          variant="tonal"
                          :color="(startDate && endDate) || selectedClient ? 'blue' : 'secondary'"
                        >
                          <v-icon start class="ml-0">mdi-file-document-outline</v-icon>
                          <span v-if="(startDate && endDate) || selectedClient">Résultats de la recherche : {{ filteredOrders.length }}</span>
                          <span v-else>Commandes client en cours : {{ filteredOrders.length }}</span>
                        </v-chip>
                      </span>
                    </div>
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
                        style="max-width: 16vw; min-width: 12vw;"
                        required
                      />

                      <v-select
                        v-model="endDate"
                        clearable
                        prepend-icon="mdi-calendar-end-outline"
                        label="Date de fin"
                        :items="dateOptions"
                        variant="underlined"
                        style="max-width: 16vw; min-width: 12vw;"
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
                        style="max-width: 16vw; min-width: 12vw;"
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
                  line-thickness="4"
                  line-color="blue"
                >
                    <v-timeline-item
                        v-for="order in filteredOrders"
                        :key="order.id"
                        elevation="6"
                        :icon="daysLeft(order.position_delivery_date) <= 30 ? 'mdi-alert-circle-outline' : 'mdi-dolly'"
                        :dot-color="daysLeft(order.position_delivery_date) <= 30 ? 'red' : 'blue'"
                    > 
                    <template v-slot:opposite>
                      <div class="d-flex flex-column align-center">
                      <v-chip style="height: fit-content;" class="d-flex align-center text-body-2 mb-1 mt-2" variant="text">
                          <span class="mr-2" style="margin-left: 2px; display: flex; flex-direction: column;">Date de livraison : <strong>{{ formatDate(order.position_delivery_date) }}</strong></span>
                      </v-chip>
                      <v-chip
                        class="mb-1"
                        variant="elevated"
                        :elevation="daysLeft(order.position_delivery_date) <= 30 ? 4 : 0"
                        :color="daysLeft(order.position_delivery_date) <= 30 ? 'red' : 'blue'"
                      >
                        <v-icon class="mr-2 ml-1">mdi-truck-alert-outline</v-icon>
                        {{ daysLeft(order.position_delivery_date) }} jour(s) avant livraison
                      </v-chip>  
                      <ArchivateOrder 
                        origin="client"
                        :selected-company-id="selectedCompany.id"
                        :userId="userId" 
                        :order="order" 
                        @refreshClientOrders="refreshAllData()" 
                        />
                      </div>
                    </template>
                        <template v-slot:default>
                            <div
                              class="informative-text"
                              variant="elevated"
                              style="display: flex; flex-direction: column; align-items: center; padding: 0.6em"
                            >
                              <span class="d-flex align-center flex-column ga-1">
                                <v-card style="width: fit-content;" class="mt-1 d-flex flex-column">
                                  <v-chip 
                                    class="text-body-2 mt-1" 
                                    variant="text" 
                                    style="margin-bottom: -16px"
                                  >
                                  <v-icon class="mr-1">mdi-account-outline</v-icon>
                                  <span style="margin-left: 2px; display: flex; align-items: center;">
                                    Client : 
                                    <strong style="margin-left: 4px;">{{ order.client_name }}</strong>
                                  </span>
                                  </v-chip>

                                  <v-chip 
                                    class="text-body-2 mt-1" 
                                    variant="text" 
                                    style="margin-bottom: -12px"
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
                      <span>Pas de commande(s) client à venir </span>
                    </v-chip>
                  </div>
                </v-card>
                <v-card class="b1-container">
                  <CardTitle
                        title="Planning des expéditions"
                        icon="mdi-ferry"
                  />
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
                          style="max-width: 16vw; min-width: 12vw;"
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
                    line-thickness="4" 
                    line-color="blue">
                    <v-timeline-item
                      v-for="expedition in filteredExpeditions"
                      :key="expedition.id"
                      elevation="6"
                      icon="mdi-ferry"
                      icon-color="white"
                      dot-color="blue"
                    >
                      <template v-slot:opposite>
                        <v-chip
                          style="height: fit-content;"
                          class="d-flex align-center text-body-2 mb-1 mt-2"
                          variant="text"
                        >
                          <span class="mr-2" style="margin-left: 2px; display: flex; flex-direction: column;">
                            Arrivée prévue : <strong>{{ expedition.arrival_time ? formatDate(expedition.arrival_time) : 'Date non renseignée' }}</strong>
                          </span>
                        </v-chip>
                        <v-chip v-if="expedition.arrival_time" variant="tonal" color="primary">
                          <v-icon class="mr-2 ml-1">mdi-clock-outline</v-icon>
                          {{ daysLeft(expedition.arrival_time) }} jour(s) avant arrivée
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
                                v-if="expedition.real_departure_time"
                                class="text-body-2"
                                variant="text"
                                style="margin-bottom: -14px"
                              >
                                <v-icon class="mr-1">mdi-truck-check-outline</v-icon>
                                <span style="margin-left: 2px; display: flex; align-items: center;">
                                  Date de départ : 
                                  <strong style="margin-left: 4px;">{{ formatDate(expedition.real_departure_time) }}</strong>
                                </span>
                              </v-chip>
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
                      Aucune expédition en cours ou à venir
                    </v-chip>
                  </div>
                </v-card>
            </div>
    </div>
</template>

<style lang="scss" scoped>
@import url(../assets/main.scss);

.kpi-card {
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-5px);
  }
}

.kpi-icon {
  background: rgba(218, 218, 218, 0.2);
  border-radius: 50%;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

</style>