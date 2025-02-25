<script setup>
// Vue essentials
import { onMounted, reactive, ref, computed, defineEmits } from 'vue';

// Services
import apiCaller from '@/services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';
import CardTitle from '../CardTitle.vue';

// Constant data
import { expeditionHeaders } from '@/models/tableHeaders.js'

const props = defineProps({
    suppliers: {
        type: Array,
        required: true
    },
    selectedCompanyId: {
        type: Number,
        required: true
    },
    origin: {
        type: String
    }
})

const loading = ref(false)
const supplierOrders = ref([])
const selectedSupplierOrders = ref([])
const departureDate = ref(dateConverter.formatISODate(new Date()))
const estimatedArrivalTime = ref(dateConverter.formatISODate(new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)));
const selectedSupplier = ref(null)
const selectedTransporter = ref(null)
const number = ref(null)
const transporters = ref([])
const modifiedQuantities = ref({});
const modifiedPartials = ref({})
const filteredSupplierOrders = ref([])

const selectedOrdersSummary = computed(() => {
  return selectedSupplierOrders.value.map(orderId => {
    const order = supplierOrders.value.find(o => o.id === orderId);

    if (!order) {
      console.warn(`Order with ID ${orderId} not found in supplierOrders.`);
      return null;
    }

    return {
      part: `${order.part_reference} ${order.part_designation}`,
      supplier_name: order.supplier_name,
      partial: modifiedPartials.value[order.id] ?? false,
      quantity: modifiedQuantities.value[order.id] ?? order.quantity ?? 0,
    };
  }).filter(order => order !== null);
});

const emit = defineEmits(['refreshExpeditions'])

async function fetchSupplierOrders() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/company_uncompleted_supplier_orders_positions`)

    supplierOrders.value = response

    response.forEach(order => {
        if (!(order.id in modifiedQuantities.value)) {
            modifiedQuantities.value[order.id] = order.quantity || 0;
        }
    });
}

async function fetchTransporters() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/transporters_index`)

    transporters.value = response
}

function resetForm() {
    selectedSupplierOrders.value = [];
    selectedSupplier.value = null;
    selectedTransporter.value = null;
    number.value = null;
    modifiedQuantities.value = {};
    modifiedPartials.value = {};
    departureDate.value = dateConverter.formatISODate(new Date());
    estimatedArrivalTime.value = dateConverter.formatISODate(new Date(Date.now() + 42 * 24 * 60 * 60 * 1000));
}

function applyFilter() {
    if (!selectedSupplier.value) {
        filteredSupplierOrders.value = supplierOrders.value
        return
    }

    loading.value = true;
    setTimeout(() => {
        filteredSupplierOrders.value = supplierOrders.value.filter(order => order.supplier_name === selectedSupplier.value)
        loading.value = false;
    }, 600);
}

async function submitExpedition() {
    const expedition = {
        expedition: {
            real_departure_time: dateConverter.formatISODate(departureDate.value),
            estimated_arrival_time: dateConverter.formatISODate(estimatedArrivalTime.value),
            number: number.value
            }
        }

    const selectedTransporterId = transporters.value.find(tr => tr.name === selectedTransporter.value)?.id;
    const quantities = selectedSupplierOrders.value.map(orderId => modifiedQuantities.value[orderId]);
    const partials = selectedSupplierOrders.value.map(orderId => modifiedPartials.value[orderId] || false);

    await apiCaller.post(`companies/${props.selectedCompanyId}/create_expedition?supplier_order_position_ids=${selectedSupplierOrders.value}&supplier_order_position_quantities=${quantities}&supplier_order_position_partials=${partials}&transporter_id=${selectedTransporterId}`, expedition, true)

    emit('refreshExpeditions')
    resetForm();
    await fetchSupplierOrders();
}

