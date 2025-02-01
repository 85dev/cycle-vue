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
import EditClientOrder from '@/components/modals/EditClientOrder.vue'
import EditPart from '@/components/modals/EditPart.vue';
import ArchivateOrder from '@/components/modals/ArchivateOrder.vue'
import DeletingOrder from '@/components/modals/DeletingOrder.vue'
import SortClientPositionsModal from '@/components/modals/SortClientPositions.vue';
import PositionHistory from '@/components/modals/PositionHistory.vue';
import TransferPosition from '@/components/modals/TransferPosition.vue';
import HandleConsignmentConsumption from '@/components/modals/HandleConsignmentConsumption.vue';
import SpinnLoader from '@/components/SpinnLoader.vue';
import TransferPositionFromClient from '@/components/modals/TransferPositionFromClient.vue';

// Constant data
import { clientOrdersHeaders, consumptionPositionsHeaders, supplierOrdersHeaders, clientStockPositionsHeaders, expeditionsListHeaders, subcontractorHeaders, logisticplacesHeaders } from '@/models/tableHeaders.js'
import CardTitle from '@/components/CardTitle.vue';

const selectedCompany = computed(() => sessionStore.getters.getSelectedCompany())
const dataFromSearch = ref({})
const currentPartId = ref(null)
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const clientPositionModal = computed(() => { return unsortedClientPositions.value.length > 0 })
const calculatedStocks = ref({})
const subContractorsList = ref([])
const logisticPlaceList = ref([])
const unsortedClientPositions = ref([])

