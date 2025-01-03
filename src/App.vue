<script setup>
import { RouterView } from 'vue-router'
import sessionStore from './stores/sessionStore';

import SessionBar from './components/SessionBar.vue';
import { onMounted, computed } from 'vue';
import router from './router';

const userId = computed(() => { return sessionStore.getters.getUserID()})

onMounted(() => {
  userId.value = sessionStore.getters.getUserID()

  if (userId.value) {
    sessionStore.actions.loginUserWithToken()
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
