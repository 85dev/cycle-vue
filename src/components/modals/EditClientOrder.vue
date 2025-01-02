<script setup>
import { onMounted, ref, defineEmits } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';

const props = defineProps({
    selectedCompanyId: {
        type: Number
    },
    partId: {
        type: Number
    },
    order: {
        type: Object
    }
})

const emit = defineEmits(['refreshClientOrders'])
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                variant="text"
                color="blue"
            >
                <v-icon class='mr-2'>mdi-pencil-outline</v-icon>
                <span>Modifier</span>
            </v-chip> 
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Modification de la commande client n°${props.order.client_order_number}`" style="padding: 0.4em;">
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <v-card-actions style="margin-bottom: 0.8em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn 
                            variant="elevated"
                            color="success"
                            @click="submitClientOrder(); isActive.value = false"
                        > Modifier la commande </v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

</style>