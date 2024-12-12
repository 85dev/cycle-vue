<script setup>
import { onMounted, ref, defineEmits } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';
import { expeditionHeaders } from '@/models/tableHeaders.js'
import { transporters } from '@/models/preselectionData.js';
import sessionStore from '@/stores/sessionStore.js';

const props = defineProps({
    suppliers: {
        type: Array,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    origin: {
        type: String
    }
})

const supplierOrders = ref([])
const selectedSupplierOrders = ref([])
const departureDate = ref(dateConverter.formatISODate(new Date()))
const arrivalDate = ref(dateConverter.formatISODate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)))
const selectedSupplier = ref(null)
const selectedTransporter = ref(null)
const number = ref(null)
const modifiedQuantities = ref([])
const modifiedPartials = ref({})
const price = ref(1500)
const userId = ref(0)

const emit = defineEmits(['refreshExpeditions'])

async function fetchSupplierOrders() {
    const response = await apiCaller.get(`users/${userId.value}/user_uncompleted_supplier_orders_positions`)

    supplierOrders.value = response
}

async function submitExpedition() {
    const expedition = {
        expedition: {
            real_departure_time: dateConverter.formatISODate(departureDate.value),
            arrival_time: dateConverter.formatISODate(arrivalDate.value),
            transporter: selectedTransporter.value,
            number: number.value,
            price: price.value
            }
        }

    const selectedSupplierId = props.suppliers.find(c => c.name === selectedSupplier.value)?.id;
    const quantities = selectedSupplierOrders.value.map(orderId => modifiedQuantities.value[orderId]);
    const partials = selectedSupplierOrders.value.map(orderId => modifiedPartials.value[orderId] || false);

    await apiCaller.post(`users/${props.userId}/create_expedition?supplier_order_position_ids=${selectedSupplierOrders.value}&supplier_order_position_quantities=${quantities}&supplier_order_position_partials=${partials}&supplier_id=${selectedSupplierId}`, expedition, true)

    emit('refreshExpeditions')
}

onMounted( async () => {
    sessionStore.actions.initializeAuthState()
    userId.value = sessionStore.getters.getUserID();

    await fetchSupplierOrders()
    selectedSupplier.value = props.suppliers[0].name
    selectedTransporter.value = transporters[0]
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
          <v-chip
                v-bind="activatorProps" 
                v-if="props.origin === 'single'"
                style="margin-top: 1em;"
                variant="elevated"
                color="blue"
            >
                <v-icon class='mr-2'>mdi-plus-thick</v-icon>
                <span>Ajouter une expédition</span>
        </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Ajouter une expédition`" prepend-icon="mdi-ferry" style="padding: 0.4em;">
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
                                ></v-text-field>

                                <v-text-field
                                    v-model="price"
                                    type="number"
                                    variant="underlined"
                                    class="form-part"
                                    label="Prix estimé de l'expédition"
                                ></v-text-field>

                                <v-select
                                    label="Fournisseur à l'origine de l'expédition"
                                    variant="underlined"
                                    class="form-part"
                                    :items="props.suppliers.map(supplier => supplier.name)"
                                    v-model="selectedSupplier"
                                >
                                </v-select>
                            </v-row>

                            <v-row style="margin: 0.8em 0.6em 0em 0.6em;">
                                <v-select
                                    variant="underlined"
                                    class="form-part"
                                    label="Transporteur"
                                    :items="transporters"
                                    v-model="selectedTransporter"
                                />

                                <v-text-field
                                    variant="underlined"
                                    class="form-part"
                                    v-model="departureDate"
                                    label="Date de départ estimé"
                                    type="date"
                                    required
                                />

                                <v-text-field
                                    variant="underlined"
                                    class="form-part"
                                    v-model="arrivalDate"
                                    label="Date d'arrivée estimée"
                                    type="date"
                                    required
                                />
                            </v-row>
                            </div>

                            <span class="informative-text mb-5 mt-0" style="display: flex; align-items: center; color: red">
                                <v-icon style="margin-right: 6px;">mdi-alert-circle-outline</v-icon>
                                La répartition de l'expédition signifie que l'expédition est arrivée à destination
                            </span>

                            <v-card class="dialog-table" title="Choix des commandes ouvertes à ajouter" append-icon="mdi-multicast">
                                <v-data-table
                                    v-if="supplierOrders.length > 0"
                                    variant="underlined"
                                    density="dense"
                                    items-per-page="3"
                                    :headers="expeditionHeaders"
                                    class="form-part"
                                    label="Liste des commandes fournisseurs"
                                    v-model="selectedSupplierOrders"
                                    :items="supplierOrders"
                                    no-data-text="Pas de commandes fournisseur enregistrés"
                                    show-select
                                >
                                <template v-slot:item.partial="{ item }">
                                    <v-switch
                                    style="display: flex; align-items: center;"
                                    variant="underlined"
                                    v-model="modifiedPartials[item.id]"
                                    color="success"
                                    type="number"
                                    aria-required="true"
                                    ></v-switch>
                                </template>
                                <template v-slot:item.quantity="{ item }">
                                    <div style="display: flex; align-items: baseline;">
                                        <v-text-field
                                        style="padding: 1em 0em 0em 0em;"
                                        variant="underlined"
                                        v-model="item.quantity"
                                        label="Reste à livrer"
                                        :disabled="true"
                                        ></v-text-field>
                                    </div>
                                </template>
                                <template v-slot:item.real_quantity="{ item }">
                                    <v-text-field
                                        style="padding: 1em 0em 0em 0em;"
                                        variant="underlined"
                                        label="Quantité expédiée"
                                        v-model="modifiedQuantities[item.id]"
                                        type="number"
                                        dense
                                    ></v-text-field>
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

</style>