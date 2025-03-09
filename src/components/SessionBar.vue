<script setup>
import { onMounted, ref, computed, watch } from 'vue'
import router from '@/router';
import sessionStore from '../stores/sessionStore.js'
import Logo from '@/assets/img/cycle_app.svg'

// Components import
import PendingRequests from './modals/PendingRequests.vue';
import AccessRequests from './modals/AccessRequests.vue';
import SendAccessRequest from './modals/SendAccessRequest.vue';
import SelectDatabaseCompany from './modals/SelectDatabaseCompany.vue';
import HandleAccount from './modals/HandleAccount.vue';
import SpinnLoader from './SpinnLoader.vue';
import WelcomeAccount from './modals/WelcomeAccount.vue';
import AccountModal from './modals/AccountModal.vue';
import Microloader from './Microloader.vue';
import DataAddingModal from './modals/DataAddingModal.vue';

const loading = ref(false)
const loadingData = ref(false)
const userEmail = ref(null)
const drawer = ref(true)
const rail = ref(true)
const selectedIndex = ref(0);

const userId = computed(() => { return sessionStore.getters.getUserID() })
const selectedCompany = computed(() => { return sessionStore.getters.getSelectedCompany() })
const accessRequests = computed(() => { return sessionStore.getters.getAccessRequests() })
const pendingRequests = computed(() => { return sessionStore.getters.getPendingRequests() })
const showOverlay = computed(() => {
  return !selectedCompany.value; // Show modal when there's no selected company
});

function routeToItem(index, path) {
  selectedIndex.value = index; // Update the active index
  router.push(path); // Navigate to the selected path
}

function logoutUser() {
  loading.value = true;

  setTimeout(() => {
      sessionStore.actions.resetUserInfo()
      loading.value = false;
      router.push('/login')
  }, 1500);
}

function updateLoading(event) {
  loadingData.value = event;
}

const items = ref( 
  [
    { title: 'Tableau de bord', icon: 'mdi-gesture-double-tap', path: '/dashboard' },
    { title: 'Catalogue des pièces', icon: 'mdi-list-box-outline', path: '/parts' },
    { title: 'Gestion des commandes', icon: 'mdi-cart-outline', path: '/handle_orders' },
    { title: 'Gestion des expéditions', icon: 'mdi-ferry', path: '/expeditions' },
    { title: 'Gestion des consommations', icon: 'mdi-package-variant-minus', path: '/handle_consumptions' },
    { title: 'Gestion des documents', icon: 'mdi-file-pdf-box', path: '/pdf_creations' },
  ]
);

async function fetchData() {
    loadingData.value = true;

    userId.value = await sessionStore.getters.getUserID()
    selectedCompany.value = await sessionStore.getters.getSelectedCompany()
    pendingRequests.value = await sessionStore.actions.fetchPendingAccounts();
    accessRequests.value = await sessionStore.actions.fetchAccessRequestAccounts()
    sessionStore.actions.initializeAuthState();  // Load user and auth token from localStorage
    userEmail.value = sessionStore.getters.getUserEmail();
    sessionStore.actions.refreshApplication() // Trigger refresh for other components

    loadingData.value = false;
}

watch(selectedCompany, async (newCompany, oldCompany) => {
  if (newCompany?.id !== oldCompany?.id) { // Only trigger fetchData if the company has changed
    await fetchData();
  }
});

onMounted(async() => {
    await fetchData()

    if (!userId.value || userId.value === 0) {
      sessionStore.actions.resetUserInfo()
      router.push('/login')
    }
})

</script>

