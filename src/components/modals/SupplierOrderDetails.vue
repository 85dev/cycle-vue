<script setup>
import { onMounted, ref, defineEmits } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';
import { statusIcon, statusIconColor, statusText } from '@/services/textIconServices.js'

const props = defineProps({
    userId: {
        type: Number
    },
    order: {
        type: Object,
        required: true
    }
})

</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn
            v-bind="activatorProps"
            icon
            style="background-color: none; box-shadow: none; margin-bottom: 10px;"
            size="12"
            class="no-effects"
          >              
          <v-icon>mdi-file-document-arrow-right-outline</v-icon>
          </v-btn>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Détails de la commande fournisseur ${props.order.supplier_order_number}`" prepend-icon="mdi-file-check-outline" style="padding: 0.4em;">
                    <v-divider style="margin: 0em 1em; padding: 6px;"></v-divider>
                    <span v-if="order.status === 'partial'" style="margin: 0em 1em" class="informative-text">
                        <v-icon>mdi-alert-circle-outline</v-icon>
                        Les commandes dont le statut est défini comme <strong>partiel</strong> ont déjà une partie de la quantité d'origine envoyée
                    </span>
                    <v-card class="step-container" style="padding: 6px 12px; margin-bottom: -0.6em">
                        <div class="column-container">
                        <div class="part-column">
                            <div v-if="props.order.supplier_order_number">
                                <span class="informative-text-l">Numéro de commande : </span>
                                <span style="margin-left: 4px" class="informative-text-m">{{ props.order.supplier_order_number }}</span>
                            </div>
                            <div v-if="props.order.quantity">
                                <span class="informative-text-l">Quantité : </span>
                                <span style="margin-left: 4px" class="informative-text-m">{{ order.quantity }} pièce(s)</span>
                            </div>
                            <div v-if="props.order.created_at">
                                <span class="informative-text-l">Commande passée le : </span>
                                <span style="margin-left: 4px" class="informative-text-m">{{ new Date(props.order.created_at).toLocaleDateString() }}</span>
                            </div>
                        </div>
                        <div class="part-column">
                            <div v-if="order.price">
                                <span class="informative-text-l">Prix unitaire: </span>
                                <span style="margin-left: 4px" class="informative-text-m">{{ order.price }} €</span>
                            </div>
                            <div v-if="order.shipped_quantity">
                                <span class="informative-text-l">Quantité déjà expédiée : </span>
                                <span style="margin-left: 4px" class="informative-text-m">{{ order.shipped_quantity }} pièce(s)</span>
                            </div>
                            <div v-if="order.status" style="display: flex; align-items: center;">
                                <span class="informative-text-l">Statut : </span>
                                <div>
                                    <v-icon :color="statusIconColor(order.status)" style="margin: 0px 4px;">
                                    {{ statusIcon(order.status) }}
                                    </v-icon>
                                    <span class="informative-text-m">{{ statusText(order.status) }}</span>
                                </div>
                            </div>
                        </div>
                        </div>
                    </v-card>

                    <!-- <v-card class="step-container" style="padding: 6px 12px; margin-bottom: -0.6em">
                        <div class="aligner">
                            <v-icon color="primary" style="margin-right: 0.2em">mdi-cube-send</v-icon>
                            <span class="informative-text-l">Reste à expédier : {{ order.quantity - order.shipped_quantity }} pièce(s)</span>
                        </div>
                    </v-card> -->

                    <v-card-actions style="margin: 0.8em 0em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>