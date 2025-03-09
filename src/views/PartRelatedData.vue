<script setup>
import { ref, onMounted, watch, computed } from 'vue'

// Services
import apiCaller from '@/services/apiCaller'
import sessionStore from '../stores/sessionStore.js'
import { statusIcon, statusIconColor, statusText } from '@/services/textIconServices.js'
import { useRoute, useRouter } from 'vue-router';

// Components
import CreateClientOrder from '@/components/modals/CreateClientOrder.vue'
import CreateSupplierOrder from '@/components/modals/CreateSupplierOrder.vue'
import ArchivePosition from '@/components/modals/ArchivePosition.vue';
import EditPart from '@/components/modals/EditPart.vue';
import ArchivateOrder from '@/components/modals/ArchivateOrder.vue'
import DeletingOrder from '@/components/modals/DeletingOrder.vue'
import SortClientPositionsModal from '@/components/modals/SortClientPositions.vue';
import LifecycleTimeline from '@/components/LifecycleTimeline.vue';

import TransferPosition from '@/components/modals/TransferPosition.vue';
import HandleConsignmentConsumption from '@/components/modals/HandleConsignmentConsumption.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';
import TransferPositionFromClient from '@/components/modals/TransferPositionFromClient.vue';
// import PositionHistory from '@/components/modals/PositionHistory.vue';
// import EditClientOrder from '@/components/modals/EditClientOrder.vue'

// Constant data
import { clientOrdersHeaders, consumptionPositionsHeaders, supplierOrdersHeaders, clientStockPositionsHeaders, expeditionsListHeaders, subcontractorHeaders, logisticplacesHeaders } from '@/models/tableHeaders.js'
import CardTitle from '@/components/CardTitle.vue';
import GenerateOrderSlipPDF from '@/components/modals/GenerateOrderSlipPDF.vue';

const selectedCompany = computed(() => sessionStore.getters.getSelectedCompany())
const dataFromSearch = ref({})
const currentPartId = ref(null)
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const refreshTrigger = computed(() => { return sessionStore.getters.getRefreshTrigger })
const clientPositionModal = computed(() => { return unsortedClientPositions.value.length > 0 })
const calculatedStocks = ref({})
const subContractorsList = ref([])
const logisticPlaceList = ref([])
const unsortedClientPositions = ref([])
const transporters = ref([])
const tab = ref(null);

function getClientOrderStatus(status) {
  switch (status) {
    case "undelivered":
      return { label: "Non livrée", icon: "mdi-progress-clock", color: "warning" };
    
    case "partially_delivered":
      return { label: "Partiellement livrée", icon: "mdi-package-variant", color: "orange" };

    case "delivered":
      return { label: "Livrée", icon: "mdi-check-circle-outline", color: "success" };

    default:
      return { label: "En attente", icon: "mdi-timer-sand", color: "grey" };
  }
}

async function fetchPartData() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/part_related_data/${currentPartId.value}`)
  dataFromSearch.value = response;
}

async function fetchTransporters() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/transporters_index`)
  transporters.value = response;
}

async function fetchSupplierOrders() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/supplier_orders_positions`);
  dataFromSearch.value.supplier_orders = response
}

async function fetchUnsortedClientPositions() {  
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/unsorted_client_positions`)
    unsortedClientPositions.value = response
}

async function fetchCalculatedStocks() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/calculate_part_stocks`)
  calculatedStocks.value = response
}

async function fetchConsignmentStockPositions() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/clients/${dataFromSearch.value.client.id}/consignment_stocks_positions_by_client`)
  dataFromSearch.value.consignment_stock_positions = response
}

async function fetchStandardStockPositions() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/clients/${dataFromSearch.value.client.id}/standard_stocks_positions_by_client`)
  dataFromSearch.value.standard_stock_positions = response
}

async function fetchClientOrders() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/client_order_positions`);
  dataFromSearch.value.client_orders = response
}

async function fetchExpeditions() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/supplier_order_indices_by_part`);
  dataFromSearch.value.expeditions = response
}

async function fetchSubContractors() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/expedition_position_by_sub_contractor`);
  dataFromSearch.value.positions_by_sub_contractors = response
}

async function fetchLogisticPlaces() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/expedition_position_by_logistic_place`);
  dataFromSearch.value.positions_by_logistic_place = response
}

async function fetchSubcontractorsIndex() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/subcontractors_index`)
    subContractorsList.value = response
}

