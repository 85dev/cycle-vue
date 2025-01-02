<script setup>
import { toRef } from 'vue';

const props = defineProps({
    loading: { type: Boolean, required: true },
    text: { type: String }
})

const loading = toRef(props, 'loading')
</script>

<template>
   <v-overlay
      persistent
      v-model="loading"
      class="container align-center justify-center"
   >
      <v-card
         width="300"
         class="pa-4 d-flex flex-column align-center justify-center"
      >
      <div class="spinner mt-4"/>
      <span v-if="!props.text" class="informative-text mt-12 mb-2">
         Chargement des données...
      </span>
      <span v-else class="informative-text mt-12 mb-2">
         {{ props.text }}
      </span>
      </v-card>
  </v-overlay>
</template>

<style scoped lang="scss">
@import "../assets/main.scss";

.spinner {
    width: 6em;
    height: 6em;
    border-radius: 50%;
    border: 6px solid rgb(0,138,216);
    animation: spinner-bulqg1 0.8s infinite linear alternate,
            spinner-oaa3wk 1.6s infinite linear;
}

@keyframes spinner-bulqg1 {
   0% {
      clip-path: polygon(50% 50%, 0 0, 50% 0%, 50% 0%, 50% 0%, 50% 0%, 50% 0%);
   }

   12% {
      clip-path: polygon(50% 50%, 0 0, 50% 0%, 100% 0%, 100% 0%, 100% 0%, 100% 0%);
   }

   25% {
      clip-path: polygon(50% 50%, 0 0, 50% 0%, 100% 0%, 100% 100%, 100% 100%, 100% 100%);
   }

   50% {
      clip-path: polygon(50% 50%, 0 0, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%);
   }

   62% {
      clip-path: polygon(50% 50%, 100% 0, 100% 0%, 100% 0%, 100% 100%, 50% 100%, 0% 100%);
   }

   75% {
      clip-path: polygon(50% 50%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 50% 100%, 0% 100%);
   }

   100% {
      clip-path: polygon(50% 50%, 50% 100%, 50% 100%, 50% 100%, 50% 100%, 50% 100%, 0% 100%);
   }
}

@keyframes spinner-oaa3wk {
   0% {
      transform: scaleY(1) rotate(0deg);
   }

   49.99% {
      transform: scaleY(1) rotate(135deg);
   }

   50% {
      transform: scaleY(-1) rotate(0deg);
   }

   100% {
      transform: scaleY(-1) rotate(-135deg);
   }
}
</style>