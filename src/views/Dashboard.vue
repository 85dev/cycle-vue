<script setup>
// Vue essentials
import { ref, onMounted, computed, watch } from 'vue'

// Services
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import router from '@/router';

// Components
import StackedBarChart from '@/components/charts/StackedBarChart.vue';
import LineChart from '@/components/charts/BarChart.vue';
import PieChart from '@/components/charts/PolarAreaChart.vue';
import ArchivateOrder from '@/components/modals/ArchivateOrder.vue';
import CardTitle from '@/components/CardTitle.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';

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
const tab = ref(null)
const marginsByPart = ref({})
const partsSoldByMonth = ref({});

async function fetchPartsSold() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts_sold_by_month`);

  if (!response || !Array.isArray(response) || response.length === 0) {
    partsSoldByMonth.value = { labels: [], datasets: [] };
    return;
  }

  const colors = ["#F388A7", "#FEDF7A", "#4698CB", "#85E3FF", "#B3D4E0"];
  const groupedData = {};
  const months = new Set();

  response.forEach(({ month, part_reference, part_designation, quantity }) => {
    const key = `${part_reference} ${part_designation}`;
    months.add(month);
    if (!groupedData[key]) groupedData[key] = {};
    groupedData[key][month] = quantity;
  });

  const sortedMonths = Array.from(months).sort();
  const datasets = Object.entries(groupedData).map(([label, data]) => ({
    label,
    data: sortedMonths.map(month => data[month] || 0),
    borderColor: 'white',
    backgroundColor: colors.slice(0, colors.length),
    borderWidth: 2,
    fill: false
  }));

  partsSoldByMonth.value = { labels: sortedMonths, datasets };
}

async function fetchMarginsByPart() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/margins_by_part`);
    marginsByPart.value = response
}

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
    delayedOrders: 'Commandes client en retard',
    futureOrders: 'Commandes client à 6 mois',
    totalActiveOrders: 'Commandes client à 30 jours'
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

  if (selectedSupplier.value && selectedSupplier.value.length > 0) {
    expeditions = expeditions.filter(expedition => 
      Array.isArray(expedition.supplier_names) &&
      expedition.supplier_names.some(supplier => selectedSupplier.value.includes(supplier))
    );
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
    await fetchMarginsByPart()
    await fetchPartsSold()
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
      <div class="main-card mb-6 mt-6">
        <v-card class="b1-container d-flex align-center justify-center" variant="elevated">
          <v-tabs v-model="tab">
            <v-tab value="one">
              <v-icon start class="mr-2">mdi-view-dashboard</v-icon>
              Tableau de bord
            </v-tab>

            <v-tab value="two">
              <v-icon start class="mr-2">mdi-view-dashboard</v-icon>
              Indicateurs d'activité
            </v-tab>

            <v-tab value="three">
              <v-icon start class="mr-2">mdi-chart-box</v-icon>
              Statistiques
            </v-tab>
          </v-tabs>
        </v-card>

        <v-tabs-window v-model="tab">
        <v-tabs-window-item value="one">
        <div class="b1-container ma-2 mt-0" style="z-index:0">
          <v-card v-if="clientOrders && clientOrders.length > 0" class="mb-3">
            <CardTitle
              :title="`Planning des commandes client (${clientOrders ? clientOrders.length : 0} actives)`"
              icon="mdi-human-dolly"
            />
              <div class="d-flex justify-space-between align-center">
                <span class="informative-text">
                  <v-chip
                    class="mt-1"
                    variant="text"
                    color="black"
                  >
                    <v-icon start class="ml-0">mdi-sort</v-icon>
                    Filtrer par dates et par client
                  </v-chip>
                </span>
                <span class="informative-text">
                  <v-chip
                    class="mt-1"
                    variant="outlined"
                    :color="(startDate && endDate) || selectedClient ? 'blue' : 'secondary'"
                  >
                    <v-icon start class="ml-0">mdi-file-document-outline</v-icon>
                    <span v-if="(startDate && endDate) || selectedClient">
                      Résultats de la recherche : {{ filteredOrders.length }}
                    </span>
                    <span v-else>
                      Commandes client en cours : {{ filteredOrders.length }}
                    </span>
                  </v-chip>
                </span>
              </div>
              <div class="space-between">
                <div class="d-flex ml-4 pa-2">
                  <v-select
                    clearable
                    v-model="selectedClient"
                    prepend-icon="mdi-account-multiple-outline"
                    label="Client"
                    class="mr-2"
                    :items="clientOptions"
                    variant="solo"
                    style="max-width: 20vw; min-width: 160px;"
                    required
                  />
                  <v-select
                    v-model="startDate"
                    clearable
                    prepend-icon="mdi-calendar-start-outline"
                    label="Date de début"
                    :items="dateOptions"
                    variant="solo"
                    class="mr-2"
                    style="max-width: 20vw; min-width: 160px;"
                    required
                  />
                  <v-select
                    v-model="endDate"
                    clearable
                    prepend-icon="mdi-calendar-end-outline"
                    label="Date de fin"
                    :items="dateOptions"
                    variant="solo"
                    style="max-width: 20vw; min-width: 160px;"
                    class="mr-2"
                    required
                  />
                </div>
              </div>
              <v-timeline
                v-if="filteredOrders && filteredOrders.length > 0"
                style="overflow-x: scroll;"
                direction="horizontal"
                side="start"
                line-thickness="4"
                line-color="warning"
              >
                <v-timeline-item
                  v-for="order in filteredOrders"
                  :key="order.id"
                  elevation="12"
                  icon="mdi-truck-fast-outline"
                  :dot-color="daysLeft(order.position_delivery_date) <= 30 ? 'warning' : 'blue'"
                >
                  <template v-slot:opposite>
                    <div class="d-flex flex-column align-center">
                      <v-chip
                        style="height: fit-content;"
                        class="d-flex align-center text-body-2 mt-2"
                        variant="text"
                      >
                        <span class="mr-2" style="margin-left: 2px; display: flex; flex-direction: column;">
                          Date de livraison : <strong>{{ formatDate(order.position_delivery_date) }}</strong>
                        </span>
                      </v-chip>
                      <v-chip
                        class="d-flex align-center text-body-2"
                        variant="text"
                        :color="order.available_stock > order.position_quantity ? 'success' : 'red'"
                      >
                        <span class="mr-2" style="margin-left: 2px; display: flex;">
                          <v-icon class="mr-2" :icon="order.available_stock > order.position_quantity ? 'mdi-package-variant-closed-check' : 'mdi-package-variant-closed-minus'"></v-icon>
                          Pièces en stock : <strong class="ml-1"> {{ order.available_stock }} </strong>
                        </span>
                      </v-chip>
                      <v-chip
                        class="mb-1"
                        variant="outlined"
                        color="warning"
                      >
                        <v-icon class="mr-2 ml-1">
                          {{ daysLeft(order.position_delivery_date) < 0 ? 'mdi-alert-circle-outline' : 'mdi-truck-alert-outline' }}
                        </v-icon>
                        <span v-if="daysLeft(order.position_delivery_date) < 0">
                          Retard de {{ Math.abs(daysLeft(order.position_delivery_date)) }} jour(s)
                        </span>
                        <span v-else>
                          Livraison dans {{ daysLeft(order.position_delivery_date) }} jour(s)
                        </span>
                      </v-chip>
                      <ArchivateOrder
                        origin="client"
                        :selected-company-id="selectedCompany.id"
                        :userId="userId"
                        :order="order"
                        @refreshClientOrders="refreshAllData()"
                      />
                      <span class="mb-3"></span>
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
                            class="text-body-2 mt-2 mr-2 ml-2 mb-0"
                            variant="elevated"
                            color="white"
                            style="width: fit-content;"
                          >
                            <v-icon color="warning" class="mr-1">mdi-account-outline</v-icon>
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
                            <v-icon class="mr-1">mdi-barcode-scan</v-icon>
                            <span style="margin-left: 2px; display: flex; align-items: center;">
                              Référence :
                              <strong style="margin-left: 4px;">{{ order.part_designation + ' ' + order.part_reference }}</strong>
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
                <v-chip variant="text" color="secondary">
                  <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                  Aucune commande en cours ou à venir
                </v-chip>
              </div>
          </v-card>

          <v-card v-else>
            <v-chip variant="text" color="secondary" class="informative-text ma-2 mt-4" style="font-weight: 500;">
              Aucune commande client enregistrée
            </v-chip>
          </v-card>

          <v-card v-if="runningExpeditions && runningExpeditions.length > 0">
            <CardTitle
              :title="`Planning des expéditions (${runningExpeditions ? runningExpeditions.length : 0} actives)`"
              icon="mdi-ferry"
            />
            <span class="informative-text">
              <v-chip
                  class="mt-1"
                  variant="text"
                  color="black"
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
                  variant="solo"
                  class="mr-2"
                  style="max-width: 16vw; min-width: 12vw;"
                  required
                />
              </div>
            </div>
            <v-timeline
              v-if="filteredExpeditions && filteredExpeditions.length > 0"
              style="overflow-x: scroll;"
              class="mt-4"
              side="start"
              direction="horizontal"
              line-thickness="4"
              line-color="blue"
            >
              <v-timeline-item
                v-for="expedition in filteredExpeditions"
                :key="expedition.id"
                elevation="12"
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
                      Arrivée estimée :
                      <strong>
                        {{ expedition.estimated_arrival_time ? formatDate(expedition.estimated_arrival_time) : 'Date non renseignée' }}
                      </strong>
                    </span>
                  </v-chip>
                  <v-chip
                    class="mb-3"
                    v-if="expedition.estimated_arrival_time"
                    variant="tonal"
                    color="primary"
                  >
                    <v-icon class="mr-2 ml-1">mdi-clock-outline</v-icon>
                    {{ daysLeft(expedition.estimated_arrival_time) }} jour(s) avant arrivée
                  </v-chip>
                </template>
                <template v-slot:default>
                  <div
                    class="informative-text"
                    variant="elevated"
                    style="display: flex; flex-direction: column; align-items: center; padding: 0.6em"
                  >
                    <span class="d-flex flex-column justify-center ga-1">
                      <v-card class="d-flex align-start flex-column mt-1">
                        <v-chip
                          v-for="(supplier, index) in expedition.supplier_names"
                          :key="index"
                          variant="elevated"
                          color="white"
                          class="ml-2 mr-2 mt-1"
                        >
                          <v-icon color="blue" class="mr-2 ml-1">mdi-factory</v-icon>
                          <span class="mr-3">
                            Fournisseur :
                            <strong>{{ supplier }}</strong>
                          </span>
                        </v-chip>
                        <v-chip
                          v-if="expedition.real_departure_time"
                          class="text-body-2"
                          variant="text"
                          style="margin-bottom: -12px"
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
                          style="margin-bottom: -12px"
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
                            <strong style="margin-left: 4px;">{{ expedition.expedition_positions.length || 0 }}</strong>
                          </span>
                        </v-chip>
                      </v-card>
                    </span>
                  </div>
                </template>
              </v-timeline-item>
            </v-timeline>
            <div v-else class="informative-text mt-4" style="display: flex; align-items: center">
              <v-chip variant="text" class="mt-4" color="secondary">
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                Aucune expédition en cours ou à venir
              </v-chip>
            </div>
          </v-card>
          <v-card v-else class="mt-2">
            <v-chip variant="text" color="secondary" class="informative-text ma-2 mt-4" style="font-weight: 500;">
              Aucune expédition en cours enregistrée
            </v-chip>
          </v-card>
      </div>
          </v-tabs-window-item>

          <v-tabs-window-item value="two">
            <div class="b1-container mt-0">
              <v-row dense class="mr-2 ml-2 mb-2 mt-2">
                  <v-col v-for="(metric, key) in kpiData" :key="key" cols="6" sm="3" md="4">
                    <v-card class="card-hover" variant="elevated" color="white">
                      <v-card-title class="informative-text">
                        <span class="d-flex align-center text-black justify-center flex-column">
                          <div>
                            <v-icon :color="getKpiIconStyle(key)" class="mr-2">{{ getKpiIcon(key) }}</v-icon>
                            {{ formatKpiLabel(key) }}
                          </div>
                          <div class="text-h6 text-blue font-weight-bold ml-3 mt-1" style="border-radius: 50%; padding: 2px 11px 0px 11px; border: 2px dashed">
                            {{ formatMetricValue(metric, key) }}
                          </div>
                        </span>
                      </v-card-title>
                    </v-card>
                  </v-col>
                </v-row>
            </div>
          </v-tabs-window-item>

          <v-tabs-window-item value="three">
              <v-card class="b1-container">
                <!-- LINE CHART  -->
                <v-card class="mr-3 ml-3 mb-2 mt-2">
                  <CardTitle
                      title="Volumes de ventes par mois et par référence"
                      icon="mdi-barcode"
                  />
                  <LineChart 
                    v-if="selectedCompany && partsSoldByMonth" 
                    :chartData="partsSoldByMonth" 
                  />
                  <v-chip v-else variant="text" color="secondary" class="informative-text">
                    Aucune référence enregistrée en commandes client
                  </v-chip>
                </v-card>
                <v-card class="mr-3 ml-3 mb-2 mt-2">
                  <CardTitle title="Marge brute par référence" icon="mdi-margin" />
                  <StackedBarChart 
                    v-if="selectedCompany && marginsByPart.length > 0" 
                    :data="marginsByPart"
                    :companyId="selectedCompany.id" 
                  />
                </v-card>
                <v-row dense class="mr-3 ml-3 mb-2 mt-2">
                  <v-col cols="12" md="6">
                    <v-card>
                      <CardTitle title="Répartition des ventes par client" icon="mdi-chart-pie" />
                      <PieChart v-if="selectedCompany" :companyId="selectedCompany.id" />
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card>
                      <CardTitle title="TO BE IMPLEMENTED" icon="mdi-chart-pie" />
                    </v-card>
                  </v-col>
                </v-row>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
        <div class="b1-hand-container mt-1 mb-1">
      
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
.card-hover {
  transition: transform 0.24s ease-in-out;
  &:hover {
    transform: translateY(-6px);
  }
}

:deep(.v-input__details) {
    display: none;
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