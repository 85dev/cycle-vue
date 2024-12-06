<script setup>
import { ref, onMounted } from 'vue'

// Services
import apiCaller from '@/services/apiCaller'
import sessionStore from '../stores/sessionStore.js'
import { statusIcon, statusIconColor, statusText } from '@/services/textIconServices.js'
import { useRoute, useRouter } from 'vue-router';

// Components
import CreateClientOrder from '@/components/modals/CreateClientOrder.vue'
import CreateSupplierOrder from '@/components/modals/CreateSupplierOrder.vue'
import EditClientOrder from '@/components/modals/EditClientOrder.vue'
import ArchivateClientOrder from '@/components/modals/ArchivateClientOrder.vue'
import DeletingOrder from '@/components/modals/DeletingOrder.vue'
import SupplierOrderDetails from '@/components/modals/SupplierOrderDetails.vue'
import SortClientPositionsModal from '@/components/modals/SortClientPositions.vue';
import PositionHistory from '@/components/modals/PositionHistory.vue';
import TransferPosition from '@/components/modals/TransferPosition.vue';

// Table headers
import { clientOrdersHeaders, supplierOrdersHeaders, clientStockPositionsHeaders, expeditionsListHeaders, subcontractorHeaders, logisticplacesHeaders } from '@/models/tableHeaders.js'

const userId = ref(null)
const dataFromSearch = ref({})
const currentPartId = ref(null)
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const clientPositionModal = ref(false);

// Fetches data for each section separately
async function fetchSupplierOrders() {
  const response = await apiCaller.get(`users/${userId.value}/parts/${currentPartId.value}/supplier_orders_positions`);
  dataFromSearch.value.supplier_orders = response
}

async function fetchUnsortedClientPositions() {
  const response = await apiCaller.get(`users/${userId.value}/parts/${currentPartId.value}/unsorted_client_positions`)
  dataFromSearch.value.unsorted_client_positions = response

  if (response.length > 0) {
    clientPositionModal.value = true;
  }
}

async function fetchConsignmentStockPositions() {
  const response = await apiCaller.get(`users/${userId.value}/parts/${currentPartId.value}/clients/${dataFromSearch.value.client.id}/consignment_stocks_positions_by_client`)
  dataFromSearch.value.consignment_stock_positions = response
}

async function fetchStandardStockPositions() {
  const response = await apiCaller.get(`users/${userId.value}/parts/${currentPartId.value}/clients/${dataFromSearch.value.client.id}/standard_stocks_positions_by_client`)
  dataFromSearch.value.standard_stock_positions = response
}

async function fetchSuppliers() {
  const response = await apiCaller.get(`users/${userId.value}/suppliers`)
  dataFromSearch.value.suppliers = response
}

async function fetchClientOrders() {
  const response = await apiCaller.get(`users/${userId.value}/parts/${currentPartId.value}/client_orders`);
  dataFromSearch.value.client_orders = response
}

async function fetchExpeditions() {
  const response = await apiCaller.get(`users/${userId.value}/parts/${currentPartId.value}/supplier_order_indexes_by_part`);
  dataFromSearch.value.expeditions = response
}

async function fetchSubContractors() {
  const response = await apiCaller.get(`users/${userId.value}/parts/${currentPartId.value}/expedition_position_by_sub_contractor`);
  dataFromSearch.value.positions_by_sub_contractors = response
}

async function fetchLogisticPlaces() {
  const response = await apiCaller.get(`users/${userId.value}/parts/${currentPartId.value}/expedition_position_by_logistic_place`);
  dataFromSearch.value.positions_by_logistic_place = response
}

async function refreshAllData() {
  await fetchSuppliers();
  await fetchSupplierOrders();
  await fetchClientOrders();
  await fetchExpeditions();
  await fetchSubContractors();
  await fetchLogisticPlaces();
  await fetchUnsortedClientPositions();
  await fetchConsignmentStockPositions();
  await fetchStandardStockPositions();
}

onMounted(async () => {
  loading.value = true;

  currentPartId.value = route.params.id
  sessionStore.actions.initializeAuthState();
  userId.value = sessionStore.getters.getUserID();

  const response = await apiCaller.get(`users/${userId.value}/part-related-data/${currentPartId.value}`)
  dataFromSearch.value = response;

  await refreshAllData();
  loading.value = false;

});