<template>
    <SpinnLoader :loading="loading" text="Déconnexion..."/>
    <WelcomeAccount
      v-if="showOverlay && pendingRequests"
      v-model:show-overlay="showOverlay"
      :pending-requests="pendingRequests"
      @refresh-session="fetchData()"
      @close="showOverlay = false"
    />
  
    <v-card v-if="selectedCompany"
        class="informative-text-m" 
        id="info-company-bar"
        elevation="4"
        >
      <div v-if="selectedCompany" class="d-flex align-center">
        <v-icon class="mr-1">mdi-database</v-icon>
        Compte entreprise actuellement sélectionné : 
        <strong class="ml-1" v-if="!loadingData">
          {{ selectedCompany.name }}
        </strong>
        <Microloader class="ml-2" :loading="loadingData" />
      </div>
      <div v-else-if="!loadingData">
        <v-icon class="mr-1">mdi-database</v-icon>
        Aucun compte entreprise sélectionné, rejoignez une entreprise dans la barre de menu
      </div>
    </v-card>

    <SelectDatabaseCompany
        v-if="selectedCompany"
        :loading="loading"
        :selected-company="selectedCompany"
        @updateLoading="updateLoading($event)"
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
            <img :src="Logo" style="margin: 0.6em 0.2em; padding: 0.1em;" :style="!rail ? 'height: 140px' : 'height: 52px'"/>
          </div>
          <v-list-item
            title="Menu - Cycle App v0.4.0"
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
            <v-icon class="informative-text">mdi-sync</v-icon>
              <span class="informative-text" style="margin-left: -0.4em;">Compte entreprise actif </span>
              <div class="d-flex align-center justify-center">
                <v-chip v-if="!loadingData" variant="elevated" class="mb-2 mt-2" color="blue">
                  <v-icon class="mr-1">mdi-office-building</v-icon>
                    {{ selectedCompany.name.length > 20 ? selectedCompany.name.substring(0, 23) + '...' : selectedCompany.name }}
                </v-chip>
                <div v-else>
                  <Microloader class="mt-4 mb-4" :loading="loadingData"/>
                </div>
              </div>
          </div>

          <div v-if="!rail && (accessRequests || pendingRequests)">
            <v-icon class="informative-text">mdi-account-reactivate-outline</v-icon>
            <span class="informative-text" style="margin-left: -0.4em;">Gestion des accès</span>
            <div class="mt-2" v-if="accessRequests">
              <AccessRequests :access-requests="accessRequests" />
              </div>
              <div v-if="pendingRequests">
                <PendingRequests :pending-requests="pendingRequests"/>
              </div>
          </div>

          <div v-if="!rail" class="mt-0">
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
            <span class="informative-text" style="margin-left: -0.4em;">Compte entreprise</span>
            <AccountModal 
              @refresh-parent="fetchData"
            />
            <HandleAccount />
            <SelectDatabaseCompany
              v-if="selectedCompany"
              :loading="loading"
              :selected-company="selectedCompany"
              @updateLoading="updateLoading($event)"
              origin="menu" 
            />
            <SendAccessRequest 
              @refresh="fetchData"
            />
            <div v-if="!rail" class="mt-1">
              <v-icon class="informative-text">mdi-database-plus-outline</v-icon>
              <span class="informative-text" style="margin-left: -0.4em;">Ajout de données</span>
            </div>
          </span>
   
          <div 
            v-if="!rail"
          >
           <DataAddingModal @refresh="fetchData" />
          </div>

          <span v-if="!rail">
            <v-icon class="informative-text">mdi-account-outline</v-icon>
            <span class="informative-text" style="margin-left: -0.4em;">Session utilisateur</span>
            <div class="informative-text" style="margin-left: 0em; padding-left: 0em;">
              <v-chip class="ml-2" variant="elevated" color="blue">
                <v-icon class="mr-1">mdi-account-outline</v-icon>
                {{ userEmail }}
              </v-chip>

            </div>
            <v-list variant="elevated" density="compact" nav style="width: 100%;">
              
                <v-list-item @click="logoutUser()" style="display: flex;" nav>
                    <div class="aligner">
                        <v-list-item-icon>
                        <v-icon class="mr-1">mdi-logout</v-icon>
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
            <v-chip :variant="(accessRequests && accessRequests.length === 0) ? 'outlined' : 'elevated'" :elevation="(accessRequests && accessRequests.length === 0) ? 0 : 4" @click="rail = true" :color="(accessRequests && accessRequests.length === 0) ? 'secondary' : 'warning'">
              <v-icon>mdi-account-multiple-check-outline</v-icon>
              <span v-if="accessRequests && accessRequests.length > 0"><strong>{{ accessRequests.length }}</strong></span>
              <span v-else>{{ accessRequests.length }}</span>
            </v-chip>
            <!-- Pending Requests -->
            <v-chip class="mt-2" @click="rail = true" :variant="(pendingRequests && pendingRequests.length === 0) ? 'outlined' : 'elevated'" :elevation="(pendingRequests && pendingRequests.length === 0) ? 0 : 4" :color="(pendingRequests && pendingRequests.length === 0) ? 'secondary' : 'blue'">
              <v-icon>mdi-account-clock-outline</v-icon>
              <span v-if="pendingRequests && pendingRequests.length > 0"><strong>{{ pendingRequests.length }}</strong></span>
              <span v-else>{{ pendingRequests.length }}</span>
            </v-chip>
          </div>
          </template>
        </v-navigation-drawer>
      </v-layout>
    </v-card>
</template>

<style lang="scss" scoped>
@import url(../assets/main.scss);

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
  background-color: white;
  position: fixed; 
  font-size: 0.9em; 
  top: 0; 
  right: 0; 
  z-index: 2; 
  padding: 8px 12px;
  border-radius: 0 0 0 10px; 
}
</style>
