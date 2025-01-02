<script setup>
import { computed, toRefs } from 'vue';
import dateConverter from '@/services/dateConverter.js';
import { pendingRequestsHeaders } from '@/models/tableHeaders.js';
import CreateCompany from './CreateCompany.vue';
import JoinCompany from './JoinCompany.vue';
import CardTitle from '../CardTitle.vue';

const props = defineProps({
  showOverlay: {
    type: Boolean,
    required: true,
  },
  pendingRequests: {
    type: Array,
    default: () => [],
  },
});

const { showOverlay } = toRefs(props);

const emits = defineEmits(['update:showOverlay']);

const closeOverlay = () => {
  emits('update:showOverlay', false);
};

const hasPendingRequests = computed(() => props.pendingRequests.length > 0);
</script>

<template>
  <v-overlay
    v-model="showOverlay"
    persistent
    opacity="0"
    color="rgba(255, 255, 255, 0.9)"
    class="custom"
  >
    <v-card>
      <CardTitle 
        title="Création d'un compte entreprise"
        icon="mdi-account-plus-outline"
      />
      <div class="d-flex align-center flex-column pa-2">
        <span
          v-if="!hasPendingRequests"
          class="informative-text mb-6 d-flex align-center"
        >
          <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
          Vous devez créer un compte entreprise ou bien rejoindre une entreprise avant de pouvoir utiliser Cycle.
        </span>
        <div v-if="hasPendingRequests" class="informative-text mb-6">
          <div>
            Vous avez
            <v-chip variant="outlined" class="ma-1" color="blue">
              {{ pendingRequests.length }}
            </v-chip>
            demande(s) d'accès en attente
          </div>
          <v-data-table
            class="mb-3"
            density="comfortable"
            hide-default-footer
            :items="pendingRequests"
            :headers="pendingRequestsHeaders"
          >
            <template v-slot:item.company_name="{ item }">
              <v-chip variant="elevated">
                <v-icon class="mr-2">mdi-office-building</v-icon>
                {{ item.company_name }}
              </v-chip>
            </template>
            <template v-slot:item.is_owner="{ item }">
              <v-chip
                :variant="'elevated'"
                :color="item.is_owner ? 'warning' : 'blue'"
              >
                <v-icon class="mr-2">
                  {{ item.is_owner ? 'mdi-account-key-outline' : 'mdi-account-child-outline' }}
                </v-icon>
                {{ item.is_owner ? 'Propriétaire' : 'Non-propriétaire' }}
              </v-chip>
            </template>
            <template v-slot:item.created_at="{ item }">
              <v-chip variant="elevated" color="blue">
                <v-icon class="mr-2">mdi-clock-outline</v-icon>
                {{ dateConverter.formatReadableDate(item.created_at) }}
              </v-chip>
            </template>
          </v-data-table>
          <div>Vous devez attendre la validation de l'accès par le propriétaire</div>
        </div>
        <v-container>
          <v-row>
            <v-col class="d-flex align-center justify-center">
              <CreateCompany />
            </v-col>
            <v-col class="d-flex align-center justify-center">
              <JoinCompany />
            </v-col>
          </v-row>
        </v-container>
      </div>
    </v-card>
  </v-overlay>
</template>

<style scoped>
.custom {
    z-index: 2;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
}
</style>