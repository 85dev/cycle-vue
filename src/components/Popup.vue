<script setup>
import { ref, watch } from 'vue';

const emit = defineEmits(['updateSnackbar']);

const props = defineProps({
  alertText: String,
  snackbar: Boolean,
  alertType: String,
  visibilityTime: Number,
});

const snackbarState = ref(props.snackbar);

watch(
  () => props.snackbar,
  (newVal) => {
    snackbarState.value = newVal;
    if (newVal) startAutoCloseTimer();
  }
);

watch(snackbarState, (newVal) => {
  emit('updateSnackbar', newVal);
});

let autoCloseTimeout = null;
function startAutoCloseTimer() {
  if (autoCloseTimeout) clearTimeout(autoCloseTimeout);

    autoCloseTimeout = setTimeout(() => {
      snackbarState.value = false;
    }, props.visibilityTime ? props.visibilityTime : 5000);
}

function closeSnackbar() {
  snackbarState.value = false;
}
</script>

<template>
  <v-snackbar
    v-model="snackbarState"
    elevation="24"
    :color="props.alertType"
    multi-line
  >
    <div class="informative-text-m" style="color: white">{{ alertText }}</div>

    <template v-slot:actions>
      <v-btn
        color="white"
        icon
        variant="text"
        @click="closeSnackbar"
      >
        <v-icon>mdi-close-thick</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>