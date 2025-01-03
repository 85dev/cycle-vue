<script setup>
import { ref, computed, onMounted, defineEmits } from 'vue';
import sessionStore from '@/stores/sessionStore';
import SpinnLoader from '../SpinnLoader.vue';
import CardTitle from '../CardTitle.vue';
import Microloader from '../Microloader.vue';

const props = defineProps({
    selectedCompany: {
        type: Object,
        required: true
    },
    parentLoading: {
      type: Boolean
    },
    origin: {
      type: String
    }
})

const emit = defineEmits(['updateLoading']); // Declare the event

const loading = ref(false)
const companies = computed(() => sessionStore.getters.getUserCompanies());
const localSelectedCompany = ref(null);

// Handle company selection
async function selectCompany() {
  loading.value = true;
  emit('updateLoading', loading.value); // Emit the updated loading state to the parent
  
  setTimeout(() => {
    sessionStore.actions.setPreselectedCompany(localSelectedCompany.value); // Persist selection in sessionStore
    loading.value = false;
    emit('updateLoading', loading.value); // Emit the updated loading state to the parent
  }, 1500);
}

onMounted(() => {
    localSelectedCompany.value = props.selectedCompany
})
</script>

<template>
  <SpinnLoader :loading="loading" text="Chargement des données..."></SpinnLoader>
  <v-dialog class="dialog-width">
    <template v-slot:activator="{ props: activatorProps }">
      <v-card
        v-if="!props.origin"
        v-bind="activatorProps"
        icon
        variant="elevated"
        color="white"
        class="top-right-btn mr-2"
      >
        <Microloader :loading="loading" color="white"></Microloader>
        <div v-if="!loading">
          <v-icon>mdi-account-sync-outline</v-icon>
          Changer de compte entreprise
        </div>
      </v-card>
      <v-list v-else variant="elevated" density="compact" nav style="width: 100%; transition: all 0.2s; margin-top: -0.80em;">
          <v-list-item color="blue" v-bind="activatorProps" style="display: flex;" nav>
              <div class="aligner">
                <v-list-item-icon>
                <v-icon style="margin-right: 0.4em;">mdi-account-sync-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-title style="margin-right: 0.2em;">Changer de compte</v-list-item-title>
              </div>
          </v-list-item>                
      </v-list>
    </template>
    <template v-slot:default="{ isActive }">
    <v-card>
      <CardTitle
        title="Changer de compte entreprise"
        icon="mdi-account-sync-outline"
      />
      <v-divider></v-divider>
      <v-card class="pa-2 ma-2 mb-0">
        <v-chip variant="elevated" class="d-flex align-center justify-center mb-2" color="blue" style="width: fit-content;">
          <v-icon class="mr-2">mdi-office-building-outline</v-icon>
          <span>Sélectionnez le compte entreprise sur lequel travailler :</span>
        </v-chip>
        <v-radio-group
          v-if="companies && companies.length > 0"
          v-model="localSelectedCompany"
          @update:model-value="selectCompany(); isActive.value = false"
        >
          <v-radio
            v-for="company in companies"
            :key="company.id"
            :label="company.name"
            :value="company"
            color="blue"
          ></v-radio>
        </v-radio-group>
        <div v-else class="informative-text">
          <v-icon color='warning' class="mr-1">mdi-alert-circle-outline</v-icon>
          Vous n'appartenez actuellement à aucune société, vous pouvez gérer les demandes d'accès dans la barre de menu
        </div>
      </v-card>
      <v-card-actions>
        <v-btn
          variant="tonal"
          text="FERMER"
          @click="isActive.value = false"
        >
        </v-btn>
      </v-card-actions>
    </v-card>
    </template>
  </v-dialog>
</template>

<style scoped>
@import url(../../assets/main.scss);

.top-right-btn {
  position: fixed;
  bottom: 0vh;
  right: -0.45vw;
  font-size: 0.9em;
  border-radius: 10px 0 0 0;
  padding: 8px 12px;
  z-index: 1;
}
</style>