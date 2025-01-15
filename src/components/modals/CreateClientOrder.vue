<script setup>
import { onMounted, ref, watch, defineEmits } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';
import CardTitle from '../CardTitle.vue';

const props = defineProps({
    client: {
        type: Object    
    },
    partName: {
        type: String
    },
    selectedCompanyId: {
        type: Number,
        required: true
    }
})

const number = ref(null)
const clientContact = ref(null)
const parts = ref([])
const today = new Date();
const deliveryDate = new Date(today);
const selectedClient = ref(null)
const clients = ref([])
const contacts = ref([])

const orderPositions = ref([
    { part: null, price: null, quantity: null, delivery_date: null }
])

const emit = defineEmits(['refreshClientOrders'])

async function fetchPartsByClient() {
    if (props.client) {
        const response = await apiCaller.get(`companies/${props.selectedCompanyId}/parts`);
        parts.value = response;
    } else {
        const client = clients.value.find(c => c.name === selectedClient.value);

        if (client) {
            const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${client.id}/parts_by_client`);
            parts.value = response;
        }
    }
}

async function fetchContactsByClient() {
    if (props.client) {
        const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${props.client.id}/contacts_by_client`);
        contacts.value = response;
    } else {
        const client = clients.value.find(c => c.name === selectedClient.value);

        if (client) {
            const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${client.id}/contacts_by_client`);
            contacts.value = response;
        }
    }
}

async function fetchClients() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients`);
    clients.value = response;
}

async function submitClientOrder() {
    const clientId = props.client?.id || clients.value.find(c => c.name === selectedClient.value)?.id;

    if (!clientId) {
        console.error('Client ID could not be determined.');
        return; // Exit if no client is selected or provided
    }

    const selectedContact = contacts.value.find(
        contact => `${contact.first_name} ${contact.last_name}` === clientContact.value
    );

    if (props.partName) {  
        const part = parts.value.find(p => `${p.reference} ${p.designation}` === props.partName);

        const clientOrder = {
            client_order: {
                number: number.value,
                client_contact_id: selectedContact.id,
                order_positions: orderPositions.value.map(position => ({
                    part_id: part.id,
                    price: parseFloat(position.price),
                    quantity: position.quantity,
                    delivery_date: dateConverter.formatISODate(position.delivery_date),          
                }))
            }
        }

        await apiCaller.post(`companies/${props.selectedCompanyId}/clients/${clientId}/create_client_order`, clientOrder, true)
    } else {
        const clientOrder = {
            client_order: {
                number: number.value,
                client_contact: selectedContact.id,
                order_positions: orderPositions.value.map(position => ({
                    part_id: parts.value.find(p => `${p.reference} ${p.designation}` === position.part)?.id,
                    price: parseFloat(position.price),
                    quantity: position.quantity,
                    delivery_date: dateConverter.formatISODate(position.delivery_date),          
                }))
            }
        }

        await apiCaller.post(`companies/${props.selectedCompanyId}/clients/${clientId}/create_client_order`, clientOrder, true)
    }

    emit('refreshClientOrders')
}

function addOrderPosition() {
    orderPositions.value.push({ part: props.partName ? props.partName : null, price: null, quantity: null, delivery_date: dateConverter.formatISODate(deliveryDate) });
}

function removeOrderPosition(index) {
    if (orderPositions.value.length > 1) {
        orderPositions.value.splice(index, 1);
    }
}

watch(selectedClient, async () => {
    orderPositions.value = []
    clientContact.value = null;
    addOrderPosition()

    await fetchPartsByClient()
    await fetchContactsByClient()
});

onMounted( async () => {
    await fetchContactsByClient()
    await fetchClients()
    await fetchPartsByClient()

    deliveryDate.setDate(today.getDate() + 60);
    orderPositions.value[0].part = props.partName ? props.partName : null
    orderPositions.value[0].delivery_date = dateConverter.formatISODate(deliveryDate)
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                :elevation="props.client ? 0 : 4"
                :variant="props.client ? 'outlined' : 'elevated'"
                color="blue"
            >
                <v-icon class='mr-2'>mdi-plus-thick</v-icon>
                <span>Ajouter une commande client</span>
            </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle
                        title="Ajouter une commande client" 
                        icon="mdi-cube-send"
                    />
                    <v-divider style="margin: 0em 1em;"></v-divider>

                        <v-form class="form-container">
                            <v-row style="margin: 0em 0.2em -0.8em 0.2em;">

                                <v-text-field
                                    v-if="props.client"
                                    variant="underlined"
                                    class="form-part"
                                    label="Client"
                                    v-model="props.client.name"
                                    required
                                />

                                <v-select
                                    v-else
                                    clearable
                                    :items="clients.map(c => c.name)"
                                    variant="underlined"
                                    class="form-part"
                                    label="Client"
                                    v-model="selectedClient"
                                    required
                                />

                                <v-text-field
                                    clearable
                                    variant="underlined"
                                    class="form-part"
                                    v-model="number"
                                    label="Numéro de commande"
                                    required
                                />
                                <v-select
                                    :disabled="selectedClient === null && !props.client"
                                    clearable
                                    variant="underlined"   
                                    class="form-part"
                                    v-model="clientContact"
                                    :items="contacts.map(c => `${c.first_name} ${c.last_name}`)"
                                    label="Nom du responsable de la commande"
                                    required
                                />
                            </v-row>
                        </v-form>

                        <v-chip class="ml-4" v-if="!selectedClient" variant="elevated">
                            <v-icon color="orange" class="mr-1">mdi-alert-circle-outline</v-icon>
                            Renseignez d'abord un client afin d'afficher les pièces qui lui sont liées
                        </v-chip>

                         <!-- Order Positions -->
                         <v-card title="Liste des positions" style="margin: 0em 0.8em;" class="mt-2">
                        <div v-for="(position, index) in orderPositions" :key="index">
                            <v-row style="margin: -1.6em 0.2em -1.4em 0.2em;">
                                <v-col cols="4">
                                    <v-select
                                        v-if="!props.client"
                                        label="Pièce"
                                        v-model="position.part"
                                        variant="underlined"
                                        required
                                        :items="parts.map(p => `${p.reference} ${p.designation}`)"
                                    />
                                    <v-text-field 
                                        v-else
                                        label="Pièce"
                                        disabled
                                        v-model="position.part"
                                        variant="underlined"
                                        required
                                    />
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


                    <v-card-actions>

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