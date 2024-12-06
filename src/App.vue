<script setup>
import { RouterView } from 'vue-router'
import sessionStore from './stores/sessionStore';

import SessionBar from './components/SessionBar.vue';
import { computed } from 'vue';

const userId = computed(() => sessionStore.getters.getUserID());
</script>

<template>
  <RouterView />
  <SessionBar v-if="userId"></SessionBar>
</template>
