<script setup>
import { onMounted, ref, defineEmits } from 'vue';
import sessionStore from '@/stores/sessionStore.js'; // Import the new store

// Components
import SpinnLoader from '@/components/SpinnLoader.vue';
import CardTitle from '../CardTitle.vue';

// Services
import apiCaller from '@/services/apiCaller.js';
import autocomplete from '@/services/addressAutocomplete.js';

const userId = ref(null);
const address = ref(null);
const name = ref(null);
const contactEmail = ref(null);
const contactName = ref(null);
const autocompletedAddresses = ref([]);
const loading = ref(false);

const emit = defineEmits(['refreshLogisticPlaces']);

const props = defineProps({
    origin: {
        type: String,
    },
})

async function fetchAddressAutocomplete(address) {
  if (address) {
    try {
      loading.value = true;
      autocompletedAddresses.value = await autocomplete.fetchAddressAutocomplete(address);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      loading.value = false; // Stop loading spinner after fetching or error
    }
  }
}

async function submitLogisticPlace() {
  const logisticPlace = {
    logistic_place: {
      name: name.value,
      address: address.value,
      contact_email: contactEmail.value,
      contact_name: contactName.value,
    },
  };

  const response = await apiCaller.post(
    `users/${userId.value}/create_logistic_place`,
    logisticPlace,
    true
  );

  emit('refreshLogisticPlaces');
}

function selectAddress(newAddress) {
  address.value = newAddress;
}

onMounted(async () => {
  sessionStore.actions.initializeAuthState(); // Load user and auth token from localStorage

  // Set the userId from sessionStore
  userId.value = sessionStore.getters.getUserID();
});
</script>

<template>
  <v-dialog class="dialog-width">
    <template v-slot:activator="{ props: activatorProps }">
      <v-list v-if="props.origin === 'menu'" variant="tonal" density="compact" nav style="width: 100%; transition: all 0.2s; margin-top: -0.95em; margin-bottom: 0.7em;">
        <v-list-item v-bind="activatorProps" style="display: flex; margin-bottom: -0.6em;" nav>
          <div class="aligner">
            <v-list-item-icon>
              <v-icon style="margin-right: 0.4em;">mdi-domain-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-title style="margin-right: 0.2em;">Ajouter un lieu de stockage</v-list-item-title>
          </div>
        </v-list-item>
      </v-list>

      <v-btn v-bind="activatorProps" v-if="props.origin === 'single'" style="margin: 1em 0em 0.6em 0em;">
            <v-icon style="margin-right: 0.4em">mdi-domain-plus</v-icon>
            Ajouter un lieu de stockage
      </v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <div style="padding: 0.4em;">
        <v-card style="padding: 0.4em;">
          <CardTitle 
            title="Ajouter un nouveau lieu logistique" 
            icon="mdi-domain-plus"
          />
          <v-divider style="margin: 0em 1em;"></v-divider>

          <v-form class="form-container">
            <v-text-field
              variant="underlined"
              class="form-part"
              label="Nom du lieu de stockage"
              v-model="name"
              required
            ></v-text-field>

            <v-text-field
              variant="underlined"
              class="form-part"
              v-model="address"
              @input="fetchAddressAutocomplete(address)"
              label="Adresse"
              required
            ></v-text-field>

            <div style="display: flex; justify-content: center;" v-if="loading">
              <SpinnLoader :loading="loading"></SpinnLoader>
            </div>

            <v-chip-group
              style="display: flex; justify-content: center;"
              v-if="autocompletedAddresses.length && !loading"
              active-class="primary--text"
              column
            >
              <v-chip
                v-for="(address, index) in autocompletedAddresses"
                :key="index"
                style="display: flex; justify-content: center; align-items: center;"
                @click="selectAddress(address)"
              >
                {{ address }}
                <v-icon style="margin-left: 0.4em;" color="success">mdi-plus-circle-outline</v-icon>
              </v-chip>
            </v-chip-group>

            <v-text-field
              clearable
              variant="underlined"
              class="form-part"
              v-model="contactName"
              label="Nom du contact"
              required
            ></v-text-field>

            <v-text-field
              clearable
              variant="underlined"
              class="form-part"
              v-model="contactEmail"
              label="Email du contact"
              required
            ></v-text-field>
          </v-form>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="red" text="FERMER" @click="isActive.value = false"></v-btn>
            <v-btn variant="elevated" color="success" @click="submitLogisticPlace(); isActive.value = false">
              Ajouter
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </template>
  </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

.v-slide-group__content {
  display: flex;
  justify-content: center;
}
</style>