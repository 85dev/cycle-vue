<script setup>
import { onMounted, ref, defineEmits } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';

const props = defineProps({
    userId: {
        type: Number
    },
    clientOrders: {
        type: Array
    },
    clientId: {
        type: String
    },
    referenceAndDesignation: {
        type: String
    },
    partPrice: {
        type: Number
    }
})

const supplier = ref(null)
const number = ref(null)
const supplierList = ref(null)
const supplierListDisplayed = ref(null)
const parts = ref(null)
const orderPositions = ref([])

const emit = defineEmits(['refreshSupplierOrders'])

async function fetchParts() {
    const response = await apiCaller.get(`users/${props.userId}/clients/${props.clientId}/parts_by_client`);
    parts.value = response;
}

async function fetchSuppliers() {
    const response = await apiCaller.get(`users/${props.userId}/suppliers`)
    supplierList.value = response
    supplierListDisplayed.value = response.map(supplier => supplier.name)
}

async function submitSupplierOrder() {
    const payload = {
        supplier_order: {
            number: number.value,
            order_positions: orderPositions.value.map(position => ({
                part_id: parts.value.find(p => `${p.reference} ${p.designation}` === position.part)?.id,
                price: parseFloat(position.price),
                quantity: position.quantity,
                original_quantity: position.quantity,
                delivery_date: dateConverter.formatISODate(position.delivery_date),             
            }))
            }
        }

    // Catch selected Client Id to create the 
    const selectedSupplierId = supplierList.value.find(c => c.name === supplier.value)?.id;
    const clientOrderIds = orderPositions.value
        .map(position => props.clientOrders.find(order => order.number === position.client_order)?.id)
        .filter(id => id !== undefined);

    await apiCaller.post(`users/${props.userId}/suppliers/${selectedSupplierId}/create_supplier_order?${clientOrderIds > 0 ? `client_order_ids=${clientOrderIds.join(',')}` : ''}`, payload, true)

    emit('refreshSupplierOrders')
}

function addOrderPosition() {
    orderPositions.value.push({ part: props.referenceAndDesignation, price: props.partPrice, quantity: null, delivery_date: dateConverter.formatISODate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) });
}

function removeOrderPosition(index) {
    if (orderPositions.value.length > 1) {
        orderPositions.value.splice(index, 1);
    }
}

onMounted( async () => {
    await fetchParts()
    await fetchSuppliers()

    supplier.value = supplierList.value[0].name

    addOrderPosition()
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                variant="outlined"
                color="blue"
            >
                <v-icon class='mr-2'>mdi-plus-thick</v-icon>
                <span>Ajouter une commande fournisseur</span>
            </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Ajouter une commande fournisseur`" style="padding: 0.4em;">
                    <v-divider style="margin: 0em 1em; padding: 6px;"></v-divider>

                        <v-form class="form-container">

                            <v-row style="margin: 0em 0.2em;">
                                <v-select
                                    label="Fournisseur"
                                    variant="underlined"
                                    v-model="supplier"
                                    class="form-part"
                                    :items="supplierListDisplayed ? supplierListDisplayed : []"
                                    required
                                ></v-select>

                                <v-text-field
                                    clearable
                                    class="form-part"
                                    variant="underlined"   
                                    v-model="number"
                                    label="Numéro de commande"
                                    required
                                ></v-text-field>
                            </v-row>
                           

                        <!-- Order Positions -->
                        <v-card title="Liste des positions" style="margin: 0em 0.8em;">
                        <div v-for="(position, index) in orderPositions" :key="index">
                            <v-row style="margin: -1.6em 0.2em -1.4em 0.2em;">
                                <v-col cols="3">
                                    <v-select
                                        label="Pièce"
                                        v-model="position.part"
                                        variant="underlined"
                                        clearable
                                        required
                                        :items="parts.map(p => `${p.reference} ${p.designation}`)"
                                    ></v-select>
                                </v-col>
                                <v-col cols="2">
                                        <v-select
                                            clearable
                                            label="Commande Client"
                                            v-model="position.client_order"
                                            variant="underlined"
                                            :items="props.clientOrders.map(order => order.client_order_number)"
                                        ></v-select>
                                    </v-col>
                                <v-col cols="2">
                                    <v-text-field
                                        label="Prix"
                                        clearable
                                        v-model="position.price"
                                        type="number"
                                        variant="underlined"
                                        required
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="2">
                                    <v-text-field
                                        label="Quantité"
                                        clearable
                                        v-model="position.quantity"
                                        type="number"
                                        variant="underlined"
                                        required
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="2">
                                    <v-text-field
                                        label="Date de livraison souhaitée"
                                        v-model="position.delivery_date"
                                        type="date"
                                        variant="underlined"
                                        required
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="1" style="display: flex; width: 100%; justify-content: center;">
                                    <v-btn icon @click="removeOrderPosition(index)">
                                        <v-icon>mdi-delete</v-icon>
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </div>
                        </v-card>

                        <div class="aligner" style="margin-top: 1em;">
                                <v-btn text @click="addOrderPosition">
                                    <v-icon>mdi-text-box-plus-outline</v-icon>
                                    Ajouter une position
                                </v-btn>
                        </div>

                        </v-form>

                    <v-card-actions style="margin-bottom: 0.8em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn variant="elevated" @click="submitSupplierOrder(); isActive.value = false" color="success">
                            Créer la commande
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