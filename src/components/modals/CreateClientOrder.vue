<script setup>
import { onMounted, ref, defineEmits } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';
import sessionStore from '@/stores/sessionStore.js';

const props = defineProps({
    partId: {
        type: Number
    },
    client: {
        type: Object
    },
    partName: {
        type: String
    }
})

const number = ref(null)
const clientContact = ref(null)
const parts = ref(null)
const userId = ref(0)
const today = new Date();
const deliveryDate = new Date(today);

const orderPositions = ref([
    { part: null, price: null, quantity: null, delivery_date: null }
])

const emit = defineEmits(['refreshClientOrders'])

async function fetchParts() {
    const response = await apiCaller.get(`users/${userId.value}/parts`);
    parts.value = response;
}

async function submitClientOrder() {

    const clientOrder = {
        client_order: {
            number: number.value,
            client_contact: clientContact.value,
            order_positions: orderPositions.value.map(position => ({
                part_id: parts.value.find(p => `${p.reference} ${p.designation}` === position.part)?.id,
                price: parseFloat(position.price),
                quantity: position.quantity,
                delivery_date: dateConverter.formatISODate(position.delivery_date),          
            }))
            }
        }

    await apiCaller.post(`users/${userId.value}/clients/${props.client.id}/create_client_order`, clientOrder, true)

    emit('refreshClientOrders')
}

function addOrderPosition() {
    orderPositions.value.push({ part: props.partName, price: null, quantity: null, delivery_date: dateConverter.formatISODate(deliveryDate) });
}

function removeOrderPosition(index) {
    if (orderPositions.value.length > 1) {
        orderPositions.value.splice(index, 1);
    }
}

onMounted( async () => {
    sessionStore.actions.initializeAuthState();
    userId.value = sessionStore.getters.getUserID();

    await fetchParts()

    deliveryDate.setDate(today.getDate() + 60);
    orderPositions.value[0].part = props.partName
    orderPositions.value[0].delivery_date = dateConverter.formatISODate(deliveryDate)
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
                <span>Ajouter une commande client</span>
            </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Ajouter une commande client`" style="padding: 0.4em;">
                    <v-divider style="margin: 0em 1em;"></v-divider>

                        <v-form class="form-container">
                            <v-row style="margin: 0em 0.2em;">
                                <v-text-field
                                variant="underlined"
                                class="form-part"
                                label="Client"
                                v-model="props.client.name"
                                required
                                ></v-text-field>

                                <v-text-field
                                    clearable
                                    variant="underlined"
                                    class="form-part"
                                    v-model="number"
                                    label="Numéro de commande"
                                    required
                                ></v-text-field>

                                <v-text-field
                                    clearable
                                    variant="underlined"   
                                    class="form-part"
                                    v-model="clientContact"
                                    label="Nom du responsable de la commande"
                                    required
                                ></v-text-field>
                            </v-row>
                           
                        </v-form>

                         <!-- Order Positions -->
                         <v-card title="Liste des positions" style="margin: 0em 0.8em;">
                        <div v-for="(position, index) in orderPositions" :key="index">
                            <v-row style="margin: -1.6em 0.2em -1.4em 0.2em;">
                                <v-col cols="4">
                                    <v-select
                                        label="Pièce"
                                        v-model="position.part"
                                        variant="underlined"
                                        required
                                        :items="parts.map(p => `${p.reference} ${p.designation}`)"
                                    ></v-select>
                                </v-col>
                                <v-col cols="2">
                                    <v-text-field
                                        label="Prix"
                                        v-model="position.price"
                                        type="number"
                                        variant="underlined"
                                        required
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="2">
                                    <v-text-field
                                        label="Quantité"
                                        v-model="position.quantity"
                                        type="number"
                                        variant="underlined"
                                        required
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="3">
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


                    <v-card-actions style="margin-bottom: 0.8em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn variant="elevated" @click="submitClientOrder(); isActive.value = false" color="success">
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