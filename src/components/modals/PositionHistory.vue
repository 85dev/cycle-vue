<script setup>
import { onMounted, ref, computed } from 'vue';
import apiCaller from '@/services/apiCaller';
import dateConverter from '@/services/dateConverter';
import CardTitle from '../CardTitle.vue';

const props = defineProps({
    selectedCompanyId: {
        type: Number,
        required: true
    },
    clientPositionId: {
        type: Number,
        required: true
    }
})

const totalDuration = computed(() => {
    if (!positionHistory.value?.supplier_order?.created_at || !positionHistory.value?.client_position?.created_at) {
        return null;
    }

    const startDate = new Date(positionHistory.value.supplier_order.created_at);
    const endDate = new Date(positionHistory.value.client_position.created_at);
    
    // Calculate difference in days
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
});

const positionHistory = ref([])

async function fetchPartHistory() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/client_positions/${props.clientPositionId}/position_history`);
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
                <v-icon start class="ml-1">mdi-clipboard-text-clock-outline</v-icon>
                <span class="mr-1">Historique</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <v-card-title class="d-flex justify-space-between align-center">
                        <CardTitle 
                            title="Historique de la position"
                            icon="mdi-history"
                        />
                        <div v-if="totalDuration">
                            <v-chip color="blue" class="mr-2">
                                <v-icon start class="ml-1">mdi-calendar</v-icon>
                                <span class="mr-1">Cycle d'approvisionnement : </span> <strong class="mr-1">{{ totalDuration }} jours</strong>
                            </v-chip>
                            <v-chip color="blue">
                                <v-icon start class="ml-1">mdi-counter</v-icon>
                                <span class="mr-1">Nombre d'étapes : </span> <strong class="mr-1">{{ positionHistory.counts }}</strong>
                            </v-chip>
                        </div>
                    </v-card-title>
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <v-timeline 
                        align="center" 
                        side="end" 
                        line-thickness="6" 
                        line-color="blue-darken-4"
                        direction="horizontal"
                        class="mt-6 mb-2"
                        style="overflow-x: auto;"
                    >
                            <!-- Supplier Order -->
                            <v-timeline-item v-if="positionHistory?.supplier_order" elevation="6" icon="mdi-factory" icon-color="white" dot-color="blue-darken-4">
                                <template v-slot:opposite>
                                    <v-chip variant="elevated" color="blue-darken-4">
                                        {{ dateConverter.formatReadableDate(positionHistory.supplier_order.created_at) }}
                                    </v-chip>
                                </template>
                                <template v-slot:default>
                                    <div class="informative-text">
                                        <v-chip variant="tonal" color="blue-darken-4" class="mb-2">Commande fournisseur</v-chip>
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
                            <v-timeline-item v-if="positionHistory?.supplier_order_index" elevation="6" icon="mdi-file-document" icon-color="white" dot-color="blue-darken-2">
                                <template v-slot:opposite>
                                    <v-chip variant="elevated" color="blue-darken-2">
                                        {{ dateConverter.formatReadableDate(positionHistory.supplier_order_index.created_at) }}
                                    </v-chip>
                                </template>
                                <template v-slot:default>
                                    <div class="informative-text">
                                        <v-chip variant="tonal" color="blue-darken-2" class="mb-2">Position fournisseur sur l'expédition</v-chip>
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
                            <v-timeline-item v-if="positionHistory?.expedition" elevation="6" icon="mdi-truck" icon-color="white" dot-color="blue-darken-1">
                                <template v-slot:opposite>
                                    <v-chip variant="elevated" color="blue-darken-1">
                                        {{ dateConverter.formatReadableDate(positionHistory.expedition.real_departure_time) }}
                                    </v-chip>
                                </template>
                                <template v-slot:default>
                                    <div class="informative-text">
                                        <v-chip variant="tonal" style="width: fit-content;" color="blue-darken-1" class="mb-2">Expédition</v-chip>
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

                            <v-timeline-item 
                                v-for="part in positionHistory?.expedition_position_histories" 
                                :key="part.id"
                                elevation="6" 
                                :icon="part.event_type === 'logistic_place' ? 'mdi-dolly' : 'mdi-cog'" 
                                icon-color="white" 
                                dot-color="warning"
                            >
                                <template v-slot:opposite>
                                    <v-chip variant="elevated" color="warning">
                                        {{ dateConverter.formatReadableDate(part.start_time) }}
                                    </v-chip>
                                </template>
                                <template v-slot:default>
                                    <div class="informative-text">
                                        <v-chip variant="tonal" color="warning" style="width: fit-content;" class="mb-2">
                                            {{ part.event_type === 'logistic_place' ? 'Emplacement logistique' : 'Sous-traitant' }}
                                        </v-chip>
                                        <div>
                                            <strong>Lieu:</strong> {{ part.location_name }}
                                        </div>
                                        <div v-if="part.end_time">
                                            <strong>Fin:</strong> {{ dateConverter.formatReadableDate(part.end_time) }}
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
                                        <v-chip variant="tonal" style="width: fit-content;" color="blue" class="mb-2">Position Client</v-chip>
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

:deep(.v-timeline-item) {
  .v-timeline-item__body {
    display: flex;
    flex-direction: column;
    align-self: flex-start;
    padding-block-start: 8px;
    height: 100%;
    padding: 8px 0;
  }
}

</style>