async function fetchLogisticPlacesIndex() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/logistic_places`)
    logisticPlaceList.value = response
}

watch(selectedCompany, async (newCompany, oldCompany) => {
  if (newCompany?.id !== oldCompany?.id) {
    router.push('/dashboard');
  }}
);

watch(refreshTrigger, async() => {
  await refreshAllData()
})

async function refreshAllData() {
    loading.value = true;
    await fetchUnsortedClientPositions();
    await fetchPartData()
    await fetchSupplierOrders();
    await fetchClientOrders();
    await fetchExpeditions();
    await fetchSubContractors();
    await fetchLogisticPlaces();
    await fetchConsignmentStockPositions();
    await fetchStandardStockPositions();
    await fetchCalculatedStocks();
    await fetchSubcontractorsIndex();
    await fetchLogisticPlacesIndex();
    await fetchTransporters();
    loading.value = false;
}

onMounted(async () => {
  currentPartId.value = route.params.id
  sessionStore.actions.initializeAuthState();
  selectedCompany.value = sessionStore.getters.getSelectedCompany();

  await refreshAllData();
});

</script>

<template>
  <SpinnLoader :loading="loading"/>
  <SortClientPositionsModal
    v-if="selectedCompany && clientPositionModal && dataFromSearch.client"
    :open-modal="clientPositionModal"
    :part-id="currentPartId"
    :selected-company-id="selectedCompany.id"
    :client="dataFromSearch.client"
    :client-positions="unsortedClientPositions"
    @refreshClientPositions="refreshAllData()"
  />
  <v-card class="main-card mt-6 mb-6">
    <v-card class="b1-container ma-2" color="dark" variant="elevated">
      <v-tabs v-model="tab" show-arrows class="part-data-tabs">
        <v-tab value="one">
          <v-icon start class="mr-2">mdi-information</v-icon>
          Stocks et Disponibilités
        </v-tab>
        <v-tab value="two">
          <v-icon start class="mr-2">mdi-package-variant</v-icon>
          Commandes & expéditions
        </v-tab>
        <v-tab value="three">
          <v-icon start class="mr-2">mdi-cube-send</v-icon>
          Informations Générales
        </v-tab>
      </v-tabs>
    </v-card>
      <v-card variant="elevated" elevation="12" class="attached-container d-flex align-center flex-column" style="font-size: 14px;">
        <span class="pl-2 pr-2">Référence en consultation :</span>
        <div class="pl-2 pr-2" v-if="dataFromSearch.designation">
            <v-icon class="mr-2">mdi-barcode-scan</v-icon>
            <span class="mr-1"><strong>{{ dataFromSearch.designation }} {{ dataFromSearch.reference }}</strong></span>
        </div>
      </v-card>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="one">
          <v-card class="b1-container ma-2">
            <CardTitle 
              title="Pièces commandées, réservées et à terme"
              icon="mdi-package-variant-closed"
            />
            <v-card style="padding: 0.4em; margin: 0.4em;">
              <CardTitle 
  title="Détail des stocks"
  icon="mdi-package-variant"
  elevation="2"
/>
<v-row dense class="mt-2">
  <!-- Current Stock Table -->
  <v-col cols="12" md="6">
    <v-data-table
      :items="[
        { type: 'Total en stock consignation', quantity: calculatedStocks.current_stock?.consignment_stock ?? 0 },
        { type: 'Total chez les sous-traitant(s)', quantity: calculatedStocks.current_stock?.subcontractor_stock ?? 0 },
        { type: 'Total sur lieu(x) logistique', quantity: calculatedStocks.current_stock?.logistic_place_stock ?? 0 },
        { type: 'Total disponible', quantity: calculatedStocks.current_stock?.total ?? 0 },
      ]"
      :headers="[
        { title: 'Type de stock', value: 'type' },
        { title: 'Quantité', value: 'quantity' },
      ]"
      class="elevation-1"
      density="compact"
      hide-default-footer
    >
      <template v-slot:item.quantity="{ item }">
        <v-chip variant="text" :color="item.quantity <= 0 ? 'warning' : 'black'">
          <v-icon class="mr-1">
            {{ item.quantity <= 0 ? 'mdi-alert-circle-outline' : 'mdi-package-variant-closed-check' }}
          </v-icon>
          {{ item.quantity }}
        </v-chip>
      </template>
    </v-data-table>
  </v-col>

  <!-- Reserved Stock Table -->
  <v-col cols="12" md="6">
    <v-data-table
      :items="[
        { type: 'Total en commandes client', quantity: calculatedStocks.reserved_stock ?? 0 },
      ]"
      :headers="[
        { title: 'Stocks réservés au client', value: 'type' },
        { title: 'Quantité', value: 'quantity' },
      ]"
      class="elevation-1"
      density="compact"
      hide-default-footer
    >
      <template v-slot:item.quantity="{ item }">
        <v-chip variant="text" :color="item.quantity > 0 ? 'warning' : 'black'">
          <v-icon class="mr-1"> mdi-package-variant-closed </v-icon>
          {{ item.quantity }}
        </v-chip>
      </template>
    </v-data-table>
  </v-col>

  <!-- Ordered Stock Table -->
  <v-col class="mt-2" cols="12" md="6">
    <v-data-table
      :items="[
        { type: 'Total en cours d\'expédition', quantity: calculatedStocks.ordered_stock?.expeditions ?? 0 },
        { type: 'Total en commande(s) fournisseur', quantity: calculatedStocks.ordered_stock?.supplier_orders ?? 0 },
      ]"
      :headers="[
        { title: 'Stocks en commande', value: 'type' },
        { title: 'Quantité', value: 'quantity' },
      ]"
      class="elevation-1"
      density="compact"
      hide-default-footer
    >
      <template v-slot:item.quantity="{ item }">
        <v-chip variant="text">
          <v-icon class="mr-1">
            {{ item.quantity > 0 ? 'mdi-truck-fast-outline' : 'mdi-package-variant-remove' }}
          </v-icon>
          {{ item.quantity }}
        </v-chip>
      </template>
    </v-data-table>
  </v-col>

  <!-- Future Stock Table -->
  <v-col class="mt-2" cols="12" md="6">
    <v-data-table
      :items="[
        { type: 'Total actuel disponible', quantity: calculatedStocks.total_current_stock ?? 0 },
        { type: 'Total disponible à terme', quantity: calculatedStocks.total_future_stock ?? 0 },
      ]"
      :headers="[
        { title: 'Stock à terme', value: 'type' },
        { title: 'Quantité', value: 'quantity' },
      ]"
      class="elevation-1"
      density="compact"
      hide-default-footer
    >
      <template v-slot:item.quantity="{ item }">
        <v-chip variant="text" :color="item.quantity <= 0 ? 'warning' : 'black'">
          <v-icon class="mr-1">
            {{ item.quantity <= 0 ? 'mdi-alert-circle-outline' : 'mdi-package-variant-closed-check' }}
          </v-icon>
          {{ item.quantity }}
        </v-chip>
      </template>
    </v-data-table>
  </v-col>
</v-row>
        </v-card>
      </v-card>
      <v-card class="b1-container ma-2">
          <div v-if="dataFromSearch.consignment_stock_positions">
            <div class="b1-top-content mt-0 mr-3">
              <CardTitle 
                title="Stock consignation client"
                icon="mdi-dolly"
              />
              <v-chip
               @click="router.push({ name: `HandleConsumptions` });"
               variant="outlined" 
               color="blue">
                <v-icon class="mr-2">mdi-package-variant-minus</v-icon>
                <span>Gérer toutes les consommations</span>
              </v-chip>
            </div>

              <v-card
                style="padding:0.4em; margin: 0.4em;"
                v-for="stock in dataFromSearch.consignment_stock_positions.filter(stock => stock.client_positions.length > 0)"
                :key="'consignment-' + stock.id"
              >
                 <CardTitle 
                  :title="stock.name ? stock.name : stock.address"
                  icon="mdi-map-marker-circle"
                  color="dark" 
                  elevation="2"
                 />
                  <v-card class="b1-middle-content mb-0" style="padding:0.4em; margin: 0.4em;">
                    <v-card>
                      <v-row class="pa-4" align="center" justify="space-between">
                        <v-col cols="12" md="6" class="d-flex flex-column">
                          <div>
                            <v-chip variant="text" class="text-body-2 mt-1">
                              <v-icon class="mr-2">mdi-location-enter</v-icon>
                              {{ stock.name }}
                            </v-chip>
                          </div>
                          <div>
                            <v-chip variant="text" class="text-body-2">
                              <v-icon class="mr-2">mdi-map-marker-circle</v-icon>
                              {{ stock.address }}
                            </v-chip>
                          </div>
                        </v-col>
  
                        <v-col cols="12" md="6" class="d-flex flex-column">
                          <div v-if="stock.current_quantity && stock.current_quantity" class="d-flex flex-column">
                            <v-chip
                              style="z-index:1; width: fit-content;"
                              class="d-flex align-center text-body-2 mb-1"
                              variant="elevated"
                              :color="stock.current_quantity > 0 ? 'blue' : 'red'"
                            >
                              <v-icon  class="mr-1 ml-1">{{ stock.current_quantity > 0 ? 'mdi-package-variant-closed-check' : 'mdi-package-variant-minus' }}</v-icon>
                              <span style="margin-left: 2px;">Quantité à disposition : <strong>{{ stock.current_quantity }}</strong></span>
                            </v-chip>
                            <HandleConsignmentConsumption
                              v-if="selectedCompany && stock && dataFromSearch.reference && dataFromSearch.designation && dataFromSearch.client.id && stock.current_quantity !== undefined" 
                              :part-reference="dataFromSearch.reference"
                              :selected-company-id="selectedCompany.id" 
                              origin="single"
                              :part-designation="dataFromSearch.designation"
                              :part-price="dataFromSearch.client_price || 0"
                              :current-quantity="stock.current_quantity"
                              :stock="stock"
                              :client-id="dataFromSearch.client.id"
                              @refreshConsignment="refreshAllData()"
                            />
                          </div>
                        </v-col>
                      </v-row>
                    </v-card>
  
                    <v-card style="margin-top: 1em; margin-bottom: 0.1em;">
                      <span class="informative-text">
                        <v-chip class="mt-2 mb-1" variant="text" color="blue">
                          <v-icon start class="ml-0">mdi-history</v-icon>
                          Historique des arrivées
                        </v-chip>
                      </span>
                      <v-data-table
                        :loading="loading"
                        v-if="(stock && stock.client_positions.length > 0) || loading"
                        :items="stock.client_positions"
                        :headers="clientStockPositionsHeaders"
                        density="dense"
                        items-per-page="5"
                      >
                        <template v-slot:item.quantity="{item}">
                          <v-chip variant="text" color="success" style="margin: 0.2em">
                            <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                            {{ item.quantity }}
                          </v-chip>
                        </template>
                        <template v-slot:item.actions="{item}">
                            <!-- <PositionHistory
                              v-if="selectedCompany && currentPartId && item.id"
                              :selected-company-id="selectedCompany.id"
                              :client-position-id="item.id"
                            /> -->
                            <TransferPositionFromClient
                              v-if="selectedCompany && item && dataFromSearch.client && dataFromSearch.client_orders"
                              origin="consignment"
                              :logistic-place-list="logisticPlaceList"
                              :sub-contractors-list="subContractorsList"
                              :client-orders=" dataFromSearch.client_orders"
                              :client="dataFromSearch.client"
                              :selected-company-id="selectedCompany.id" 
                              :position="item"
                              @refresh="refreshAllData()"
                            />
                            <ArchivePosition 
                              v-if="selectedCompany && item"
                              :position-id="item.id"
                              :selected-company-id="selectedCompany.id"
                              position-type="client"
                              @refreshPositions="refreshAllData()"
                            />
                        </template>
                      </v-data-table>
                    </v-card>
  
                    <v-card v-if="(stock && stock.consumption_positions && stock.consumption_positions.length > 0) || loading" style="margin-top: 1em; margin-bottom: 0.1em;">
                      <span class="informative-text">
                        <v-chip class="mt-2 mb-1" variant="text" color="blue">
                          <v-icon start class="ml-0">mdi-package-variant-minus</v-icon>
                          Historique des consommations
                        </v-chip>
                      </span>
                      <v-data-table
                        :loading="loading"
                        :items="stock.consumption_positions"
                        :headers="consumptionPositionsHeaders"
                        density="dense"
                        items-per-page="5"
                      >
                        <template v-slot:item.quantity="{item}">
                          <v-chip variant="text" color="success" style="margin: 0.2em">
                            <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                            {{ item.quantity }}
                          </v-chip>
                        </template>
                        <template v-slot:item.consumption_period="{item}">
                          <v-chip variant="text" style="margin: 0.2em">
                            <v-icon class="mr-2">mdi-package-variant-minus</v-icon>
                            {{ item.consumption_period }}
                          </v-chip>
                        </template>
                      </v-data-table>
                    </v-card>
                  </v-card>
              </v-card>
          </div>
          <div class="ml-5 mt-3" v-if="dataFromSearch.consignment_stock_positions">
              <div class="mb-1" v-if="dataFromSearch.consignment_stock_positions && dataFromSearch.consignment_stock_positions.filter(stock => stock.client_positions.length > 0).length === 0">
                <v-chip
                  variant="text"
                  color="secondary"
                >
                  <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                  Aucune {{ dataFromSearch.designation + ' ' + dataFromSearch.reference }} en stock consignation client n'est enregistrée
                </v-chip>
              </div>
          </div>
          </v-card>
  
          <v-card class="b1-container ma-2">
            <div class="mt-3" v-if="dataFromSearch.standard_stock_positions">
            <CardTitle 
                title="Stock standard client"
                icon="mdi-dolly"
              />
                <v-card
                  style="padding:0.4em; margin: 0.4em"
                  v-for="stock in dataFromSearch.standard_stock_positions.filter(stock => stock.client_positions.length > 0)"
                  :key="'standard-' + stock.id"
                >
                  <!-- Panel Title -->
                   <CardTitle 
                    :title="stock.name ? stock.name : stock.address"
                    icon="mdi-map-marker-circle"
                    color="dark"
                    elevation="2"
                   />
                    <v-card class="b1-middle-content" style="padding:0.4em; margin: 0.4em">
                      <v-card>
                        <v-row class="pa-4" align="center" justify="space-between">
                          <v-col cols="12" md="6" class="d-flex flex-column">
                            <div>
                              <v-chip variant="text" class="text-body-2">
                                <v-icon class="mr-2">mdi-location-enter</v-icon>
                                {{ stock.name }}
                              </v-chip> 
                            </div>
                            <div>
                              <v-chip variant="text" class="text-body-2 mt-1">
                                <v-icon class="mr-2">mdi-map-marker-circle</v-icon>
                                {{ stock.address }}
                              </v-chip>
                            </div>
                          </v-col> 
                        </v-row>
                      </v-card>
  
                      <v-card style="margin-top: 1em; margin-bottom: 0.1em;">
                        <span class="informative-text">
                          <v-chip class="mt-2 mb-1" variant="outlined" color="blue">
                            <v-icon start class="ml-0">mdi-history</v-icon>
                            Historique des arrivées
                          </v-chip>
                        </span>
                        <v-data-table
                          :loading="loading"
                          v-if="(stock && stock.client_positions.length > 0)|| loading"
                          :items="stock.client_positions"
                          :headers="clientStockPositionsHeaders"
                          density="dense"
                        >
                          <template v-slot:item.quantity="{item}">
                            <v-chip variant="outlined" color="success" style="margin: 0.2em;">
                              <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                              {{ item.quantity }}
                            </v-chip>
                          </template>
                          <template v-slot:item.actions="{item}">
                            <div class="actions-slot">
                              <!-- <PositionHistory
                                v-if="selectedCompany && currentPartId && item.id"
                                :selected-company-id="selectedCompany.id"
                                :client-position-id="item.id"
                              /> -->
                              <TransferPositionFromClient
                                v-if="selectedCompany && item && dataFromSearch.client && dataFromSearch.client_orders"
                                origin="consignment"
                                :logistic-place-list="logisticPlaceList"
                                :sub-contractors-list="subContractorsList"
                                :client-orders=" dataFromSearch.client_orders"
                                :client="dataFromSearch.client"
                                :selected-company-id="selectedCompany.id" 
                                :position="item"
                                @refresh="refreshAllData()"
                              />
                              <ArchivePosition 
                                v-if="selectedCompany && item"
                                :position-id="item.id"
                                :selected-company-id="selectedCompany.id"
                                position-type="client"
                                @refreshPositions="refreshAllData()"
                              />
                            </div>
                          </template>
                        </v-data-table>           
                      </v-card>
                    </v-card>
                </v-card>
            </div>
            <div class="ml-5" v-if="dataFromSearch.standard_stock_positions">
              <div class="mb-1 mt-3" v-if="dataFromSearch.standard_stock_positions && dataFromSearch.standard_stock_positions.filter(stock => stock.client_positions.length > 0).length === 0">
                <v-chip
                  variant="text"
                  color="secondary"
                >
                  <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                  Aucune {{ dataFromSearch.designation + ' ' + dataFromSearch.reference }} en stock standard client n'est enregistrée
                </v-chip>
              </div>
            </div>
          </v-card>
          <v-card class="b1-container ma-2">
            <div class="b1-hand-container">
            <v-card class="b1-container"  style="padding:0.4em; margin: 0.4em;">
              <div class="b1-top-content">
                <CardTitle
                  title="Stock sous-traitant(s)" 
                  icon="mdi-turbine"
                />
              </div>
              <div class="b1-middle-content">
                <div v-if="dataFromSearch.positions_by_sub_contractors && dataFromSearch.positions_by_sub_contractors.length > 0">
                  <div v-for="subcontractor in dataFromSearch.positions_by_sub_contractors" :key="subcontractor.subcontractor_id" class="mb-4">
                    <v-card style="padding:0.4em; margin: 0.4em; margin-bottom: -0.8em;">
                      <div class="d-flex align-center justify-lg-space-between">
                        <CardTitle 
                          :title="subcontractor.subcontractor_name"
                          icon="mdi-account-wrench-outline"
                          color="dark"
                        />
                        <span class="informative-text">{{ subcontractor.knowledge }}</span>
                      </div>
                      <v-divider></v-divider>
                      <v-data-table
                        :loading="loading"
                        :items="subcontractor.positions"
                        density="dense"
                        :headers="subcontractorHeaders"
                      >
                        <template v-slot:item.quantity="{ item }">
                          <v-chip variant="text" style="margin: 0.2em">
                            <v-icon color="orange" class="mr-2">mdi-cog-sync-outline</v-icon>
                            {{ item.quantity }}
                          </v-chip>
                        </template>
                        <template v-slot:item.actions="{ item }">
                          <div class="actions-slot">
                            <TransferPosition
                              v-if="selectedCompany && item && dataFromSearch.client && dataFromSearch.client_orders"
                              origin="subcontractor"
                              :logistic-place-list="logisticPlaceList"
                              :sub-contractors-list="subContractorsList"
                              :client-orders="dataFromSearch.client_orders"
                              :client="dataFromSearch.client"
                              :selected-company-id="selectedCompany.id"
                              :position="item"
                              @refresh="refreshAllData()"
                            />
                            <ArchivePosition 
                              v-if="selectedCompany && item"
                              :position-id="item.expedition_position_id"
                              :selected-company-id="selectedCompany.id"
                              position-type="expedition"
                              @refreshPositions="refreshAllData()"
                            />
                          </div>
                        </template>
                      </v-data-table>
                    </v-card>
                  </div>
                </div>
                <div v-else class="informative-text" style="display: flex; align-items: center">
                  <v-chip
                    variant="text"
                    color="secondary"
                  >
                    <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                    Aucune {{ dataFromSearch.designation + ' ' + dataFromSearch.reference }} chez les sous-traitants n'est enregistrée
                  </v-chip>
                </div>
              </div>
            </v-card>

            <v-card class="b1-container" style="margin:0.4em; padding: 0.4em;">
              <div class="b1-top-content">
                <CardTitle
                  title="Stock lieu(x) de stockage" 
                  icon="mdi-warehouse"
                />
              </div>
              <div class="b1-middle-content">
                <div v-if="dataFromSearch.positions_by_logistic_place && dataFromSearch.positions_by_logistic_place.length > 0">
                  <div v-for="logisticPlace in dataFromSearch.positions_by_logistic_place" :key="logisticPlace.logistic_place_id" class="mb-4">
                    <v-card style="margin:0.4em; padding: 0.4em; margin-bottom: -1em;">
                      <v-card-title>
                        <v-chip variant="elevated">
                          <v-icon class="mr-1">mdi-human-dolly</v-icon>
                          {{ logisticPlace.logistic_place_name }}
                        </v-chip>
                      </v-card-title>
                      <v-divider></v-divider>
                      <v-data-table
                        :loading="loading"
                        :items="logisticPlace.positions"
                        density="dense"
                        :headers="logisticplacesHeaders"
                      >
                        <template v-slot:item.quantity="{ item }">
                          <v-chip variant="text" style="margin: 0.2em">
                            <v-icon color="success" class="mr-2">mdi-package-variant-closed-check</v-icon>
                            {{ item.quantity }}
                          </v-chip>
                        </template>
                        <template v-slot:item.actions="{ item }">
                          <div class="actions-slot">
                            <TransferPosition
                              v-if="selectedCompany && item && dataFromSearch.client.name"
                              origin="logistic_place"
                              :logistic-place-list="logisticPlaceList"
                              :sub-contractors-list="subContractorsList"
                              :client="dataFromSearch.client"
                              :client-orders="dataFromSearch.client_orders"
                              :selected-company-id="selectedCompany.id"
                              :position="item"
                              @refresh="refreshAllData()"
                            />
                            <ArchivePosition 
                              v-if="selectedCompany && item"
                              :position-id="item.expedition_position_id"
                              :selected-company-id="selectedCompany.id"
                              position-type="expedition"
                              @refreshPositions="refreshAllData()"
                            />
                          </div>
                        </template>
                      </v-data-table>
                    </v-card>
                  </div>
                </div>
                <div v-else class="informative-text" style="display: flex; align-items: center">
                  <v-chip
                    variant="text"
                    color="secondary"
                  >
                    <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                    Aucune {{ dataFromSearch.designation + ' ' + dataFromSearch.reference }} sur les lieux de stockage n'est enregistrée
                  </v-chip>
                </div>
              </div>
            </v-card>
            </div>
        </v-card>
        </v-tabs-window-item>
        <v-tabs-window-item value="two">
          <v-card class="b1-container ma-2">
          <div class="b1-top-content mt-0 mb-2">
            <CardTitle 
              title="Commande client"
              icon="mdi-cube-send"
            />
            <span class="mr-3">
               <CreateClientOrder
                v-if="selectedCompany && dataFromSearch.reference && dataFromSearch.designation && dataFromSearch.client"
                :part-id="currentPartId"
                :selected-company-id="selectedCompany.id"
                :part-name="`${dataFromSearch.reference} ${dataFromSearch.designation}`"
                :client="dataFromSearch.client"
                @refresh-client-orders="refreshAllData()"
                >
              </CreateClientOrder>
            </span>
          </div>
          <div class="b1-middle-content">
            <v-data-table
              :loading="loading"
              v-if="(dataFromSearch.client_orders && dataFromSearch.client_orders.length > 0) || loading"
              :items="dataFromSearch.client_orders"
              :headers="clientOrdersHeaders"
              density="dense"
              no-data-text="Pas de commande client"
            >
            <template v-slot:item.client_order_number="{ item }">
                <v-chip variant="elevated" color="white">
                  {{ item.client_order_number }}
                </v-chip>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip variant="text" :color="getClientOrderStatus(item.status).color">
                <v-icon class="mr-1" :icon="getClientOrderStatus(item.status).icon" />
                {{ getClientOrderStatus(item.status).label }}
              </v-chip>
            </template>
            <template v-slot:item.quantity="{item}">
              <v-chip variant="text">
                <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                {{ item.quantity }}
              </v-chip>
            </template>
            <template v-slot:item.remaining_quantity_to_be_delivered="{item}">
              <v-chip variant="text" :color="item.remaining_quantity_to_be_delivered  ? 'warning' : 'success'">
                <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                {{ item.remaining_quantity_to_be_delivered }}
              </v-chip>
            </template>
            <template v-slot:item.real_quantity_delivered="{item}">
              <v-chip variant="elevated" :color=" item.real_quantity_delivered > item.quantity ? 'success' : 'warning'">
                <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                {{ item.real_quantity_delivered }}
              </v-chip>
            </template>
            <template v-slot:item.price="{ item }">
                <v-chip
                    class="index-slot"
                    variant="outlined"
                    color="blue"
                >
                    {{ item.price ? item.price.toFixed(2) : 'n/a' }}
                </v-chip>
            </template>
            <template v-slot:item.delivery_date="{ item }">
              <v-chip variant="elevated" color="white" class="delivery-time-cell">
                {{ new Date(item.delivery_date).toLocaleDateString() }}
              </v-chip>
            </template>
            <template v-slot:item.real_delivery_time="{ item }">
              <v-chip :variant="item.real_delivery_time ? 'elevated' : 'text'" :color="item.real_delivery_time ? 'white' : 'dark'" class="delivery-time-cell ma-1">
                {{ item.real_delivery_time ? new Date(item.real_delivery_time).toLocaleDateString() : 'Pas de donnée' }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
                <div class="actions-slot">
                  <!-- <EditClientOrder
                    v-if="selectedCompany && item && currentPartId"
                    :selected-company-id="selectedCompany.id"
                    :part-id="currentPartId"
                    :order="item"
                    @order-refresh="refreshAllData()"
                  /> -->
                  <ArchivateOrder
                    v-if="selectedCompany && item && item.status !== 'delivered'"
                    origin="client"
                    :selected-company-id="selectedCompany.id"
                    :order="item"
                    @refresh-client-orders="refreshAllData()"
                  />
                  <DeletingOrder
                    style="margin-left: -1.2em;"
                    v-if="selectedCompany && item"
                    :selected-company-id="selectedCompany.id"
                    :client-order-id="item.id"
                    :order-number="item.client_order_number"
                    order-type="client"
                    @order-refresh="refreshAllData()"
                  />
                </div>
            </template>
            </v-data-table>
            <div v-else class="informative-text" style="display: flex; align-items: center">
              <v-chip
                variant="text"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                Aucune {{ dataFromSearch.designation + ' ' + dataFromSearch.reference }} en commande client n'est enregistrée
              </v-chip>
            </div>
          </div>
        </v-card>

        <v-card class="b1-container ma-2">
          <div class="b1-top-content mt-0 mb-2">
            <CardTitle
              title="Commande fournisseur" 
              icon="mdi-factory"
            />
            <span class="mr-3">
              <CreateSupplierOrder
                v-if="dataFromSearch.client_orders && selectedCompany && dataFromSearch.client && dataFromSearch.reference && dataFromSearch.designation"
                :selected-company-id="selectedCompany.id"
                :latest-supplier-price="dataFromSearch.supplier_price"
                :client-id="dataFromSearch.client.id"
                :client-orders="dataFromSearch.client_orders"
                :supplier-from-parent="dataFromSearch.suppliers"
                :reference-and-designation="`${dataFromSearch.reference} ${dataFromSearch.designation}`"
                @refresh-supplier-orders="refreshAllData()"
               />
            </span>
          </div>
          <div class="b1-middle-content">
            <v-data-table
              :loading="loading"
              v-if="(dataFromSearch.supplier_orders && dataFromSearch.supplier_orders.length > 0) || loading"
              :items="dataFromSearch.supplier_orders"
              density="dense"     
              :headers="supplierOrdersHeaders"
              no-data-text="Pas de commande fournisseur"
            >
            <template v-slot:item.price="{ item }">
                <v-chip
                    class="index-slot"
                    variant="outlined"
                    color="blue"
                >
                    {{ item.price }}
                </v-chip>
            </template>
            <template v-slot:item.supplier_order_number="{ item }">
                <v-chip variant="elevated" color="white">
                  {{ item.supplier_order_number }}
                </v-chip>
            </template>
            <template v-slot:item.original_quantity="{ item }">
                <v-chip variant="text">
                  <v-icon class="mr-2">mdi-package-variant-closed-plus</v-icon>
                  {{ item.original_quantity }}
                </v-chip>
            </template>

            <template v-slot:item.quantity="{ item }">
              <v-chip v-if="item.quantity < 0 && item.status !== 'completed'" variant="text" color="red">
                <v-icon class="mr-2">mdi-alert-circle-outline</v-icon>
                Excédent de {{ Math.abs(item.quantity) }} 
              </v-chip>

              <v-chip v-else-if="item.quantity > 0 && item.status !== 'completed'" variant="text" color="warning"> 
                <v-icon class="mr-2">mdi-progress-download</v-icon>
                {{ item.quantity }} restant à livrer
              </v-chip>

              <v-chip v-else-if="item.status === 'completed'" variant="text" color="success">
                <v-icon class="mr-2">mdi-cube-send</v-icon>
                Expédiée (Total livré : {{ item.real_quantity_delivered }})
              </v-chip>
            </template>

            <template v-slot:item.partial_quantity_delivered="{ item }">
              <v-chip v-if="item.partial_quantity_delivered > 0" variant="text" color="orange">
                <v-icon class="mr-2">mdi-progress-clock</v-icon>
                Partiel livré : {{ item.partial_quantity_delivered }}
              </v-chip>
            </template>

            <template v-slot:item.real_quantity_delivered="{ item }">
              <v-chip v-if="item.real_quantity_delivered > 0" :color="item.status === 'completed' ? 'green' : 'blue'" variant="text">
                <v-icon class="mr-2">mdi-check-circle-outline</v-icon>
                Total livré : {{ item.real_quantity_delivered }}
              </v-chip>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip variant="text" style="margin-left: -12px; font-weight: 500">
                <v-icon :color="statusIconColor(item.status)" style="margin-right: 4px">
                  {{ statusIcon(item.status) }}
                </v-icon>
                <span>{{ statusText(item.status) }}</span>
              </v-chip>
            </template>
            <template v-slot:item.delivery_date="{ item }">
              <v-chip variant="elevated" color="white" class="ma-1">
                {{ new Date(item.delivery_date).toLocaleDateString() }}
              </v-chip>
            </template>
            <template v-slot:item.real_delivery_date="{ item }">
              <v-chip :variant="item.real_delivery_date ? 'elevated' : 'text'" :color="item.real_delivery_date ? 'white' : 'dark'" class="ma-1">
                {{ item.real_delivery_date ? new Date(item.real_delivery_date).toLocaleDateString() : 'Pas de donnée' }}
              </v-chip>
            </template>
            <template v-slot:item.shipped_quantity="{ item }">
              {{ item.shipped_quantity ? item.shipped_quantity : "Aucun envoi" }}
            </template>
            <template v-slot:item.actions="{ item }">
              <div class="actions-slot">
                  <GenerateOrderSlipPDF 
                    v-if="dataFromSearch.client_orders && selectedCompany"
                    :selected-company-id="selectedCompany.id"
                    :transporters="transporters"
                    :order="item"
                  />
                  <ArchivateOrder
                    v-if="selectedCompany && item && item.status !== 'completed'"
                    origin="supplier"
                    :order="item"
                    :selected-company-id="selectedCompany.id"
                    :real-delivery-date="item.real_delivery_date"
                    @refresh-client-orders="refreshAllData()"
                  />
                  <DeletingOrder
                      v-if="selectedCompany && item"
                      :selected-company-id="selectedCompany.id"
                      :supplier-order-id="item.id"
                      :order-number="item.orderNumber"
                      order-type="supplier"
                      @order-refresh="refreshAllData()"
                    >
                  </DeletingOrder>
              </div>
            </template>
            </v-data-table>
            <div v-else class="informative-text" style="display: flex; align-items: center">
              <v-chip
                variant="text"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                Aucune {{ dataFromSearch.designation + ' ' + dataFromSearch.reference }} en commande fournisseur n'est enregistrée
              </v-chip>
            </div>
          </div>
        </v-card>

        <v-card class="b1-container ma-2">
          <div class="b1-top-content mt-0 mb-2 mr-3">
            <CardTitle
              title="Programme des expéditions" 
              icon="mdi-ferry"
            />
            <v-chip
                variant="outlined"
                color="blue"
                @click="router.push('/expeditions')"
            >
                <v-icon class='mr-2'>mdi-ferry</v-icon>
                <span>Gérer les expéditions</span>
            </v-chip> 
          
          </div>
          <div class="b1-middle-content">
            <v-data-table
              :loading="loading"
              v-if="(dataFromSearch.expeditions && dataFromSearch.expeditions.length > 0) || loading"
              :items="dataFromSearch.expeditions"
              :headers="expeditionsListHeaders"
              items-per-page="5"
              density="compact"
            >
            <template v-slot:item.expedition_number="{item}">
              <v-chip variant="elevated" color="white">
                {{ item.expedition_number }}
              </v-chip>
            </template>
            <template v-slot:item.supplier_order_number="{item}">
              <v-chip variant="elevated" color="white">
                {{ item.supplier_order_number }}
              </v-chip>
            </template>
            <template v-slot:item.quantity="{item}">
              <v-chip variant="text" color="success">
                <v-icon class="mr-2">mdi-truck-fast-outline</v-icon>
                {{ item.quantity }}
              </v-chip>
            </template>
            <template v-slot:item.real_departure_time="{ item }">
              <v-chip variant="text">
                {{ item.real_departure_time ? new Date(item.real_departure_time).toLocaleDateString() : "Pas de donnée" }}
              </v-chip>
            </template>
            <template v-slot:item.estimated_arrival_time="{ item }">
              <v-chip variant="text">
                {{ item.estimated_arrival_time ? new Date(item.estimated_arrival_time).toLocaleDateString() : "Pas de donnée" }}
              </v-chip>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip
                variant="text"
                outlined
                :color="item.status === 'delivered' ? 'success' : 'blue'"
              >
                <v-icon
                  :color="item.status === 'delivered' ? 'success' : 'blue'"
                  class="mr-1"
                  left
                >
                  {{ item.status === 'delivered' ? 'mdi-package-variant-closed-check' : 'mdi-ferry' }}
                </v-icon>
                  {{ item.status === 'delivered' ? 'Livraison terminée' : 'En cours d’acheminement' }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <div class="actions-slot">
                <HandleExpedition
                  :user-id="userId" 
                  :expedition="item"
                >
                </HandleExpedition>
              </div>
            </template>
            </v-data-table>
            <div v-else class="informative-text" style="display: flex; align-items: center">
              <v-chip
                variant="text"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                Aucune {{ dataFromSearch.designation + ' ' + dataFromSearch.reference }} en expédition n'est enregistrée
              </v-chip>
            </div>
          </div>
        </v-card>
        </v-tabs-window-item>
        <v-tabs-window-item value="three">
          <v-card class="b1-container ma-2 mb-4">
          <div class="d-flex align-center justify-lg-space-between">
            <CardTitle 
              title="Informations sur la pièce"
              icon="mdi-barcode-scan"
            />
            <EditPart
                v-if="selectedCompany && dataFromSearch"
                :selected-company-id="selectedCompany.id"
                :part="dataFromSearch"
            />
          </div>
          <div class="d-flex align-center ml-5">
              <span class="informative-text ml-1">Technique et générale : </span>
          </div>
          <v-row class="pr-4 pl-4 mb-0 ml-1" style="margin-bottom: -2.4em; font-size: 14px;" align="center" justify="space-between">
            <v-col cols="12" md="6" class="d-flex flex-column mb-0">
              <div v-if="dataFromSearch.material">
                  <v-icon class="mr-2">mdi-label-outline</v-icon>
                  <span class="mr-1">Matière : <strong>{{ dataFromSearch.material }}</strong></span>
              </div>
              <div v-if="dataFromSearch.weight">
                  <v-icon class="mr-2">mdi-weight-gram</v-icon>
                  <span class="mr-1">Poids unitaire (gr) : <strong>{{ dataFromSearch.weight }}</strong></span>
              </div>
              <div v-if="dataFromSearch.drawing">
                  <v-icon class="mr-2">mdi-draw-pen</v-icon>
                  <span class="mr-1">Numéro de dessin : <strong>{{ dataFromSearch.drawing }}</strong></span>
              </div>
            </v-col>
            <v-col cols="12" md="6" class="d-flex flex-column mb-0">
              <div v-if="dataFromSearch.designation">
                  <v-icon class="mr-2">mdi-barcode-scan</v-icon>
                  <span class="mr-1">Désignation : <strong>{{ dataFromSearch.designation }}</strong></span>
              </div>
              <div v-if="dataFromSearch.reference">
                  <v-icon class="mr-2">mdi-rename</v-icon>
                  <span class="mr-1">Référence : <strong>{{ dataFromSearch.reference }}</strong></span>
              </div>
              <div v-if="dataFromSearch.client">
                  <v-icon class="mr-2" >mdi-account-arrow-left-outline</v-icon>
                  <span class="mr-1">Client : <strong>{{ dataFromSearch.client.name }}</strong></span>
              </div>
            </v-col>
          </v-row>
          <div class="d-flex align-center ml-5">
              <span class="informative-text ml-1">Financier : </span>
            </div>
          <div v-if="dataFromSearch.current_client_price || dataFromSearch.current_supplier_price" class="ml-4 mb-4 pr-4 pl-4" style=" font-size: 14px;">
                  <v-icon class="mr-2" color="blue">mdi-swap-horizontal</v-icon>
                  <span class="mr-1"><strong>Marge brute</strong> avant sous-traitance et transports : <strong>{{ (dataFromSearch.current_client_price - dataFromSearch.current_supplier_price).toFixed(2) }}</strong></span>
              <div v-if="dataFromSearch.current_client_price">
                    <v-icon class="mr-2">mdi-currency-usd</v-icon>
                    <span class="mr-1">Dernier prix unitaire client : <strong>{{ dataFromSearch.current_client_price }}</strong></span>
              </div>
              <div v-if="dataFromSearch.current_supplier_price">
                    <v-icon class="mr-2">mdi-currency-usd</v-icon>
                    <span class="mr-1">Dernier prix unitaire fournisseur : <strong>{{ dataFromSearch.current_supplier_price }}</strong></span>
              </div>
              <div class="d-flex mt-2" style="margin-bottom: -0.6em;">
                <span class="informative-text" style="font-style: italic;">Les données financières sont issues de l'activité des commandes client et fournisseur</span>
              </div>
          </div>

          <div class="d-flex">
            <v-card class="pa-1 flex-grow-1 mr-3 ml-3 mb-3">
              <span class="informative-text ml-1">
                <v-chip
                  class="mt-2"
                  variant="text"
                >
                  <v-icon start class="ml-0">mdi-account-multiple</v-icon>
                  Liste des fournisseur(s)
                </v-chip>
              </span>
              <div class="d-flex flex-wrap justify-center align-items-center" v-if="dataFromSearch.suppliers && dataFromSearch.suppliers.length > 0">
                <v-divider class="mb-2" color="transparent"/>
                <v-chip
                  class="ma-1 mt-1"
                  v-for="supplier in dataFromSearch.suppliers"
                  :key="supplier.id"
                  style="width: fit-content;"
                  variant="outlined"
                  color='blue'
                >
                  <v-icon class="mr-2">mdi-account-arrow-right-outline</v-icon>
                  <span class="mr-2" >{{ supplier.name }}</span>
                </v-chip>
              </div>
              <div v-else class="d-flex flex-wrap align-items-center">
                <v-chip
                  class="ma-1 mt-3"
                  style="width: fit-content;"
                  variant="outlined"
                  color="secondary"
                >
                  <v-icon class="mr-2">mdi-backspace-reverse-outline</v-icon>
                  <span class="mr-1" >Aucun fournisseur enregistré</span>
                </v-chip>
              </div>
            </v-card>

            <v-card class="pa-1 flex-grow-1 mr-3 ml-3 mb-3">
              <span class="informative-text ml-1">
                <v-chip
                  class="mt-2"
                  variant="text"
                >
                  <v-icon start class="ml-0">mdi-account-multiple</v-icon>
                  Liste des sous-traitant(s)
                </v-chip>
              </span>
            
              <div class="d-flex flex-wrap justify-center align-items-center" v-if="dataFromSearch.sub_contractors && dataFromSearch.sub_contractors.length > 0">
                <v-divider class="mb-2" color="transparent"/>
                <v-chip
                  class="ma-1"
                  v-for="subcontractor in dataFromSearch.sub_contractors"
                  :key="subcontractor.id"
                  style="width: fit-content;"
                  variant="outlined"
                  color='blue'
                >
                  <v-icon class="mr-2">mdi-screw-machine-flat-top</v-icon>
                  <span class="mr-2" >{{ subcontractor.name }}</span>
                </v-chip>
              </div>
              <div v-else class="d-flex flex-wrap align-items-center">
                <v-chip
                  class="ma-1 mt-3"
                  style="width: fit-content;"
                  variant="outlined"
                  color="secondary"
                >
                  <v-icon class="mr-2">mdi-backspace-reverse-outline</v-icon>
                  <span class="mr-1" >Aucun sous-traitant enregistré</span>
                </v-chip>
              </div>
            </v-card>
          </div>
          <v-card class="pa-1 flex-grow-1 mr-3 ml-3 mb-3" v-if="dataFromSearch.lifecycle_steps && dataFromSearch.lifecycle_steps.length > 0">
            <CardTitle
              title="Cycle de vie"
              icon="mdi-sync"
            />
            <LifecycleTimeline 
                :lifecycleSteps="dataFromSearch.lifecycle_steps"
                direction="horizontal"
                lineColor="warning"
                iconColor="dark"
            />
          </v-card>
          
        </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
  </v-card>

</template>

<style scoped lang="scss">
@import url('../assets/main.scss');

#data-table {
  padding: 0.4em 0.6em;
}

:deep(.v-slide-group__content) {
  display: flex;
  justify-content: center;
}

.v-chip {
  font-weight: 500;
}
</style>
