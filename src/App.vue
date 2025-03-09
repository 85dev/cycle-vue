<script setup>
import { RouterView } from 'vue-router'
import sessionStore from './stores/sessionStore';

import SessionBar from './components/SessionBar.vue';
import { onMounted, computed } from 'vue';
import router from './router';

const userId = computed(() => { return sessionStore.getters.getUserID() })
const authToken = computed(() => { return sessionStore.getters.getAuthToken() })

onMounted(() => {
  userId.value = sessionStore.getters.getUserID()
  authToken.value = sessionStore.getters.getAuthToken()

  if (userId.value && authToken.value) {
    sessionStore.actions.loginUserWithToken(authToken.value)
  } else {
    sessionStore.actions.resetUserInfo()
    router.push('/login')
  }
})
</script>

<template>
  <RouterView />
  <SessionBar v-if="userId"></SessionBar>
</template>
