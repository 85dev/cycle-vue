<script setup>
import { defineEmits } from 'vue'

// Services
import apiCaller from '../../services/apiCaller.js'
import CardTitle from '../CardTitle.vue'

// Emit to allow refresh of the parent component
const emit = defineEmits(['orderRefresh'])

// Variables & logic
const props = defineProps({
    clientOrderId: {
        type: Number,
    },
    supplierOrderId: {
        type: Number,
    },
    selectedCompanyId: {
        type: Number,
        required: true
    },
    orderType: {
        type: String,
        required: true
    },
    orderNumber: {
        type: String,
        required: true
    }
})

async function deleteOrder() {
    if (props.orderType === 'client') {
        await apiCaller.get(`companies/${props.selectedCompanyId}/client_orders/${props.clientOrderId}`, false);
    } else if (props.orderType === 'supplier') {
        await apiCaller.get(`companies/${props.selectedCompanyId}/supplier_orders/${props.supplierOrderId}`, false);
    }

    emit("orderRefresh");
}

</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                variant="text"
                color="warning"
            >
                <v-icon class='mr-1'>mdi-delete-outline</v-icon>
                <span>Archiver</span>
            </v-chip> 

        </template>
  
        <template v-slot:default="{ isActive }">

          <v-card>
            <CardTitle 
                title="Archivage d'une commande fournisseur"
                icon="mdi-history"
            />

            <v-form style="width: 94%; margin: 0 auto;">
                <span class="informative-text-m">Vous êtes sur le point d'archiver la commande fournisseur. <strong>{{ props.orderNumber }}</strong>
                    Elle n'apparaîtra plus dans le suivi logistique.
                </span>
            </v-form>
  
            <v-card-actions>

                <v-spacer></v-spacer>

                <v-btn
                    text="FERMER"
                    @click="isActive.value = false"
                ></v-btn>

                <v-btn color="red" @click="deleteOrder(); isActive.value = false">
                    Archiver
                </v-btn>

            </v-card-actions>

          </v-card>

        </template>
      </v-dialog>
  </template>

<style scoped lang="scss">
.v-btn {
    &:hover {
        margin-bottom: 0em;
    }
}

.text-field {
  max-width: 60%;
  margin: 0 auto;
}
</style>