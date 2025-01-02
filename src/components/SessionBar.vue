<script setup>
import { onMounted, ref, computed } from 'vue'
import router from '@/router';
import sessionStore from '../stores/sessionStore.js'
import Logo from '@/assets/img/cycle_app.svg'

// Components import
// Models Creation
import CreateClient from '@/components/modals/CreateClient.vue'
import CreateSupplier from '@/components/modals/CreateSupplier.vue'
import CreatePart from '@/components/modals/CreatePart.vue';
import CreateSubcontractor from './modals/CreateSubcontractor.vue';
import CreateLogisticPlace from './modals/CreateLogisticPlace.vue';
import CreateTransporter from './modals/CreateTransporter.vue';

// Others
import PendingRequests from './modals/PendingRequests.vue';
import AccessRequests from './modals/AccessRequests.vue';
import SelectDatabaseCompany from './modals/SelectDatabaseCompany.vue';
import HandleAccount from './modals/HandleAccount.vue';
import SpinnLoader from './SpinnLoader.vue';
import WelcomeAccount from './modals/WelcomeAccount.vue';
import AccountModal from './modals/AccountModal.vue';


const loading = ref(false)
const userId = ref(null)
const userEmail = ref(null)
const drawer = ref(true)
const rail = ref(true)
const showOverlay = ref(false) 
const selectedIndex = ref(0);

const pendingRequests = computed(() => { return sessionStore.getters.getPendingRequests() })
const accessRequests = computed(() => { return sessionStore.getters.getAccessRequests() })
const selectedCompany = computed(() => { return sessionStore.getters.getSelectedCompany() })

function routeToItem(index, path) {
  selectedIndex.value = index; // Update the active index
  router.push(path); // Navigate to the selected path
}

function logoutUser() {
  loading.value = true;

  setTimeout(() => {
      sessionStore.actions.resetUserInfo()
      router.push('/login')
      loading.value = false;
  }, 1500);
}

const items = ref( 
  [
    { title: 'Tableau de bord', icon: 'mdi-gesture-double-tap', path: '/dashboard' },
    { title: 'Gestion des expéditions', icon: 'mdi-ferry', path: '/expeditions' },
    { title: 'Catalogue des pièces', icon: 'mdi-list-box-outline', path: '/parts' },
    { title: 'Gestion des consommations', icon: 'mdi-package-variant-minus', path: '/handle-consumptions' },
  ]
);

async function fetchData() {
    selectedCompany.value = await sessionStore.getters.getSelectedCompany()
    pendingRequests.value = await sessionStore.actions.fetchPendingAccounts();
    accessRequests.value = await sessionStore.actions.fetchAccessRequestAccounts()
    sessionStore.actions.initializeAuthState();  // Load user and auth token from localStorage
    userEmail.value = sessionStore.getters.getUserEmail();
}

onMounted(async() => {
    await fetchData()

    showOverlay.value = !selectedCompany.value ? true : false;

    if (userId.value === 0) {
      router.push('/login')
    }
})

</script>