onMounted( async () => {
    await fetchTransporters()   
    await fetchSupplierOrders()
    applyFilter() 
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
          <v-chip
                v-bind="activatorProps" 
                v-if="props.origin === 'single'"
                variant="elevated"
                elevation="4"
                color="blue"
            >
                <v-icon class='mr-2'>mdi-plus-thick</v-icon>
                <span>Ajouter une expédition</span>
        </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        title="Enregistrer une nouvelle expédition"
                        icon="mdi-ferry"
                    />
                    <v-divider style="margin: 0em 1em; padding: 6px;"></v-divider>

                        <v-form class="form-container">

                            <div v-if="supplierOrders.length > 0">
                            <v-row style="margin: 0.4em 0.6em;">
                                <v-text-field
                                    variant="underlined"
                                    class="form-part"
                                    v-model="number"
                                    label="Numéro d'expédition"
                                    required
                                />
                                <v-select
                                    variant="underlined"
                                    class="form-part"
                                    label="Transporteur"
                                    :items="transporters.map(tr => tr.name)"
                                    v-model="selectedTransporter"
                                />
                                <v-text-field
                                    variant="underlined"
                                    class="form-part"
                                    v-model="departureDate"
                                    label="Date de départ"
                                    type="date"
                                    required
                                />
                                <v-text-field
                                    variant="underlined"
                                    class="form-part"
                                    v-model="estimatedArrivalTime"
                                    label="Date d'arrivée estimée"
                                    type="date"
                                    required
                                />
                            </v-row>
                            </div>

                            <span v-if="supplierOrders.length > 0" class="informative-text mb-5 mt-0" style="display: flex; align-items: center;">
                                <v-icon color="warning" style="margin-right: 6px;">mdi-alert-circle-outline</v-icon>
                                La date d'arrivée sera à enregistrer lors de la réception de l'expédition
                            </span>

                            <v-card class="dialog-table">
                                <CardTitle 
                                    title="Choix des commandes à ajouter"
                                    icon=mdi-package-variant-closed-plus
                                />
                                <v-select
                                    style="margin-top: -0.4em; margin-bottom: 0.8em; width: fit-content; min-width: 240px"
                                    label="Filtrer les commandes par fournisseur"
                                    clearable
                                    variant="underlined"
                                    class="form-part"
                                    :items="props.suppliers.map(supplier => supplier.name)"
                                    v-model="selectedSupplier"
                                    @update:model-value="applyFilter()"
                                >
                                    <template v-slot:selection="{ item }">
                                        <v-chip class="pa-3 ma-1" variant="elevated" color="blue">
                                            <v-icon class="mr-1">mdi-account-group</v-icon>
                                            {{ item.title }}
                                        </v-chip>
                                    </template>
                                </v-select>
                                <v-data-table
                                    :loading="loading"
                                    loading-text="Chargement des commandes..."
                                    v-if="supplierOrders.length > 0"
                                    variant="underlined"
                                    density="compact"
                                    :headers="expeditionHeaders"
                                    class="form-part"
                                    label="Liste des commandes fournisseurs"
                                    v-model="selectedSupplierOrders"
                                    :items="filteredSupplierOrders"
                                    no-data-text="Pas de commandes fournisseur enregistrés"
                                    show-select
                                >
                                <template v-slot:item.supplier_order_number="{ item }">
                                    <v-chip variant="elevated" color="white">
                                        <v-icon class="mr-2">mdi-file-document-outline</v-icon>
                                        {{ item.supplier_order_number }}
                                    </v-chip>
                                </template>
                                <template v-slot:item.partial="{ item }">
                                    <v-checkbox
                                        variant="underlined"
                                        v-model="modifiedPartials[item.id]"
                                        color="success"
                                        type="number"
                                        aria-required="true"
                                        density="compact"
                                    />
                                </template>
                                <template v-slot:item.quantity="{ item }">
                                    <v-chip
                                        variant="text"
                                    > 
                                    <v-icon color="success" class="mr-2">mdi-cube-send</v-icon>
                                    {{ item.quantity }}
                                    </v-chip>
                                </template>
                                <template v-slot:item.real_quantity="{ item }">
                                    <v-text-field
                                        variant="underlined"
                                        label="Quantité réelle"
                                        v-model="modifiedQuantities[item.id]"
                                        type="number"
                                        density="compact"
                                    />
                                </template>
                                </v-data-table>
                                <div v-else style="margin-bottom: 0.4em;">
                                    <span class="informative-text" style="display: flex; align-items: center;">
                                        <v-icon color="warning" style="margin-right: 6px;">mdi-alert-circle-outline</v-icon>
                                        Aucune commande(s) fournisseur n'est enregistrée <br>
                                    </span>
                                    <span class="informative-text" style="display: flex; align-items: center;">
                                        <v-icon color="success" style="margin-right: 6px;">mdi-help-circle-outline</v-icon>
                                        Les commandes fournisseur s'ajoutent sur la page de la référence de la pièce
                                    </span>
                                </div>
                            </v-card>

                            <span v-if="selectedOrdersSummary && selectedOrdersSummary.length > 0" class="informative-text mt-5" style="display: flex; align-items: center;">
                                <v-icon color="warning" style="margin-right: 6px;">mdi-alert-circle-outline</v-icon>
                                Les commandes cochées <strong class="mr-1 ml-1"> partielles </strong> ne seront pas considérées comme complètes
                            </span>

                            <v-card class="mr-9 ml-9 mt-4" v-if="selectedOrdersSummary && selectedOrdersSummary.length > 0">
                                <CardTitle
                                    title="Récapitulatif des commandes sélectionnées"
                                    icon="mdi-format-list-checkbox"
                                />
                                <v-data-table
                                    :items="selectedOrdersSummary"
                                    :headers="[
                                    { title: 'Pièce', value: 'part' },
                                    { title: 'Fournisseur', value: 'supplier_name' },
                                    { title: 'Partiel', value: 'partial' },
                                    { title: 'Quantité', value: 'quantity' }
                                    ]"
                                    density="dense"
                                    hide-default-footer
                                    class="summary-table"
                                >
                                    <template v-slot:item.part="{ item }">
                                        <v-chip
                                            variant="elevated"
                                            color="white"
                                            class="mt-2 mb-2"
                                        >
                                            {{ item.part }}
                                        </v-chip>
                                    </template>
                                    <template v-slot:item.partial="{ item }">
                                        <v-chip
                                            :color="item.partial ? 'success' : 'secondary'"
                                            variant="elevated"
                                        >
                                            <v-icon>
                                            {{ item.partial ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline' }}
                                            </v-icon>
                                        </v-chip>
                                    </template>
                                    <template v-slot:item.quantity="{ item }">
                                        <v-chip variant="text">
                                            <v-icon class="mr-1">mdi-package-variant-closed-check</v-icon>
                                            {{ item.quantity }}
                                        </v-chip>
                                    </template>
                                </v-data-table>
                            </v-card>
                        </v-form>

                    <v-card-actions style="margin-bottom: 0.2em; margin-top: 1.2em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn :disabled="!selectedSupplierOrders.length > 0" variant="elevated" @click="submitExpedition(); isActive.value = false" color="success">
                            Créer l'expédition
                        </v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

:deep(.v-input__details ){
    display: none;
}
</style>