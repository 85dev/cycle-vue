<script setup>
import { onMounted, ref, defineEmits, watch } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';
import CardTitle from '../CardTitle.vue';

const props = defineProps({
    selectedCompanyId: {
        type: Number,
        required: true
    },
    latestSupplierPrice: {
        type: Number,
        default: 0
    },
    clientId: {
        type: String
    },
    referenceAndDesignation: {
        type: String
    },
    partPrice: {
        type: Number
    },
    supplierFromParent: {
        type: Array
    }
})

const supplier = ref(null)
const number = ref(null)
const supplierList = ref(null)
const supplierListDisplayed = ref(null)
const parts = ref([])
const orderPositions = ref([])
const orderDate = ref(dateConverter.formatISODate(new Date(Date.now())));

const emit = defineEmits(['refreshSupplierOrders'])

async function fetchParts() {
    if (!supplier.value) {
        const response = await apiCaller.get(`companies/${props.selectedCompanyId}/parts`);
        parts.value = response;
    } else {
        const selectedSupplier = supplierList.value.find(s => s.name === supplier.value);
        
        if (!selectedSupplier) {
            console.error('Supplier not found or not selected.');
            parts.value = [];
            return;
        }

        const response = await apiCaller.get(`companies/${props.selectedCompanyId}/suppliers/${selectedSupplier.id}/parts_by_supplier`);
        parts.value = response;
    }
}

async function fetchSuppliers() {
    if (!supplierList.value) {
        const response = await apiCaller.get(`companies/${props.selectedCompanyId}/suppliers`)
        supplierList.value = response
        supplierListDisplayed.value = response.map(supplier => supplier.name)
    }
}

async function submitSupplierOrder() {
    const payload = {
        supplier_order: {
            number: number.value,
            emission_date: orderDate.value,
            order_positions: orderPositions.value.map(position => ({
                part_id: parts.value.find(p => `${p.reference} ${p.designation}` === position.part)?.id,
                price: parseFloat(position.price),
                quantity: position.quantity,
                original_quantity: position.quantity,
                delivery_date: dateConverter.formatISODate(position.delivery_date),             
            }))
            }
        }

    const selectedSupplierId = supplierList.value.find(c => c.name === supplier.value)?.id;

    await apiCaller.post(`companies/${props.selectedCompanyId}/suppliers/${selectedSupplierId}/create_supplier_order`, payload, true)

    emit('refreshSupplierOrders')
}

function addOrderPosition() {
    orderPositions.value.push({ part: props.referenceAndDesignation || null, price: props.latestSupplierPrice || 0, quantity: null, delivery_date: dateConverter.formatISODate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) });
}

function removeOrderPosition(index) {
    if (orderPositions.value.length > 1) {
        orderPositions.value.splice(index, 1);
    }
}

watch(supplier, async () => {
    await fetchParts();
})

onMounted(async () => {
    if (props.supplierFromParent && props.supplierFromParent.length > 0) {
        supplierList.value = props.supplierFromParent
        supplierListDisplayed.value = props.supplierFromParent.map(s => s.name)
    } else {
        await fetchSuppliers()
    }

    if (props.referenceAndDesignation) {
        supplier.value = supplierList.value[0].name
    }

    await fetchParts()
    addOrderPosition()
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                :elevation="props.clientId ? 0 : 4"
                :variant="props.clientId ? 'outlined' : 'elevated'"
                color="blue"
            >
                <v-icon class='mr-2'>mdi-plus-thick</v-icon>
                <span>Ajouter une commande fournisseur</span>
            </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <div class="d-flex align-center justify-lg-space-between mr-4">
                        <CardTitle
                            title="Ajouter une commande fournisseur" 
                            icon="mdi-factory"
                        />
                    </div>
                    
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
                                />

                                <v-text-field
                                    clearable
                                    class="form-part"
                                    variant="underlined"   
                                    v-model="number"
                                    label="Numéro de commande"
                                    required
                                />

                                <v-text-field
                                    clearable
                                    type="date"
                                    class="form-part"
                                    variant="underlined"   
                                    v-model="orderDate"
                                    label="Date d'émission"
                                    required
                                />
                            </v-row>
                           

                        <!-- Order Positions -->
                        <v-card title="Liste des positions" style="margin: 0em 0.8em;">
                        <div v-for="(position, index) in orderPositions" :key="index">
                            <v-row style="margin: -1.6em 0.2em -1.4em 0.2em;">
                                <v-col cols="3">
                                    <v-select
                                        label="Pièce"
                                        v-model="position.part"
                                        :disabled="referenceAndDesignation"
                                        variant="underlined"
                                        clearable
                                        required
                                        :items="parts.map(p => `${p.reference} ${p.designation}`)"
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
                                <v-col cols="4">
                                    <v-text-field
                                        label="Date de livraison souhaitée"
                                        v-model="position.delivery_date"
                                        type="date"
                                        variant="underlined"
                                        required
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="1" style="display: flex; width: 100%; justify-content: center;">
                                    <v-btn class="no-effects" icon @click="removeOrderPosition(index)">
                                        <v-icon>mdi-delete-outline</v-icon>
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

                    <v-card-actions>

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