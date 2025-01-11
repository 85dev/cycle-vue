<script setup>
import { defineEmits, ref } from 'vue';

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
    }
})

const deliveryDate = ref(new Date().toISOString().split('T')[0]);

const emit = defineEmits(['refreshClientOrders'])

async function submitClientOrder() {
    await apiCaller.get(`companies/${props.selectedCompanyId}/client_orders/${props.order.client_order_id || props.order.order_id}/complete_client_order?delivery_date=${deliveryDate.value}`);
    emit('refreshClientOrders');
}
</script>

<template>
      <v-dialog class="tertiary-dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                variant="text"
            >
                <v-icon class='mr-2'>mdi-package-variant-closed-check</v-icon>
                <span>Archiver</span>
            </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        title="Livraison de la commande client"
                        icon="mdi-package-variant-closed-check"
                    />
                    <v-text-field 
                        label="Date de livraison"
                        class="pl-4 mt-2"
                        width="160px"
                        type="date"
                        v-model="deliveryDate"
                        variant="underlined"
                    />
                    <span class="informative-text-m pr-4 pl-4">
                        Si la commande client n°<strong>{{ props.order.client_order_number || props.order.order_number }}</strong> a été livrée,
                        vous pouvez la finaliser en cliquant sur le bouton ci-dessous.<br>
    
                    </span>

                    <span class="informative-text-m pr-4 pl-4">
                        Vous pourrez retrouver cette commande dans les commandes clients <strong>finalisées</strong>.
                    </span>
                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn variant="elevated" @click="submitClientOrder(); isActive.value = false" color="success">
                            Archiver
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