<script setup>
import { ref, watch } from 'vue';

// Emits for parent communication
const emit = defineEmits(['updateSnackbar']);

// Props for configuration
const props = defineProps({
  alertText: String,
  snackbar: Boolean,
  alertType: String,
  visibilityTime: Number,
});

// Local state
const snackbarState = ref(props.snackbar);

// Watch for prop changes to sync the state
watch(
  () => props.snackbar,
  (newVal) => {
    snackbarState.value = newVal;
    if (newVal) startAutoCloseTimer();
  }
);

// Watch for local state changes to emit updates
watch(snackbarState, (newVal) => {
  emit('updateSnackbar', newVal);
});

// Handle auto-closing
let autoCloseTimeout = null;
function startAutoCloseTimer() {
  if (autoCloseTimeout) clearTimeout(autoCloseTimeout);

  if (props.visibilityTime > 0) {
    autoCloseTimeout = setTimeout(() => {
      snackbarState.value = false;
    }, props.visibilityTime);
  }
}

// Handle manual close
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