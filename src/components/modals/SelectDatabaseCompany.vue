<script setup>
import { ref, computed, onMounted } from 'vue';
import sessionStore from '@/stores/sessionStore';
import SpinnLoader from '../SpinnLoader.vue';
import CardTitle from '../CardTitle.vue';

const props = defineProps({
    selectedCompany: {
        type: Object,
        required: true
    }
})

const loading = ref(false)
const companies = computed(() => sessionStore.getters.getUserCompanies());
const localSelectedCompany = ref(null);

// Handle company selection
async function selectCompany() {
  loading.value = true;
  setTimeout(() => {
    sessionStore.actions.setPreselectedCompany(localSelectedCompany.value); // Persist selection in sessionStore
    loading.value = false;
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
      <v-btn
        v-bind="activatorProps"
        icon
        variant="elevated"
        class="top-right-btn"
      >
        <v-icon>mdi-account-sync-outline</v-icon>
      </v-btn>
    </template>
    <template v-slot:default="{ isActive }">
    <v-card>
      <CardTitle
        title="Changer de compte société"
        icon="mdi-office-building"
      />
      <v-divider></v-divider>
      <v-card class="pa-2 ma-2 mb-0">
        <v-radio-group
          v-if="companies && companies.length > 0"
          v-model="localSelectedCompany"
          label="Sélectionnez le compte société sur lequel travailler :"
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
  top: 16px;
  right: 16px;
  z-index: 1;
}
</style>