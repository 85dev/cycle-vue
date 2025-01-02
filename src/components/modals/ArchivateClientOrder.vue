<script setup>
import { defineEmits } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';

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

const emit = defineEmits(['refreshClientOrders'])

async function submitClientOrder() {
    await apiCaller.get(`companies/${props.selectedCompanyId}/client_orders/${props.order.client_order_id || props.order.order_id}/complete_client_order`);
    emit('refreshClientOrders');
}
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                variant="text"
                color="success"
            >
                <v-icon class='mr-2'>mdi-package-variant-closed-check</v-icon>
                <span>Archiver</span>
            </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`La commande client a été livrée ?`" style="padding: 0.4em;">

                    <div class="text-modal">
                        Si la commande client n°<strong>{{ props.order.client_order_number || props.order.order_number }}</strong> a été livrée,
                        vous pouvez la finaliser en cliquant sur le bouton ci-dessous.
    
                    </div>

                    <div class="text-modal" style="margin-top: 1em;">
                        Vous pourrez retrouver cette commande dans les commandes clients <strong>finalisées</strong>.
                    </div>
                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn variant="elevated" @click="submitClientOrder(); isActive.value = false" color="success">
                            Finaliser la commande
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