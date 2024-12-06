<script setup>
// Vue built-in functions
import { toRefs, toRef } from 'vue'

// Function to send to the parent components
const emit = defineEmits(['updateSnackbar'])
let timeout = null;

const props = defineProps({
  alertText: String,
  snackbar: Boolean,
  alertType: String,
  visibilityTime: Number
})

// Declare dynamic variables from props
const snackbar = toRef(props, 'snackbar')
const { alertText } = toRefs(props);

function handleIcon(alert) {
  switch (alert) {
    case 'error':
      return 'mdi-error';
    case 'warning':
      return 'mdi-warning';
    case 'success':
      return 'mdi-check-circle';
    default:
      console.log('issue for :' + alert);// Default case
  }
}

// Handle visibility time of the snackbar
function visibility() {

  timeout !== null ? clearTimeout(timeout) : undefined;

  timeout = setTimeout(() => {
    emit('updateSnackbar', !snackbar.value)
    // By default, snackbar apparition lasts 5 seconds
  }, props.visibilityTime ? props.visibilityTime : 5000)
}
</script>

<template class="text-center">
    <v-snackbar
      v-model="snackbar"
      :style="visibility()"
      :color="props.alertType"
      multi-line
    >
      {{ alertText }} 
      <v-icon>{{ handleIcon(props.alertType) }}</v-icon>
      <template v-slot:actions>
        <v-btn
          color="white"
          icon
          @click="$emit('updateSnackbar', !snackbar)"
        >
          <v-icon>mdi-close-thick</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </template>