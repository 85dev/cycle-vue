<script setup>
import { ref, computed } from 'vue'
import sessionStore from '../stores/sessionStore.js' // Import the new store
import SpinnLoader from '@/components/SpinnLoader.vue';
import Popup from '@/components/Popup.vue';

// Form input states
const signUpEmail = ref('')
const signUpPassword = ref('')
const confirmPassword = ref('');
const loginEmail = ref('')
const loginPassword = ref('')
const toggleMenu = ref(false)
const showLoginPassword = ref(false)
const showSignUpPassword = ref(false)
const showConfirmPassword = ref(false);
const loading = ref(false)
const snackbarVisible = ref(false);
const snackbarMessage = ref('');
const snackbarType = ref('');

// Function to trigger the snackbar
function triggerSnackbar(message, type) {
  snackbarMessage.value = message;
  snackbarType.value = type;
  snackbarVisible.value = true;
}

const getEmailRules = () => [
  (v) => !!v || 'Email requis',
  (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email invalide'
];

const getConfirmPasswordRules = () => [
  (v) => !!v || 'Confirmation requise',
  (v) => v === signUpPassword.value || 'Les mots de passe doivent correspondre',
];

const getPasswordRules = () => [
  (v) => !!v || 'Mot de passe requis',
  (v) => v.length >= 10 || 'Le mot de passe doit contenir au moins 10 caractères',
  (v) => /[!@#$%^&*]/.test(v) || 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)',
];

const isSignUpValid = computed(() => {
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail.value);
  const isPasswordValid = 
    signUpPassword.value.length >= 10 &&
    /[!@#$%^&*]/.test(signUpPassword.value);
  const isConfirmPasswordValid = signUpPassword.value === confirmPassword.value;

  return isEmailValid && isPasswordValid && isConfirmPasswordValid;
});

// Methods for signup, login, and reset
async function onSignUp(event) {
  event.preventDefault()
  const data = {
    user: {
      email: signUpEmail.value,
      password: signUpPassword.value,
    },
  }
  try {
    sessionStore.actions.registerUser(data)
  } catch (error) {
    console.error(error)
  }
}

function toggleHandler() {
  toggleMenu.value = !toggleMenu.value
}

async function onLogin(event) {
  event.preventDefault()
  const data = {
    user: {
      email: loginEmail.value,
      password: loginPassword.value,
    },
  }
  try {
    const response = await sessionStore.actions.loginUser(data);

    if (response !== undefined) {
      triggerSnackbar('Email ou mot de passe incorrect', 'warning'); // Trigger success snackbar
    } else {
      triggerSnackbar('Email ou mot de passe incorrect', 'warning'); // Trigger error snackbar
    }
  } catch (error) {
    console.error('Login failed:', error);
    triggerSnackbar('An unexpected error occurred.', 'error'); // Handle unexpected errors
  }
}
</script>

<template>
    <Popup
      :alertText="snackbarMessage"
      :snackbar="snackbarVisible"
      :alertType="snackbarType"
      @updateSnackbar="(value) => (snackbarVisible = value)"
    />
  <SpinnLoader :loading="loading" text="Connexion..."/>
  <div class="toggle-container">
      <!-- Sign Up Form -->
      <v-card class="login-menu">
        <img src="../assets/img/cycle_app.svg" style="height: 160px; margin: 2em 0em;"/>
        <div v-if="toggleMenu" class="aligner">
          <span class="informative-text-l" style="margin-bottom: 1em;">Inscription</span>
          <v-form @submit.prevent="onSignUp" class="form-container">
            <v-text-field
              variant="underlined"
              class="field-input"
              v-model="signUpEmail"
              :rules="getEmailRules()"
              label="Email"
              type="email"
              required
            ></v-text-field>
            <v-text-field
              variant="underlined"
              class="field-input"
              :rules="getPasswordRules()"
              v-model="signUpPassword"
              label="Mot de passe"
              :append-icon="showSignUpPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="() => (showSignUpPassword = !showSignUpPassword)"
              :type="showSignUpPassword ? 'text' : 'password'"
              required
            ></v-text-field>
            <v-text-field
              variant="underlined"
              class="field-input"
              v-model="confirmPassword"
              :rules="getConfirmPasswordRules()"
              label="Confirmer le mot de passe"
              :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="() => (showConfirmPassword = !showConfirmPassword)"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
          ></v-text-field>
            <v-btn variant="elevated" :disabled="!isSignUpValid" type="submit" @click="onSignUp" style="margin-bottom: 1em;">
              <v-icon class="mr-1">mdi-account-plus-outline</v-icon>
              S'inscrire
            </v-btn>
          </v-form>
        </div>

        <!-- Login Form -->
        <div v-else class="aligner">
          <span class="informative-text-l" style="margin-bottom: 1em;">Connexion</span>
          <v-form @submit.prevent="onLogin" class="form-container">
            <v-text-field
              variant="underlined"
              class="field-input"
              v-model="loginEmail"
              label="Email"
              type="email"
              required
            ></v-text-field>
            <v-text-field
              variant="underlined"
              class="field-input"
              v-model="loginPassword"
              label="Mot de passe"
              :append-icon="showLoginPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="() => (showLoginPassword = !showLoginPassword)"
              :type="showLoginPassword ? 'text' : 'password'"
              required
            ></v-text-field>
            <v-btn variant="elevated" :disabled="loginPassword === '' || loginEmail === ''" @click="onLogin" style="margin-bottom: 1em;">
              <v-icon class="mr-1">mdi-account-arrow-right-outline</v-icon>
              Se connecter
            </v-btn>
          </v-form>
        </div>
      </v-card>

      <span style="margin-top: 1em; color: white">{{ toggleMenu ? 'Déjà inscrit ?' : "Pas encore inscrit ?" }}</span>
      <v-chip variant="elevated" style="margin-top: 1em; display: flex; justify-content: center; align-items: center;" @click="toggleHandler">
        {{ toggleMenu ? 'Se connecter' : "S'inscrire" }}
      </v-chip>

  </div>
</template>

<style scoped lang="scss">
@import url(../assets/main.scss);

.toggle-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Centers the content */
  margin: 0 auto;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.form-container {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.login-menu {
  margin-top: 1em;
  width: 350px;
  padding: 6px 12px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.field-input {
  width: 300px;
}

.aligner {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}
</style>