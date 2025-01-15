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
import ArchivateClientOrder from '@/components/modals/ArchivateClientOrder.vue'
import DeletingOrder from '@/components/modals/DeletingOrder.vue'
import SupplierOrderDetails from '@/components/modals/SupplierOrderDetails.vue'
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
const clientPositionModal = ref(false);
const calculatedStocks = ref({})

async function fetchPartData() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/part_related_data/${currentPartId.value}`)
  dataFromSearch.value = response;
}

async function fetchSupplierOrders() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/supplier_orders_positions`);
  dataFromSearch.value.supplier_orders = response
}

async function fetchUnsortedClientPositions() {
  setTimeout(async() => {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/unsorted_client_positions`)
    dataFromSearch.value.unsorted_client_positions = response

    if (response.length > 0) {
      clientPositionModal.value = true;
    }
  }, 200);
}

async function fetchCalculatedStocks() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/clients/${dataFromSearch.value.client.id}/consignment_stocks_positions_by_client`)
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
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/client_orders`);
  dataFromSearch.value.client_orders = response
}

async function fetchExpeditions() {
  const response = await apiCaller.get(`companies/${selectedCompany.value.id}/parts/${currentPartId.value}/supplier_order_indexes_by_part`);
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

  <v-card class="main-card" style="margin-bottom: 2em;">

    <div class="part-content-container">

        <SortClientPositionsModal
          v-if="selectedCompany && clientPositionModal && dataFromSearch.client"
          :open-modal="clientPositionModal"
          :part-id="currentPartId"
          :selected-company-id="selectedCompany.id"
          :client="dataFromSearch.client"
          :client-positions="dataFromSearch.unsorted_client_positions"
          @refreshClientPositions="refreshAllData()"
        />

        <v-card class="b1-container mt-3 mb-3">
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
          <v-row class="pr-2 pl-2 mb-0" style="margin-bottom: -2.4em;" align="center" justify="space-between">
            <v-col cols="12" md="6" class="d-flex flex-column mb-0">
              <div v-if="dataFromSearch.material">
                <v-chip variant="elevated" class="text-body-2 mt-1">
                    <v-icon class="mr-2">mdi-label-outline</v-icon>
                    <span class="mr-1">Matière : <strong>{{ dataFromSearch.material }}</strong></span>
                </v-chip>
              </div>
              <div v-if="dataFromSearch.weight">
                <v-chip variant="elevated" class="text-body-2 mt-1">
                    <v-icon class="mr-2">mdi-weight-gram</v-icon>
                    <span class="mr-1">Poids unitaire (gr) : <strong>{{ dataFromSearch.weight }}</strong></span>
                </v-chip>
              </div>
              <div v-if="dataFromSearch.drawing">
                <v-chip variant="elevated" class="text-body-2 mt-1">
                    <v-icon class="mr-2">mdi-draw-pen</v-icon>
                    <span class="mr-1">Numéro de dessin : <strong>{{ dataFromSearch.drawing }}</strong></span>
                </v-chip>
              </div>
            </v-col>
            <v-col cols="12" md="6" class="d-flex flex-column mb-0">
              <div v-if="dataFromSearch.designation">
                <v-chip variant="elevated" color="blue" class="text-body-2">
                    <v-icon class="mr-2">mdi-cog-outline</v-icon>
                    <span class="mr-1">Désignation : <strong>{{ dataFromSearch.designation }}</strong></span>
                </v-chip>
              </div>
              <div v-if="dataFromSearch.reference">
                <v-chip variant="elevated" color="blue" class="text-body-2 mt-1">
                    <v-icon class="mr-2">mdi-rename</v-icon>
                    <span class="mr-1">Référence : <strong>{{ dataFromSearch.reference }}</strong></span>
                </v-chip>
              </div>
              <v-chip v-if="dataFromSearch.client" color="blue" class="mt-1" style="width: fit-content;" variant="elevated">
                  <v-icon class="mr-2" >mdi-account-arrow-left-outline</v-icon>
                  <span class="mr-1">Client : <strong>{{ dataFromSearch.client.name }}</strong></span>
              </v-chip>
            </v-col>
          </v-row>
          <div v-if="dataFromSearch.current_client_price || dataFromSearch.current_supplier_price" class="ml-1 mb-4">
            <div class="d-flex align-center">
              <span class="informative-text">Financier : </span>
            </div>
              <v-chip class="aligner mt-1" style="width: fit-content;" variant="elevated">
                  <v-icon class="mr-2" color="blue">mdi-swap-horizontal</v-icon>
                  <span class="mr-1"><strong>Marge brute</strong> avant sous-traitance et transports : <strong>{{ (dataFromSearch.current_client_price - dataFromSearch.current_supplier_price).toFixed(2) }}</strong></span>
              </v-chip>
              <div v-if="dataFromSearch.current_client_price">
                <v-chip variant="elevated" class="text-body-2 mt-1">
                    <v-icon class="mr-2">mdi-currency-usd</v-icon>
                    <span class="mr-1">Dernier prix unitaire client : <strong>{{ dataFromSearch.current_client_price }}</strong></span>
                </v-chip>
              </div>
              <div v-if="dataFromSearch.current_supplier_price">
                <v-chip variant="elevated" class="text-body-2 mt-1">
                    <v-icon class="mr-2">mdi-currency-usd</v-icon>
                    <span class="mr-1">Dernier prix unitaire fournisseur : <strong>{{ dataFromSearch.supplier_price }}</strong></span>
                </v-chip>
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
                  variant="elevated"
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
                  variant="elevated"
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

      <div class="b1-hand-container">

        <v-card class="b1-container">
          
        <div v-if="dataFromSearch.consignment_stock_positions">
          <div class="b1-top-content mt-0 mb-2 mr-3">
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
                <v-chip variant="elevated" color="blue">
                  <v-icon class="mr-2">mdi-map-marker-circle</v-icon>
                  {{ stock.address }}
                </v-chip>
                <v-spacer></v-spacer>
              </v-expansion-panel-title>

              <!-- Panel Content -->
              <v-expansion-panel-text>
                <v-card class="b1-middle-content" id="data-table" style="margin-bottom: 0.1em;">
                  <v-card>
                    <v-row class="pa-4" align="center" justify="space-between">
                      <v-col cols="12" md="6" class="d-flex flex-column">
                        <!-- Stock Address -->
                        <div>
                          <v-chip variant="elevated" class="text-body-2">
                            <v-icon class="mr-2">mdi-map-marker-circle</v-icon>
                            {{ stock.address }}
                          </v-chip>
                        </div>
                        <!-- Contact Name -->
                        <div>
                          <v-chip variant="elevated" class="text-body-2 mt-1">
                            <v-icon class="mr-2">mdi-account-circle-outline</v-icon>
                            {{ stock.contact_name }}
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
                        <v-chip variant="outlined" color="success" style="margin: 0.2em">
                          <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                          {{ item.quantity }}
                        </v-chip>
                      </template>
                      <template v-slot:item.actions="{item}">
                          <PositionHistory
                            v-if="selectedCompany && currentPartId && item.id"
                            :selected-company-id="selectedCompany.id"
                            :client-position-id="item.id"
                          />
                          <TransferPositionFromClient
                            v-if="selectedCompany && item && dataFromSearch.client && dataFromSearch.client_orders"
                            origin="consignment"
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
                        <v-chip variant="outlined" color="success" style="margin: 0.2em">
                          <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                          {{ item.quantity }}
                        </v-chip>
                      </template>
                      <template v-slot:item.consumption_period="{item}">
                        <v-chip variant="outlined" style="margin: 0.2em">
                          <v-icon color='orange' class="mr-2">mdi-package-variant-minus</v-icon>
                          {{ item.consumption_period }}
                        </v-chip>
                      </template>
                    </v-data-table>
                  </v-card>
                  <v-chip v-else variant="outlined" color='secondary' class="mt-4 mb-2" style="width: fit-content;">
                    <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                    Aucune  {{ dataFromSearch.designation  + ' ' + dataFromSearch.reference }} n'est enregistrée dans l'historique de consommation 
                  </v-chip>
                </v-card>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
        <div class="ml-5 mb-2" style="margin-top: -0.5em" v-if="dataFromSearch.consignment_stock_positions">
          <div v-if="dataFromSearch.consignment_stock_positions.filter(stock => stock.client_positions.length > 0).length === 0">
            <v-chip
                variant="outlined"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                  Aucune {{ dataFromSearch.designation  + ' ' + dataFromSearch.reference }} en stock consignation client n'est enregistrée
              </v-chip>
          </div>
        </div>

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
                  <v-chip variant="elevated" color="blue">
                    <v-icon class="mr-2">mdi-map-marker-circle</v-icon>
                    {{ stock.address }}
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
                            <v-chip variant="elevated" class="text-body-2">
                              <v-icon class="mr-2">mdi-map-marker-circle</v-icon>
                              {{ stock.address }}
                            </v-chip>
                          </div>
                          <!-- Contact Name -->
                          <div>
                            <v-chip variant="elevated" class="text-body-2 mt-1">
                              <v-icon class="mr-2">mdi-account-circle-outline</v-icon>
                              {{ stock.contact_name }}
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
                            <PositionHistory
                            v-if="selectedCompany && currentPartId && item.id"
                            :selected-company-id="selectedCompany.id"
                            :client-position-id="item.id"
                          />
                          <TransferPositionFromClient
                            v-if="selectedCompany && item && dataFromSearch.client && dataFromSearch.client_orders"
                            origin="consignment"
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
          <div class="ml-5 mb-2" v-if="dataFromSearch.standard_stock_positions">
            <div v-if="dataFromSearch.standard_stock_positions && dataFromSearch.standard_stock_positions.filter(stock => stock.client_positions.length > 0).length === 0">
              <v-chip
                variant="outlined"
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
              <v-icon :icon="item.status === 'In transit' ? 'mdi-ferry' : 'mdi-progress-clock'"></v-icon>
            </template>
            <template v-slot:item.quantity="{item}">
              <v-chip variant="outlined" color="success" style="margin: 0.2em;">
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
              <div class="delivery-time-cell">
                {{ new Date(item.delivery_date).toLocaleDateString() }}
              </div>
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
                  <ArchivateClientOrder
                    v-if="selectedCompany && item"
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
                variant="outlined"
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
                    {{ item.price }}
                </v-chip>
            </template>
            <template v-slot:item.original_quantity="{ item }">
                <v-chip variant="elevated" color="blue">
                  <v-icon style="margin-right: 6px">mdi-package-variant-closed-plus</v-icon>
                  {{ item.original_quantity }}
                </v-chip>
            </template>
            <template v-slot:item.quantity="{ item }">
                <v-chip variant="outlined" color="success" v-if="item.quantity < 0">
                  <v-icon style="margin-right: 6px">mdi-progress-check</v-icon>
                  Excédent de {{ Math.abs(item.quantity) }} 
                </v-chip>
                <v-chip variant="elevated" v-else> 
                  <v-icon color="warning" style="margin-right: 6px">mdi-progress-download</v-icon>
                  {{ item.quantity }} 
                </v-chip>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip variant="elevated" style="margin: 0.4em 0.2em; font-weight: 500">
                <v-icon :color="statusIconColor(item.status)" style="margin-right: 4px">
                  {{ statusIcon(item.status) }}
                </v-icon>
                <span>{{ statusText(item.status) }}</span>
              </v-chip>
            </template>
            <template v-slot:item.delivery_date="{ item }">
              <div class="delivery-time-cell">
                {{ new Date(item.delivery_date).toLocaleDateString() }}
              </div>
            </template>
            <template v-slot:item.shipped_quantity="{ item }">
              {{ item.shipped_quantity ? item.shipped_quantity : "Aucun envoi" }}
            </template>
            <template v-slot:item.actions="{ item }">
              <div class="actions-slot">
                  <SupplierOrderDetails
                    v-if="selectedCompany && item"
                    :order="item"
                    :selected-company-id="selectedCompany.id"
                  >
                  </SupplierOrderDetails>
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
                variant="outlined"
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
              <v-chip variant="outlined" color="success" style="margin: 0.2em">
                <v-icon class="mr-2">mdi-truck-fast-outline</v-icon>
                {{ item.quantity }}
              </v-chip>
            </template>
            <template v-slot:item.real_departure_time="{ item }">
             {{ new Date(item.real_departure_time).toLocaleDateString() }}
            </template>
            <template v-slot:item.delivery_date="{ item }">
             {{ new Date(item.delivery_date).toLocaleDateString() }}
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip
                variant="elevated"
                style="margin: 0.2em 0;"
                outlined
              >
                <v-icon
                  :color="item.status === 'delivered' ? 'success' : 'orange'"
                  style="margin-right: 4px;"
                  left
                >
                  {{ item.status === 'delivered' ? 'mdi-package-variant-closed-check' : 'mdi-truck-fast-outline' }}
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
                variant="outlined"
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
                    <v-chip variant="elevated" color="blue" outlined>
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
                      <v-chip variant="elevated" style="margin: 0.2em">
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
                variant="outlined"
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
                    <v-chip variant="elevated" color="blue" outlined>
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
                      <v-chip variant="outlined" color="success" style="margin: 0.2em">
                        <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                        {{ item.quantity }}
                      </v-chip>
                    </template>

                    <!-- Actions Column -->
                    <template v-slot:item.actions="{ item }">
                      <div class="actions-slot">
                        <TransferPosition
                          v-if="selectedCompany && item && dataFromSearch.client.name"
                          origin="logistic_place"
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
                variant="outlined"
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
