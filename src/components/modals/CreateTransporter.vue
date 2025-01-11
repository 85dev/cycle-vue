<script setup>
// Services
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';

// Components
import CardTitle from '../CardTitle.vue';

// Vue essentials
import { computed, ref } from 'vue';

const props = defineProps({
    origin: {
        type: String
    }
})

const emit = defineEmits(['resfreshLogistics'])

// Reactive data
const selectedCompany = computed(() => sessionStore.getters.getSelectedCompany())
const transporter = ref({
  name: '',
  is_land: false,
  is_sea: false,
  is_air: false,
});
const selectedTransportTypes = ref([]); // To hold selected transport types

// Map transport type strings to boolean fields
function mapTransportTypesToBooleans(types) {
  transporter.value.is_land = types.includes('Terrestre');
  transporter.value.is_sea = types.includes('Maritime');
  transporter.value.is_air = types.includes('Aérien');
}

// Submit the transporter details
async function submitTransporter() {
    mapTransportTypesToBooleans(selectedTransportTypes.value);

    const payload = { transporter: { ...transporter.value } };
    await apiCaller.post(`companies/${selectedCompany.value.id}/transporter`, payload, false);
    transporter.value = {
      name: '',
      is_land: false,
      is_sea: false,
      is_air: false,
    };
    emit('resfreshLogistics')
    selectedTransportTypes.value = [];
}
</script>

<template>
  <v-dialog class="dialog-width">
    <template v-slot:activator="{ props: activatorProps }">
        <v-list v-if="props.origin === 'menu'" variant="tonal" density="compact" nav style="width: 100%; margin-top: -0.85em; margin-bottom: 0.8em;">
        <v-list-item v-bind="activatorProps" style="display: flex; margin-bottom: -0.6em;" nav>
          <div class="aligner">
            <v-list-item-icon>
              <v-icon style="margin-right: 0.4em;">mdi-truck-delivery-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title style="margin-right: 0.2em;">Ajouter un transporteur</v-list-item-title>
          </div>
        </v-list-item>
      </v-list>

      <v-btn v-bind="activatorProps" v-if="props.origin === 'single'" style="margin: 1em 0em 0.6em 0em;">
            <v-icon style="margin-right: 0.4em">mdi-account-plus-outline</v-icon>
            Ajouter un sous-traitant
      </v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <div class="card-container" style="padding: 0.4em;">
        <v-card>
          <CardTitle title="Créer un transporteur" icon="mdi-truck" />
          <v-divider style="margin: 0em 1em;"></v-divider>

          <div style="padding: 1em">
            <v-row style="margin-bottom: -2em;">
              <v-col cols="12">
                <v-text-field
                  label="Nom du transporteur"
                  v-model="transporter.name"
                  required
                  variant="underlined"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="selectedTransportTypes"
                  multiple="true"
                  label="Type de transport"
                  :items="['Terrestre', 'Maritime', 'Aérien']"
                  required
                  variant="underlined"
                />
              </v-col>
            </v-row>
          </div>

          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn variant="tonal" text="FERMER" @click="isActive.value = false" />

            <v-btn
              variant="elevated"
              color="success"
              text="AJOUTER"
              :loading="loading"
              @click="submitTransporter(); isActive.value = false"
            />
          </v-card-actions>
        </v-card>
      </div>
    </template>
  </v-dialog>
</template>

<style scoped>
.card-container {
  margin: 1em;
}
</style>