async function fetchPartData() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/part_related_data/${currentPartId.value}`)
  dataFromSearch.value = response;
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
  }
});

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

  <v-card class="main-card" style="margin-top: 2em; margin-bottom: 2em;">

    <div class="part-content-container">

        <SortClientPositionsModal
          v-if="selectedCompany && clientPositionModal && dataFromSearch.client"
          :open-modal="clientPositionModal"
          :part-id="currentPartId"
          :selected-company-id="selectedCompany.id"
          :client="dataFromSearch.client"
          :client-positions="unsortedClientPositions"
          @refreshClientPositions="refreshAllData()"
        />

        <v-card class="b1-container mt-3 mb-2">
          <div class="d-flex align-center justify-lg-space-between">
            <CardTitle 
              title="Informations sur la pièce"
              icon="mdi-cog-outline"
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
                  <v-icon class="mr-2">mdi-cog-outline</v-icon>
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
                    <span class="mr-1">Dernier prix unitaire fournisseur : <strong>{{ dataFromSearch.supplier_price }}</strong></span>
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
        </v-card>

      <v-card class="b1-container">
        <CardTitle 
              title="Pièces commandées, réservées et à terme"
              icon="mdi-package-variant-closed"
            />
            <v-expansion-panels class="pa-2">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-chip variant="text" color="blue" elevation="2">
                    <v-icon class="mr-2">mdi-package-variant</v-icon>
                    Détail des stocks
                  </v-chip>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <!-- Current Stock -->
                  <div v-if="calculatedStocks.current_stock" class="mb-6">
                    <v-data-table
                      :items="[
                        { type: 'En stock consignation client', quantity: calculatedStocks.current_stock.consignment_stock },
                        { type: 'En stock standard client', quantity: calculatedStocks.current_stock.standard_stock },
                        { type: 'Total en stock sous-traitant(s)', quantity: calculatedStocks.current_stock.subcontractor_stock },
                        { type: 'Total sur lieu(x) logistique', quantity: calculatedStocks.current_stock.logistic_place_stock },
                        { type: 'Total', quantity: calculatedStocks.current_stock.total },
                      ]"
                      :headers="[
                        { title: 'Stocks disponibles', value: 'type' },
                        { title: 'Quantité', value: 'quantity' },
                      ]"
                      class="elevation-1"
                      density="compact"
                      hide-default-footer
                    >
                      <template v-slot:item.quantity="{ item }">
                        <template v-if="item.type === 'Total'">
                          <v-chip variant="text">
                            <v-icon class="mr-1">mdi-package-variant-closed-check</v-icon>
                            {{ item.quantity }}
                          </v-chip>
                        </template>
                        <template v-else>
                          <!-- Default Display for Other Rows -->
                          <v-chip variant="text">
                            <v-icon class="mr-1">
                              {{ item.quantity > 0 ? 'mdi-package-variant-closed-check' : 'mdi-package-variant-remove' }}
                            </v-icon>
                            {{ item.quantity }}
                          </v-chip>
                        </template>
                      </template>
                      <template v-slot:item.total="{ item }">
                        <strong>{{ item.total }}</strong>
                      </template>
                    </v-data-table>
                  </div>

                  <div v-if="calculatedStocks.ordered_stock" class="mb-6">
                    <v-data-table
                      :items="[
                        { type: 'Total des expéditions en cours', quantity: calculatedStocks.ordered_stock.expeditions },
                        { type: 'Total des commandes fournisseur', quantity: calculatedStocks.ordered_stock.supplier_orders },
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
                          <v-icon class="mr-1">{{ item.quantity > 0 ? 'mdi-package-variant-closed-check' : 'mdi-package-variant-remove' }}</v-icon>
                          {{ item.quantity }}
                        </v-chip>
                      </template>
                    </v-data-table>
                  </div>

                  <div v-if="calculatedStocks.reserved_stock" class="mb-6">
                    <v-data-table
                      :items="[
                        { type: 'Total des commandes client', quantity: calculatedStocks.reserved_stock },
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
                          <v-chip variant="text">
                            <v-icon class="mr-1">{{ item.quantity > 0 ? 'mdi-package-variant-closed-check' : 'mdi-package-variant-remove' }}</v-icon>
                            {{ item.quantity }}
                          </v-chip>
                      </template>
                    </v-data-table>
                  </div>

                  <div v-if="calculatedStocks.total_current_stock || calculatedStocks.total_future_stock">
                    <v-data-table
                      :items="[
                        { type: 'Total actuel disponible', quantity: calculatedStocks.total_current_stock },
                        { type: 'Total disponible à terme', quantity: calculatedStocks.total_future_stock }
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
                        <template v-if="item.type === 'Total disponible à terme' && item.quantity < 0">
                          <v-chip variant="text">
                            <v-icon color="red" class="mr-1">mdi-alert-circle-outline</v-icon>
                            {{ item.quantity }}
                          </v-chip>
                        </template>
                        <template v-else>
                          <v-chip variant="elevated" color="white">
                            <v-icon class="mr-1">
                              {{ item.type === 'Total disponible à terme' ? 'mdi-check-circle-outline' : 'mdi-package-variant-closed-check' }}
                            </v-icon>
                            {{ item.quantity }}
                          </v-chip>
                        </template>
                      </template>
                    </v-data-table>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
      </v-card>

      <div class="b1-hand-container">

        <v-card class="b1-container">
          
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
          <!-- Consignment Stock Positions -->
          <v-expansion-panels class="pa-2">
            <v-expansion-panel
              v-for="stock in dataFromSearch.consignment_stock_positions.filter(stock => stock.client_positions.length > 0)"
              :key="'consignment-' + stock.id"
            >
              <!-- Panel Title -->
              <v-expansion-panel-title>
                <v-chip variant="text" color="blue" elevation="2">
                  <v-icon class="mr-2">mdi-map-marker-circle</v-icon>
                  {{ stock.name ? stock.name : stock.address }}
                </v-chip>
                <v-spacer></v-spacer>
              </v-expansion-panel-title>

              <!-- Panel Content -->
              <v-expansion-panel-text>
                <v-card class="b1-middle-content" id="data-table" style="margin-bottom: 0.1em;">
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
                        <div v-if="stock.current_quantity !== undefined && stock.current_quantity !== null" class="d-flex flex-column">
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
                      <v-chip class="mt-2 mb-1" variant="outlined" color="blue">
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
                      </template>
                    </v-data-table>
                  </v-card>

                  <v-card v-if="(stock && stock.consumption_positions && stock.consumption_positions.length > 0) || loading" style="margin-top: 1em; margin-bottom: 0.1em;">
                    <span class="informative-text">
                      <v-chip class="mt-2 mb-1" variant="outlined" color="blue">
                        <v-icon start class="ml-0">mdi-package-variant-minus</v-icon>
                        Historique des consommations
                      </v-chip>
                    </span>
                    <v-data-table
                      :loading="loading"
                      :items="stock.consumption_positions"
                      :headers="consumptionPositionsHeaders"
                      density="dense"
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
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
        <div class="ml-5" v-if="dataFromSearch.consignment_stock_positions">
            <div style="margin-top: -1.2em;" class="mb-1" v-if="dataFromSearch.consignment_stock_positions && dataFromSearch.consignment_stock_positions.filter(stock => stock.client_positions.length > 0).length === 0">
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

        <v-card class="b1-container">
          <div class="mt-3" v-if="dataFromSearch.standard_stock_positions">
          <CardTitle 
              title="Stock standard client"
              icon="mdi-dolly"
            />
            <v-expansion-panels class="pa-2">
              <v-expansion-panel
                v-for="stock in dataFromSearch.standard_stock_positions.filter(stock => stock.client_positions.length > 0)"
                :key="'standard-' + stock.id"
              >
                <!-- Panel Title -->
                <v-expansion-panel-title>
                  <v-chip variant="text" color="blue" elevation="2">
                    <v-icon class="mr-2">mdi-map-marker-circle</v-icon>
                    {{ stock.name ? stock.name : stock.address }}
                  </v-chip>
                  <v-spacer></v-spacer>
                </v-expansion-panel-title>

                <!-- Panel Content -->
                <v-expansion-panel-text>
                  <v-card class="b1-middle-content" id="data-table">
                    <v-card>
                      <v-row class="pa-4" align="center" justify="space-between">
                        <v-col cols="12" md="6" class="d-flex flex-column">
                          <!-- Stock Address -->
                          <div>
                            <v-chip variant="text" class="text-body-2">
                              <v-icon class="mr-2">mdi-location-enter</v-icon>
                              {{ stock.name }}
                            </v-chip> 
                          </div>
                          <!-- Contact Name -->
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
                          </div>
                        </template>
                      </v-data-table>           
                    </v-card>
                  </v-card>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          <div class="ml-5" v-if="dataFromSearch.standard_stock_positions">
            <div style="margin-top: -1.2em;" class="mb-1" v-if="dataFromSearch.standard_stock_positions && dataFromSearch.standard_stock_positions.filter(stock => stock.client_positions.length > 0).length === 0">
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

        <v-card class="b1-container">
          <div class="b1-top-content mt-0 mb-2">
            <CardTitle 
              title="Commande client"
              icon="mdi-cube-send"
            />
            <span class="mr-3">
              <!-- MODALS -->
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
            <template v-slot:item.status="{ item }">
              <v-chip variant="text" style="margin-left: -12px;">
                <v-icon 
                  class="mr-1"
                  :icon="item.status === 'delivered' ? 'mdi-check-circle-outline' : 'mdi-progress-clock'"
                  :color="item.status === 'delivered' ? 'success' : 'warning'"
                />
                {{ item.status === 'delivered' ? 'Livrée' : 'Non-livrée' }}
              </v-chip>
            </template>
            <template v-slot:item.quantity="{item}">
              <v-chip variant="text" color="success" style="margin-left: -12px;">
                <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                {{ item.quantity }}
              </v-chip>
            </template>
            <template v-slot:item.price="{ item }">
                <v-chip
                    class="index-slot"
                    variant="outlined"
                    color="blue"
                >
                    {{ item.price ? item.price.toFixed(2) + ' €' : 'n/a' }}
                </v-chip>
            </template>
            <template v-slot:item.delivery_date="{ item }">
              <v-chip variant="elevated" color="white" class="delivery-time-cell">
                {{ new Date(item.delivery_date).toLocaleDateString() }}
              </v-chip>
            </template>
            <template v-slot:item.real_delivery_time="{ item }">
              <v-chip :variant="item.real_delivery_time ? 'elevated' : 'text'" :color="item.real_delivery_time ? 'white' : 'dark'" class="delivery-time-cell ma-1">
                {{ item.real_delivery_time ? new Date(item.real_delivery_time).toLocaleDateString() : 'Pas de donée' }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
                <div class="actions-slot">
                  <EditClientOrder
                    v-if="selectedCompany && item && currentPartId"
                    :selected-company-id="selectedCompany.id"
                    :part-id="currentPartId"
                    :order="item"
                    @order-refresh="refreshAllData()"
                  />
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

        <v-card class="b1-container">
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
                :reference-and-designation="`${dataFromSearch.reference} ${dataFromSearch.designation}`"
                @refresh-supplier-orders="refreshAllData()"
               >
              </CreateSupplierOrder>
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
                    {{ item.price + ' €' }}
                </v-chip>
            </template>
            <template v-slot:item.original_quantity="{ item }">
                <v-chip variant="text" color="blue">
                  <v-icon style="margin-right: 6px">mdi-package-variant-closed-plus</v-icon>
                  {{ item.original_quantity }}
                </v-chip>
            </template>
            <template v-slot:item.quantity="{ item }">
                <v-chip variant="text" color="success" v-if="item.quantity < 0 && !item.delivered">
                  <v-icon style="margin-right: 6px">mdi-progress-check</v-icon>
                  Excédent de {{ Math.abs(item.quantity) }} 
                </v-chip>
                <v-chip variant="text" color="warning" v-else-if="item.quantity > 0 && !item.delivered"> 
                  <v-icon style="margin-right: 6px">mdi-progress-download</v-icon>
                  {{ item.quantity }} 
                </v-chip>
                <v-chip variant="text" color="success" v-if="item.delivered"> 
                  <v-icon style="margin-right: 6px">mdi-cube-send</v-icon>
                  {{ 'Expédiée (0 à livrer)' }} 
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
                  <ArchivateOrder
                    v-if="selectedCompany && item && !item.delivered"
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

        <v-card class="b1-container">
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
                <span>Gérer les expédition</span>
            </v-chip> 
          
          </div>
          <div class="b1-middle-content">
            <v-data-table
              :loading="loading"
              v-if="(dataFromSearch.expeditions && dataFromSearch.expeditions.length > 0) || loading"
              :items="dataFromSearch.expeditions"
              :headers="expeditionsListHeaders"
              items-per-page="5"
              density="dense"
            >
            <template v-slot:item.quantity="{item}">
              <v-chip variant="text" color="success" style="margin: 0.2em">
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
                style="margin: 0.2em 0;"
                outlined
                :color="item.status === 'delivered' ? 'success' : 'blue'"
              >
                <v-icon
                  :color="item.status === 'delivered' ? 'success' : 'blue'"
                  style="margin-right: 4px;"
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

        <v-card class="b1-container">
          <div class="b1-top-content">
            <CardTitle
              title="Stock sous-traitant(s)" 
              icon="mdi-turbine"
            />
          </div>
          <div class="b1-middle-content">
            <div v-if="dataFromSearch.positions_by_sub_contractors && dataFromSearch.positions_by_sub_contractors.length > 0">
              <div v-for="subcontractor in dataFromSearch.positions_by_sub_contractors" :key="subcontractor.subcontractor_id" class="mb-4">
                <v-card style="margin:0.4em">
                  <v-card-title>
                    <v-chip variant="text">
                      <v-icon class="mr-1">mdi-account-wrench-outline</v-icon>
                      {{ subcontractor.subcontractor_name }}
                    </v-chip>
                  </v-card-title>
                  <v-divider></v-divider>
                  <v-data-table
                    :loading="loading"
                    :items="subcontractor.positions"
                    density="dense"
                    :headers="subcontractorHeaders"
                  >
                    <!-- Quantity Column -->
                    <template v-slot:item.quantity="{ item }">
                      <v-chip variant="text" style="margin: 0.2em">
                        <v-icon color="orange" class="mr-2">mdi-cog-sync-outline</v-icon>
                        {{ item.quantity }}
                      </v-chip>
                    </template>

                    <!-- Actions Column -->
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

        <v-card class="b1-container" style="margin-bottom: 0.6em;">
          <div class="b1-top-content">
            <CardTitle
              title="Stock lieu(x) de stockage" 
              icon="mdi-warehouse"
            />
          </div>
          <div class="b1-middle-content">
            <div v-if="dataFromSearch.positions_by_logistic_place && dataFromSearch.positions_by_logistic_place.length > 0">
              <div v-for="logisticPlace in dataFromSearch.positions_by_logistic_place" :key="logisticPlace.logistic_place_id" class="mb-4">
                <v-card style="margin:0.4em">
                  <v-card-title>
                    <v-chip variant="text">
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
                    <!-- Quantity Column -->
                    <template v-slot:item.quantity="{ item }">
                      <v-chip variant="text" style="margin: 0.2em">
                        <v-icon color="success" class="mr-2">mdi-package-variant-closed-check</v-icon>
                        {{ item.quantity }}
                      </v-chip>
                    </template>

                    <!-- Actions Column -->
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

    </div>
  </v-card>

</template>

<style scoped lang="scss">
@import url('../assets/main.scss');

#data-table {
  padding: 0.4em 0.6em;
}

.v-chip {
  font-weight: 500;
}
</style>
