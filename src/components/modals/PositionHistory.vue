<script setup>
import { onMounted, ref } from 'vue';
import apiCaller from '@/services/apiCaller';
import dateConverter from '@/services/dateConverter';

const props = defineProps({
    userId: {
        type: Number,
        required: true
    },
    clientPositionId: {
        type: Number,
        required: true
    }
})

const positionHistory = ref(null)

async function fetchPartHistory() {
    const response = await apiCaller.get(`users/${props.userId}/client_positions/${props.clientPositionId}/position_history`);
    positionHistory.value = response
}

onMounted(async () => {
    await fetchPartHistory()
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
                <span class="mr-1">Historique</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Historique de la position`" style="padding: 0.4em;">
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <v-timeline align="center" side="end" line-thickness="6" line-color="orange-lighten-3">
                            <!-- Supplier Order -->
                            <v-timeline-item v-if="positionHistory?.supplier_order" elevation="6" icon="mdi-factory" icon-color="white" dot-color="red">
                                <template v-slot:opposite>
                                    <v-chip variant="elevated" color="red">
                                        {{ dateConverter.formatReadableDate(positionHistory.supplier_order.created_at) }}
                                    </v-chip>
                                </template>
                                <template v-slot:default>
                                    <div class="informative-text">
                                        <v-chip variant="tonal" color="red" class="mb-2">Commande fournisseur</v-chip>
                                        <div>
                                            <strong>Numéro:</strong> {{ positionHistory.supplier_order.number || 'N/A' }}
                                        </div>
                                        <div>
                                            <strong>Statut:</strong> {{ positionHistory.supplier_order.status === 'production' ? 'En production' : 'En livraison' }}
                                        </div>
                                    </div>
                                </template>
                            </v-timeline-item>

                            <!-- Supplier Order Index -->
                            <v-timeline-item v-if="positionHistory?.supplier_order_index" elevation="6" icon="mdi-file-document" icon-color="white" dot-color="green">
                                <template v-slot:opposite>
                                    <v-chip variant="elevated" color="green">
                                        {{ dateConverter.formatReadableDate(positionHistory.supplier_order_index.created_at) }}
                                    </v-chip>
                                </template>
                                <template v-slot:default>
                                    <div class="informative-text">
                                        <v-chip variant="tonal" color="green" class="mb-2">Position fournisseur sur l'expédition</v-chip>
                                        <div>
                                            <strong>Quantité: </strong> {{ positionHistory.supplier_order_index.quantity }}
                                        </div>
                                        <div>
                                            <strong>Statut: </strong> {{ positionHistory.supplier_order_index.status === 'delivered' ? 'Expédition arrivée' : 'Expédition non arrivée' }}
                                        </div>
                                    </div>
                                </template>
                            </v-timeline-item>

                            <!-- Expedition -->
                            <v-timeline-item v-if="positionHistory?.expedition" elevation="6" icon="mdi-truck" icon-color="white" dot-color="orange">
                                <template v-slot:opposite>
                                    <v-chip variant="elevated" color="orange">
                                        {{ dateConverter.formatReadableDate(positionHistory.expedition.real_departure_time) }}
                                    </v-chip>
                                </template>
                                <template v-slot:default>
                                    <div class="informative-text">
                                        <v-chip variant="tonal" color="orange" class="mb-2">Expédition</v-chip>
                                        <div>
                                            <strong>Numéro:</strong> {{ positionHistory.expedition.number }}
                                        </div>
                                        <div>
                                            <strong>Status:</strong> {{ positionHistory.expedition.status }}
                                        </div>
                                        <div>
                                            <strong>Date d'arrivée:</strong>
                                            {{ dateConverter.formatReadableDate(positionHistory.expedition.arrival_time) }}
                                        </div>
                                    </div>
                                </template>
                            </v-timeline-item>

                            <!-- Client Position -->
                            <v-timeline-item v-if="positionHistory?.client_position" elevation="6" icon="mdi-account" icon-color="white" dot-color="blue">
                                <template v-slot:opposite>
                                    <v-chip variant="elevated" color="blue">
                                        {{ dateConverter.formatReadableDate(positionHistory.client_position.created_at) }}
                                    </v-chip>
                                </template>
                                <template v-slot:default>
                                    <div class="informative-text">
                                        <v-chip variant="tonal" color="blue" class="mb-2">Position Client</v-chip>
                                        <div>
                                            <strong>Quantité:</strong> {{ positionHistory.client_position.quantity }}
                                        </div>
                                        <div>
                                            <strong>Client:</strong> {{ positionHistory.client_position.client_name }}
                                        </div>
                                    </div>
                                </template>
                            </v-timeline-item>
                        </v-timeline>

                        <v-card-actions style="margin-bottom: 0.8em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            class="mr-4"
                            variant="tonal"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

</style>