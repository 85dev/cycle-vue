<script setup>
import { defineEmits, onMounted, ref } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import CardTitle from '../CardTitle.vue';

const props = defineProps({
    selectedCompanyId: {
        type: Number,
        required: true
    },
    order: {
        type: Object,
        required: true
    },
    origin: {
        type: String,
        required: true,
        validator: (value) => ['client', 'supplier'].includes(value)
    },
    realDeliveryDate: {
        type: Date
    }
})

const deliveryDate = ref(new Date().toISOString().split('T')[0]);

const emit = defineEmits(['refreshClientOrders'])

async function submitOrderArchiving() {
    if (props.origin === 'client') {
        await apiCaller.patch(`companies/${props.selectedCompanyId}/client_order_positions/${props.order.id}/complete_client_order?delivery_date=${deliveryDate.value}`);
        emit('refreshClientOrders');
    } else if (props.origin === 'supplier') {
        await apiCaller.patch(`companies/${props.selectedCompanyId}/supplier_order_positions/${props.order.id}/complete_supplier_order?delivery_date=${deliveryDate.value}`);
        emit('refreshClientOrders');
    }
}

onMounted(() => {
    if (props.realDeliveryDate) {
        deliveryDate.value = props.realDeliveryDate
    }
})
</script>

<template>
      <v-dialog class="tertiary-dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                variant="text"
                color="blue"
            >
                <v-icon class='mr-1'>mdi-cube-send</v-icon>
                <span v-if="props.origin ==='supplier'">Finaliser l'expédition</span>
                <span v-if="props.origin ==='client'">Finaliser la commande</span>
            </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        :title="props.origin === 'client' ? 'Livraison de la commande client' : 'Livraison de la commande fournisseur'"
                        icon="mdi-package-variant-closed-check"
                    />
                    <div class="d-flex flex-column">
                        <v-text-field 
                            :disabled="props.realDeliveryDate"
                            label="Date de livraison"
                            class="pl-4 mt-2 pr-4"
                            style="margin-bottom: -1em;"
                            type="date"
                            v-model="deliveryDate"
                            variant="outlined"
                        />
                        <span class="informative-text" v-if="props.realDeliveryDate">
                            <v-icon class="mr-2" color="warning">mdi-alert-circle-outline</v-icon>
                            La date réelle de livraison de l'expédition a déjà été renseignée
                        </span>
                    </div>
                    <div class="informative-text-m ma-4">
                        Si la commande <strong>{{ props.origin === 'client' ? props.order.client_order_number : props.order.supplier_order_number }}</strong> a été livrée,
                        vous pouvez la finaliser en cliquant sur le bouton ci-dessous.<br><br>
                        Vous pourrez retrouver cette commande dans les commandes {{ props.origin === 'client' ? 'clients' : 'fournisseurs' }} finalisées.
                    </div>
                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn variant="elevated" @click="submitOrderArchiving(); isActive.value = false" color="success">
                            Finaliser
                        </v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

.text-modal {
    margin: 0.6em 1em;
}
</style>