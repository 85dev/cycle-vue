<script setup>
import { onMounted, ref } from 'vue'
import router from '@/router';
import sessionStore from '../stores/sessionStore.js'
import Logo from '@/assets/img/cycle_app.svg'

// Components import
import CreateClient from '@/components/modals/CreateClient.vue'
import CreateSupplier from '@/components/modals/CreateSupplier.vue'
import CreatePart from '@/components/modals/CreatePart.vue';
import CreateSubcontractor from './modals/CreateSubcontractor.vue';
import CreateLogisticPlace from './modals/CreateLogisticPlace.vue';

const userId = ref(null)
const userEmail = ref(null)
const drawer = ref(true)
const rail = ref(true)

const selectedIndex = ref(0);

function routeToItem(index, path) {
  selectedIndex.value = index; // Update the active index
  router.push(path); // Navigate to the selected path
}

function logoutUser() {
  sessionStore.actions.resetUserInfo()
  router.push('/login')
}

const items = ref([
  { title: 'Tableau de bord', icon: 'mdi-gesture-double-tap', path: '/dashboard' },
  { title: 'Gestion des expéditions', icon: 'mdi-ferry', path: '/expeditions' },
  { title: 'Catalogue des pièces', icon: 'mdi-database-outline', path: '/parts' },
  // { title: 'Liste des clients', icon: 'mdi-account-tie', path: '/clients' },
  // { title: 'Liste des fournisseurs', icon: 'mdi-cube-send', path: '/suppliers' },
  // { title: 'Liste des sous-traitants', icon: 'mdi-account-wrench-outline', path: '/subcontractors' },
  // { title: 'Liste des lieux de logistique', icon: 'mdi-truck-delivery-outline', path: '/logistic-places' }
]);

onMounted(() => {
    sessionStore.actions.initializeAuthState();  // Load user and auth token from localStorage
    userEmail.value = sessionStore.getters.getUserEmail();

    if (userId.value === 0) {
      router.push('/login')
    }
})

</script>

<template>
    <v-card>
      <v-layout>
        <v-navigation-drawer
          v-model="drawer"
          :rail="rail"
          permanent
          @click="rail = false"
        >

          <div class="aligner">
            <img :src="Logo" style="margin: 0.6em 0em;" :style="!rail ? 'width: 60px' : 'width: 36px'"/>
          </div>
          <v-list-item
            title="Menu - Cycle App v0.1.1"
            nav
          >
            <template v-slot:append>
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                @click.stop="rail = !rail"
              ></v-btn>
            </template>
          </v-list-item>

          <v-divider style="margin-bottom: 0.4em;"></v-divider>

          <div v-if="!rail">
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

          <div v-if="!rail">
            <v-icon class="informative-text">mdi-database-plus-outline</v-icon>
            <span class="informative-text" style="margin-left: -0.4em;">Ajout de données</span>
          </div>
   
          <div 
            v-if="!rail"
            style="display: flex; flex-direction: column; align-items: flex-start;"
          >
            <CreatePart :origin="'menu'"></CreatePart>
            <CreateClient :origin="'menu'"></CreateClient>
            <CreateSupplier :origin="'menu'"></CreateSupplier>
            <CreateSubcontractor :origin="'menu'"></CreateSubcontractor>
            <CreateLogisticPlace :origin="'menu'"></CreateLogisticPlace>
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
</style>