</script>

<template>
  <v-card class="main-card" style="background-color: transparent; box-shadow: none;">
      <v-btn
        class="no-effects"
        @click="router.push({ name: `PartIndex` });"
        text
      >
        <v-icon style="margin-right: 0.4em;">mdi-arrow-u-left-top</v-icon>
        <span>Retour à la recherche</span>
      </v-btn>    
  </v-card>
  
  <v-card class="main-card" style="margin-bottom: 2em;">

    <div class="part-content-container">

        <SortClientPositionsModal
          v-if="clientPositionModal && dataFromSearch.client"
          :open-modal="clientPositionModal"
          :part-id="currentPartId"
          :user-id="userId"
          :client="dataFromSearch.client"
          :client-positions="dataFromSearch.unsorted_client_positions"
          @refreshClientPositions="refreshAllData"
        />

        <v-card class="b1-container" style="padding: 6px 12px; margin-top: 0.7em; margin-bottom: 0em">
          <v-card-title style="font-weight: 700; font-size: 1em;">
            <v-icon class="mr-1">mdi-cog-outline</v-icon>
            INFORMATIONS SUR LA PIECE
          </v-card-title>
          <span class="informative-text">Technique et générale : </span>
          <v-row class="pa-1 mb-0" style="margin-bottom: -2.4em;" align="center" justify="space-between">
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
          <div v-if="dataFromSearch.client_price && dataFromSearch.supplier_price" class="ml-1 mb-4">
              <span class="informative-text">Financier : </span>
              <v-chip class="aligner mt-1" style="width: fit-content;" variant="elevated">
                  <v-icon class="mr-2" color="blue">mdi-swap-horizontal</v-icon>
                  <span class="mr-1"><strong>Marge brute</strong> avant sous-traitance et transports : <strong>{{ (dataFromSearch.client_price - dataFromSearch.supplier_price).toFixed(2) }}</strong></span>
              </v-chip>
              <div v-if="dataFromSearch.client_price">
                <v-chip variant="elevated" class="text-body-2 mt-1">
                    <v-icon class="mr-2">mdi-cash</v-icon>
                    <span class="mr-1">Dernier prix unitaire client : <strong>{{ dataFromSearch.client_price }}</strong></span>
                </v-chip>
              </div>
              <div v-if="dataFromSearch.supplier_price">
                <v-chip variant="elevated" class="text-body-2 mt-1">
                    <v-icon class="mr-2">mdi-cash</v-icon>
                    <span class="mr-1">Dernier prix unitaire fournisseur : <strong>{{ dataFromSearch.supplier_price }}</strong></span>
                </v-chip>
              </div>
          </div>

          <v-card class="pa-1">
            <span class="informative-text ml-1">
              <v-chip
                class="mt-2"
                variant="elevated"
              >
                <v-icon start class="ml-0">mdi-account-multiple</v-icon>
                Liste des fournisseur(s)
              </v-chip>
            </span>

            <div class="d-flex flex-wrap align-items-center" v-if="dataFromSearch.suppliers && dataFromSearch.suppliers.length > 0">
              <v-chip
                class="ma-1 mt-2"
                v-for="supplier in dataFromSearch.suppliers"
                :key="supplier.id"
                style="width: fit-content;"
                variant="tonal"
                color='blue'
              >
                <v-icon class="mr-2">mdi-account-arrow-right-outline</v-icon>
                <span class="mr-2" >{{ supplier.name }}</span>
              </v-chip>
            </div>
            <div v-else class="d-flex flex-wrap align-items-center">
              <v-chip
                class="ma-1 mt-2"
                style="width: fit-content;"
                variant="tonal"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-backspace-reverse-outline</v-icon>
                <span class="mr-1" >Aucun fournisseur enregistré</span>
              </v-chip>
            </div>
          </v-card>

          <v-card class="pa-1 mt-1">
            <span class="informative-text ml-1">
              <v-chip
                class="mt-2"
                variant="elevated"
              >
                <v-icon start class="ml-0">mdi-account-multiple</v-icon>
                Liste des sous-traitant(s)
              </v-chip>
            </span>
          
            <div class="d-flex flex-wrap align-items-center" v-if="dataFromSearch.sub_contractors && dataFromSearch.sub_contractors.length > 0">
              <v-chip
                class="ma-1 mt-2"
                v-for="subcontractor in dataFromSearch.sub_contractors"
                :key="subcontractor.id"
                style="width: fit-content;"
                variant="tonal"
                color='blue'
              >
                <v-icon class="mr-2">mdi-screw-machine-flat-top</v-icon>
                <span class="mr-2" >{{ subcontractor.name }}</span>
              </v-chip>
            </div>
            <div class="d-flex flex-wrap align-items-center">
              <v-chip
                class="ma-1 mt-2"
                style="width: fit-content;"
                variant="tonal"
                color="secondary"
              >
                <v-icon class="mr-2">mdi-backspace-reverse-outline</v-icon>
                <span class="mr-1" >Aucun sous-traitant enregistré</span>
              </v-chip>
            </div>
          </v-card>
        </v-card>

      <div class="b1-hand-container">

        <v-card class="b1-container">
          
          <div v-if="dataFromSearch.consignment_stock_positions">
            <v-card-title style="font-weight: 700; font-size: 1em;">
                <v-icon class="mr-1">mdi-warehouse</v-icon>
                STOCK CONSIGNATION CLIENT
            </v-card-title>
            <!-- Consignment Stock Positions -->
            <div v-for="stock in dataFromSearch.consignment_stock_positions.filter(stock => stock.client_positions.length > 0)" :key="'consignment-' + stock.id" style="margin-bottom: 0.1em;">
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
                        <div v-if="stock.current_quantity" class="d-flex flex-column">
                          <v-chip style="z-index:1; width: fit-content;" class="d-flex align-center text-body-2 mb-1" variant="elevated" color="blue">
                            <v-icon class="mr-1 ml-1">mdi-package-variant-closed-check</v-icon>
                            <span style="margin-left: 2px;">Quantité mise à disposition : <strong>{{ stock.current_quantity }}</strong></span>
                          </v-chip>
                          <v-chip
                            style="width: fit-content;"
                            variant="outlined"
                            color="blue"
                            @click="consumeStock(stock)"
                            class="text-body-2"
                          >
                          <v-icon start class="ml-1">mdi-cart-arrow-up</v-icon>
                            Gérer la consommation
                          </v-chip>
                        </div>
                      </v-col>
                  </v-row>
                </v-card>              
                <v-card style="margin-top: 1em; margin-bottom: 0.1em;"> 
                <span class="informative-text">
                    <v-chip
                      class="mt-2 mb-1"
                      variant="outlined"
                      color="blue"
                    >
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
                  no-data-text="Aucune référence en stock consignation"
                >
                <template v-slot:item.quantity="{item}">
                  <v-chip variant="elevated" style="margin: 0.2em">
                    <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                    {{ item.quantity }}
                  </v-chip>
                </template>
                <template v-slot:item.actions="{item}">
                  <div class="actions-slot">
                    <PositionHistory
                      :user-id="userId"
                      :part-id="currentPartId"
                    />
                  </div>
                </template>
                </v-data-table>
              </v-card> 
              </v-card>
            </div>   
          </div>
        <div v-if="dataFromSearch.consignment_stock_positions">
          <div v-if="dataFromSearch.consignment_stock_positions.filter(stock => stock.client_positions.length > 0).length === 0" style="padding: 0.2em 0.4em; margin: 0.2em;">
            <span class="informative-text">Aucune référence en stock consignation client n'est enregistrée</span>
          </div>
        </div>

          <div class="mt-1" v-if="dataFromSearch.standard_stock_positions && dataFromSearch.standard_stock_positions.length > 0">
              <v-card-title style="font-weight: 700; font-size: 1em;">
                    <v-icon class="mr-1">mdi-package-variant-closed-check</v-icon>
                    STOCK STANDARD CLIENT
                  </v-card-title>
              <div v-for="stock in dataFromSearch.standard_stock_positions.filter(stock => stock.client_positions.length > 0)" :key="'standard-' + stock.id" style="margin-bottom: 0.1em;">
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

                      <v-col cols="12" md="6" class="d-flex flex-column">
                        <div v-if="stock.current_quantity" class="d-flex flex-column">
                          <v-chip style="z-index:1; width: fit-content;" class="d-flex align-center text-body-2 mb-1" variant="elevated" color="blue">
                            <v-icon class="mr-1 ml-1">mdi-package-variant-closed-check</v-icon>
                            <span style="margin-left: 2px;">Quantité livrée totale : <strong>{{ stock.current_quantity }}</strong></span>
                          </v-chip>
                          <v-chip
                            style="width: fit-content;"
                            variant="outlined"
                            color="blue"
                            @click="consumeStock(stock)"
                            class="text-body-2"
                          >
                          <v-icon start class="ml-1">mdi-database-refresh-outline</v-icon>
                            Mettre à jour les stocks
                          </v-chip>
                        </div>
                      </v-col>
                  </v-row>
                </v-card>
                <v-card style="margin-top: 1em; margin-bottom: 0.1em;">
                  <span class="informative-text">
                    <v-chip
                      class="mt-2 mb-1"
                      variant="outlined"
                      color="blue"
                    >
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
                    no-data-text="Aucune référence en stock standard"
                  >
                  <template v-slot:item.quantity="{item}">
                    <v-chip variant="elevated" style="margin: 0.2em;">
                      <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                      {{ item.quantity }}
                    </v-chip>
                  </template>
                  <template v-slot:item.actions="{item}">
                    <div class="actions-slot">
                      <PositionHistory
                        :user-id="userId"
                        :part-id="currentPartId"
                      />
                    </div>
                  </template>
                  </v-data-table>           
                </v-card>
                </v-card>
              </div>
            </div>
          <div v-if="dataFromSearch.standard_stock_positions">
            <div v-if="dataFromSearch.standard_stock_positions && dataFromSearch.standard_stock_positions.filter(stock => stock.client_positions.length > 0).length === 0" style="padding: 0.2em 0.4em; margin: 0.2em;">
              <span class="informative-text">Aucune référence en stock standard client n'est enregistrée</span>
            </div>
          </div>
        </v-card>

        <v-card class="b1-container">
          <div class="b1-top-content">
            <span id="b1-title"><strong>COMMANDE CLIENT</strong></span>
            <span>
              <!-- MODALS -->
               <CreateClientOrder
               v-if="dataFromSearch.reference && dataFromSearch.designation && dataFromSearch.client"
               :part-id="currentPartId"
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
              <v-chip variant="elevated" style="margin: 0.2em;">
                <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                {{ item.quantity }}
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
                    :user-id="userId"
                    :part-id="currentPartId"
                    :order="item"
                  ></EditClientOrder>
                  <ArchivateClientOrder
                    :user-id="userId"
                    :part-id="currentPartId"
                    :order="item"
                  ></ArchivateClientOrder>
                  <DeletingOrder
                    :user-id="userId"
                    :client-order-id="item.id"
                    :order-number="item.client_order_number"
                    order-type="client"
                    @order-refresh="refreshAllData()"
                  >
                  </DeletingOrder>
                </div>
            </template>
            </v-data-table>
            <div v-else class="informative-text" style="display: flex; align-items: center">
              <v-chip
                variant="tonal"
                color="blue"
              >
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                Pas de commande client enregistrée pour cette référence
              </v-chip>
            </div>
          </div>
        </v-card>

        <v-card class="b1-container">
          <div class="b1-top-content">
            <span id="b1-title"><strong>COMMANDE FOURNISSEUR</strong></span>
            <span>
              <!-- MODALS -->
              <CreateSupplierOrder
                v-if="dataFromSearch.client_orders"
               :client-orders="dataFromSearch.client_orders"
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
            <template v-slot:item.quantity="{ item }">
                <v-chip variant="elevated" v-if="item.quantity < 0">
                  <v-icon color="success" style="margin-right: 6px">mdi-progress-check</v-icon>
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
                  :order="item"
                  :user-id="userId"
                  >
                  </SupplierOrderDetails>
                  <DeletingOrder
                      :user-id="userId"
                      :supplier-order-id="item.id"
                      :order-number="item.number"
                      order-type="supplier"
                      @order-refresh="refreshAllData()"
                    >
                  </DeletingOrder>
              </div>
            </template>
            </v-data-table>
            <div v-else class="informative-text" style="display: flex; align-items: center">
              <v-chip
                variant="tonal"
                color="blue"
              >
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                Pas de commande fournisseur enregistrée pour cette référence
              </v-chip>
            </div>
          </div>
        </v-card>

        <v-card class="b1-container">
          <div class="b1-top-content">
            <span id="b1-title"><strong>PROGRAMME DES EXPEDITIONS</strong></span>
            <v-btn
              icon
              class="no-effects"
              @click="router.push('/expeditions')"
            >
              <v-icon>mdi-ferry</v-icon>
            </v-btn>
          </div>
          <div class="b1-middle-content">
            <v-data-table
              :loading="loading"
              v-if="(dataFromSearch.expeditions && dataFromSearch.expeditions.length > 0) || loading"
              :items="dataFromSearch.expeditions"
              :headers="expeditionsListHeaders"
              items-per-page="5"
              density="dense"
              no-data-text="Pas d'expédition en cours"
            >
            <template v-slot:item.real_departure_time="{ item }">
             {{ new Date(item.real_departure_time).toLocaleDateString() }}
            </template>
            <template v-slot:item.delivery_date="{ item }">
             {{ new Date(item.delivery_date).toLocaleDateString() }}
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip
                variant="elevated"
                :color="item.status === 'delivered' ? 'green' : 'blue'"
                style="margin: 0.2em 0;"
                outlined
              >
                <v-icon
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
                variant="tonal"
                color="blue"
              >
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                Pas d'expédition enregistrée pour cette référence
              </v-chip>
            </div>
          </div>
        </v-card>

        <v-card class="b1-container">
          <div class="b1-top-content">
              <span style="margin: 0.6em 1em"><strong>STOCK SOUS-TRAITANT</strong></span>
          </div>
          <div class="b1-middle-content">
            <v-data-table
              :loading="loading"
              v-if="(dataFromSearch.positions_by_sub_contractors && dataFromSearch.positions_by_sub_contractors.length > 0) || loading"
              :items="dataFromSearch.positions_by_sub_contractors"
              density="dense"
              :headers="subcontractorHeaders"
              no-data-text="Aucune référence chez les sous-traitants"
            >
            <template v-slot:item.subcontractor_name="{ item }">
              <v-chip variant="elevated" style="margin: 0.2em 0em" outlined>
                {{ item.subcontractor_name }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <div class="actions-slot">
                <TransferPosition
                  v-if="userId && item && dataFromSearch.client.name"
                  origin="subcontractor"
                  :client="dataFromSearch.client.name"
                  :user-id="userId" 
                  :position="item"
                  @refresh="refreshAllData()"
                >
                </TransferPosition>
              </div>
            </template>
            </v-data-table>
            <div v-else class="informative-text" style="display: flex; align-items: center">
              <v-chip
                variant="tonal"
                color="blue"
              >
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                Cette référence n'a pas de position enregistrée chez les sous-traitants
              </v-chip>
            </div>
          </div>
        </v-card>

        <v-card class="b1-container" style="margin-bottom: 0.6em;">
          <div class="b1-top-content">
            <span style="margin: 0.6em 1em"><strong>STOCK LIEU DE STOCKAGE</strong></span>
          </div>
          <div class="b1-middle-content">
            <v-data-table
              :loading="loading"
              v-if="(dataFromSearch.positions_by_sub_contractors && dataFromSearch.positions_by_sub_contractors.length > 0) || loading"
              :items="dataFromSearch.positions_by_logistic_place"
              density="dense"
              :headers="logisticplacesHeaders"
              no-data-text="Aucune référence dans les lieux de stockage"
            >
            <template v-slot:item.logistic_place_name="{ item }">
              <v-chip variant="elevated" style="margin: 0.2em 0em" outlined>
                {{ item.logistic_place_name }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <div class="actions-slot">
                <TransferPosition
                  v-if="userId && item && dataFromSearch.client.name"
                  origin="logistic_place"
                  :client="dataFromSearch.client.name"
                  :user-id="userId" 
                  :position="item"
                  @refresh="refreshAllData()"
                >
                </TransferPosition>
              </div>
            </template>
            </v-data-table>
            <div v-else class="informative-text" style="display: flex; align-items: center">
              <v-chip
                variant="tonal"
                color="blue"
              >
                <v-icon class="mr-2">mdi-note-remove-outline</v-icon>
                Cette référence n'a pas de position enregistrée sur vos lieux de stockage
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