<template>
    <SpinnLoader :loading="loading" text="Déconnexion..."/>
      <WelcomeAccount
        v-model="showOverlay"
        :pending-requests="pendingRequests"
        @close="showOverlay = false"
      />
    <div 
      v-if="selectedCompany"
      class="informative-text-m" 
      id="info-company-bar">
      <div v-if="selectedCompany">
        <v-icon class="mr-1">mdi-database</v-icon>
        Compte entreprise actuellement sélectionné : <strong>{{ selectedCompany.name }}</strong>
      </div>
      <div v-else>
        <v-icon class="mr-1">mdi-database</v-icon>
        Aucun compte entreprise sélectionné, rejoignez une entreprise dans la barre de menu
      </div>
    </div>
    <SelectDatabaseCompany
      v-if="selectedCompany"
      :selected-company="selectedCompany"
    />
    <v-card v-if="selectedCompany">
      <v-layout>
        <v-navigation-drawer
          v-model="drawer"
          :rail="rail"
          permanent
          @click="rail = false"
        >

          <div class="aligner">
            <img :src="Logo" style="margin: 0.6em 0.2em; padding: 0.1em;" :style="!rail ? 'height: 100px' : 'height: 36px'"/>
          </div>
          <v-list-item
            title="Menu - Cycle App v0.2.0"
            style="display: flex; align-items: center; justify-content: center;"
            nav
          >
            <template v-slot:append>
                <v-chip
                  variant="text"
                  class="ma-1 ml-2"
                  @click.stop="rail = !rail"
                  style="border-radius: 100%; padding: 0.3em 0.5em; box-shadow: none; display: flex; align-items: center; justify-content: center;"
                  :style="{ transform: rail ? 'rotate(0deg)' : 'rotate(180deg)' }"
                >
                  <v-icon>mdi-chevron-double-right</v-icon>
                </v-chip>
            </template>
          </v-list-item>

          <v-divider style="margin-bottom: 0.4em;"></v-divider>

          <div v-if="!rail" class="mt-2">
            <v-icon class="informative-text">mdi-airplane-takeoff</v-icon>
            <span class="informative-text" style="margin-left: -0.4em;">Suivi logistique</span>
          </div>

          <v-list 
            density="compact" 
            nav
            variant="elevated"
          >
            <v-list-item
              v-for="(item, index) in items"
              :key="index"
              :value="index"
              :active="selectedIndex === index"
              @click="routeToItem(index, item.path)"
            >
              <div style="display: flex; flex-direction: row; align-items: center;">
                  <v-list-item-icon>
                      <v-icon :color="`${item.color}`" style="margin-right: 0.4em;">{{ item.icon }}</v-icon>
                  </v-list-item-icon>
                  <v-list-item-title>
                      {{ item.title }}
                  </v-list-item-title>
              </div>
            </v-list-item>
          </v-list>

          <span v-if="!rail">
            <v-icon class="informative-text">mdi-cloud-sync-outline</v-icon>
            <span class="informative-text" style="margin-left: -0.4em;">Compte entreprise(s)</span>
            <AccountModal />
            <HandleAccount />
            <div v-if="pendingRequests">
              <PendingRequests :pending-requests="pendingRequests"/>
            </div>

            <div v-if="accessRequests">
              <AccessRequests :access-requests="accessRequests" />
            </div>

            <div v-if="!rail" class="mt-1">
              <v-icon class="informative-text">mdi-database-plus-outline</v-icon>
              <span class="informative-text" style="margin-left: -0.4em;">Ajout de données</span>
            </div>
          </span>
   
          <div 
            v-if="!rail"
            style="display: flex; flex-direction: column; align-items: flex-start;"
          >
            <CreatePart :origin="'menu'"></CreatePart>
            <CreateClient :origin="'menu'"></CreateClient>
            <CreateSupplier :origin="'menu'"></CreateSupplier>
            <CreateSubcontractor :origin="'menu'"></CreateSubcontractor>
            <CreateLogisticPlace :origin="'menu'"></CreateLogisticPlace>
            <CreateTransporter :origin="'menu'"></CreateTransporter>
          </div>

          <span v-if="!rail">
            <v-icon class="informative-text">mdi-account-outline</v-icon>
            <span class="informative-text" style="margin-left: -0.4em;">Session utilisateur</span>
            <div class="informative-text">{{ userEmail }}</div>
            <v-list variant="elevated" density="compact" nav style="width: 100%;">
              
                <v-list-item @click="logoutUser()" style="display: flex;" nav>
                    <div class="aligner">
                        <v-list-item-icon>
                        <v-icon style="margin-right: 0.4em;">mdi-logout</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title style="margin-right: 0.2em;">Déconnexion</v-list-item-title>
                    </div>
                </v-list-item>                
            </v-list>
          </span>
          <template v-if="rail">
            <v-divider class="mb-3 mr-1 ml-1"></v-divider>
            <div class="d-flex align-center flex-column">
            <!-- Access Requests -->
            <v-chip variant="elevated" @click="rail = true" color="blue">
              <v-icon>mdi-account-check-outline</v-icon>
              <span>{{ accessRequests.length }}</span>
            </v-chip>
            <!-- Pending Requests -->
            <v-chip class="mt-2" @click="rail = true" variant="elevated" color="warning">
              <v-icon>mdi-bell-outline</v-icon>
              <span>{{ pendingRequests.length }}</span>
            </v-chip>
          </div>
          </template>
        </v-navigation-drawer>
      </v-layout>
    </v-card>
</template>

<style lang="scss" scoped>
@import url(../assets/main.scss);

.custom{
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.v-list-item--active {
  background-color: #e3f2fd !important; /* Light blue background */
  color: #1565c0 !important; /* Blue text color */
  font-weight: bold; /* Bold text */
  border-radius: 4px; /* Optional rounded corners */
}

.top-bar {
  border-radius: 0px;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

#info-company-bar {
  position: fixed; 
  font-size: 0.9em; 
  bottom: 0; 
  right: 0; 
  z-index: 1; 
  padding: 8px 12px; 
  background: linear-gradient(to right, #22bcef, #32c8e2); 
  border-radius: 10px 0 0 0; 
  box-shadow: -2px 2px 5px rgba(0, 0, 0, 0.2);
}
</style>
