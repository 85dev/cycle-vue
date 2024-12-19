<script setup>
import { defineEmits } from 'vue'

// Services
import apiCaller from '../../services/apiCaller.js'

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
    userId: {
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

console.log(props);


async function deleteOrder() {
    if (props.orderType === 'client') {
        await apiCaller.deleteData(`users/${props.userId}/client_orders/${props.clientOrderId}`, false);
    } else if (props.orderType === 'supplier') {
        await apiCaller.deleteData(`users/${props.userId}/supplier_orders/${props.supplierOrderId}`, false);
    }

    emit("orderRefresh");
}

</script>

<template>
    <div class="pa-4 text-center">
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">

            <v-chip
                v-bind="activatorProps"
                variant="text"
                color="red"
            >
                <v-icon class='mr-2'>mdi-delete-outline</v-icon>
                <span>Supprimer</span>
            </v-chip> 

        </template>
  
        <template v-slot:default="{ isActive }">

          <v-card title="Suppression d'une commande fournisseur">

            <v-form style="width: 94%; margin: 0 auto;">
                <span class="informative-text-m">Vous êtes sur le point de supprimer la commande fournisseur <strong>{{ props.orderNumber }}</strong></span>
            </v-form>
  
            <v-card-actions style="margin-bottom: 0.8em;">

                <v-spacer></v-spacer>

                <v-btn
                    color="red"
                    text="FERMER"
                    @click="isActive.value = false"
                ></v-btn>

                <v-btn color="red" @click="deleteOrder(); isActive.value = false">
                    Supprimer la commande
                </v-btn>

            </v-card-actions>

          </v-card>

        </template>
      </v-dialog>
    </div>
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