<script setup>
import { onMounted, ref, defineEmits } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';

const props = defineProps({
    userId: {
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
          <v-btn
            v-bind="activatorProps"
            icon
            size="16"
            class="no-effects"
            style="margin-left: 12px; margin-bottom: 6px"
          >              
          <v-icon color="primary">mdi-package-variant-closed-check</v-icon>
          </v-btn>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`La commande client n°${props.order.client_order_number} a-t-elle été livrée ?`" style="padding: 0.4em;">

                    <div class="text-modal">
                        En cliquant sur le bouton <strong>Archiver la commande</strong>,
                        la commande n'apparaîtra plus dans le tableau des commandes clients.
                    </div>

                    <div class="text-modal" style="margin-top: 1em;">
                        Vous pourrez retrouver cette commande dans les archives
                        des commandes clients.
                    </div>
                    <v-card-actions style="margin-bottom: 0.8em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn variant="elevated" @click="submitClientOrder(); isActive.value = false" color="success">
                            Archiver la commande
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