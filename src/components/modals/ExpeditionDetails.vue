<script setup>
// Services
import { statusIcon, statusIconColor, statusText } from '@/services/textIconServices.js'

const props = defineProps({
    userId: {
        type: Number
    },
    expedition: {
        type: Object,
        required: true
    }
})

</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                class="index-slot"
                variant="text"
                color="blue"
                style="margin-right: 0.6em; font-weight: 500;"
            >
                <v-icon start class="ml-1">mdi-gesture-spread</v-icon>
                <span class="mr-1">Consulter</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Détails de la commande fournisseur ${props.expedition.number}`" prepend-icon="mdi-file-check-outline" style="padding: 0.4em;">
                    <v-divider style="margin: 0em 1em; padding: 6px;"></v-divider>
                    <span v-if="expedition.status === 'partial'" style="margin: 0em 1em" class="informative-text">
                        <v-icon>mdi-alert-circle-outline</v-icon>
                        Les commandes dont le statut est défini comme <strong>partiel</strong> ont déjà une partie de la quantité d'origine envoyée
                    </span>
                    <v-card class="step-container" style="padding: 6px 12px; margin-bottom: -0.6em">
                        <div class="column-container">
                        <div class="part-column">
                            <div v-if="props.expedition">
                                <span class="informative-text-l">Numéro de commande : </span>
                                <span style="margin-left: 4px" class="informative-text-m">{{ props.expedition.number }}</span>
                            </div>
                            <div v-if="props.expedition.real_departure_time">
                                <span class="informative-text-l">Date de départ : </span>
                                <span style="margin-left: 4px" class="informative-text-m">
                                    {{ new Date(props.expedition.real_departure_time).toLocaleDateString() }}
                                </span>
                            </div>
                            <div v-if="props.expedition.arrival_time">
                                <span class="informative-text-l">Date d'arrivée : </span>
                                <span style="margin-left: 4px" class="informative-text-m">
                                    {{ new Date(props.expedition.arrival_time).toLocaleDateString() }}
                                </span>
                            </div>
                        </div>
                        <div class="part-column">
                            <div v-if="expedition.price">
                                <span class="informative-text-l">Prix unitaire: </span>
                                <span style="margin-left: 4px" class="informative-text-m">{{ expedition.price }} €</span>
                            </div>
                            <div v-if="expedition.shipped_quantity">
                                <span class="informative-text-l">Quantité déjà expédiée : </span>
                                <span style="margin-left: 4px" class="informative-text-m">{{ expedition.shipped_quantity }} pièce(s)</span>
                            </div>
                            <div v-if="expedition.status" style="display: flex; align-items: center;">
                                <span class="informative-text-l">Statut : </span>
                                <div>
                                    <v-icon :color="statusIconColor(expedition.status)" style="margin: 0px 4px;">
                                    {{ statusIcon(expedition.status) }}
                                    </v-icon>
                                    <span class="informative-text-m">{{ statusText(expedition.status) }}</span>
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