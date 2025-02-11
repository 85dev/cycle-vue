<script setup>
// Vue essentials
import { ref, computed, defineEmits } from 'vue'

// Services
import apiCaller from '@/services/apiCaller';

// Components
import CardTitle from '../CardTitle.vue';
import Popup from '../Popup.vue';
import SpinnLoader from '../SpinnLoader.vue';

const emit = defineEmits('resetSuccess')
const loading = ref(false)
const userEmail = ref(null)
const accessCode = ref(null)
const newPassword = ref(null)
const newPasswordConfirmation = ref(null)
const step = ref(1)
const stepperHeaders = ref(['Envoi du code', 'Saisie du code', 'Réinitialisation'])

const showPassword = ref(false)
const showConfirmation = ref(false)
const snackbarVisible = ref(false);
const snackbarMessage = ref('');
const snackbarType = ref('');

const emailValidation = ref(false)

const isEmailValid = computed(() => {
    return getEmailRules().every(rule => rule(userEmail.value) === true);
});

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
  (v) => v === newPassword.value || 'Les mots de passe doivent correspondre',
];

const getPasswordRules = () => [
  (v) => !!v || 'Mot de passe requis',
  (v) => v.length >= 10 || 'Le mot de passe doit contenir au moins 10 caractères',
  (v) => /[!@#$%^&*]/.test(v) || 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)',
];

async function sendEmail() {
    await onResetPasswordRequest()

    if (emailValidation.value) {
        loading.value = true
        setTimeout(async () => {
            const response = await apiCaller.post('users/request_user_access_code', { email: userEmail.value })
            if (response.ok) {
                triggerSnackbar('Code de réinitialisation envoyé', 'success');
                step.value++;
            } else {
                triggerSnackbar('Échec de l\'envoi du code de réinitialisation', 'warning');
            }
            loading.value = false
        }, 600)
    }
}

async function validateCode() {
    loading.value = true
    setTimeout(async () => {
        const response = await apiCaller.post('users/verify_access_code', { access_code: accessCode.value, email: userEmail.value  })
        if (response.ok) {
            triggerSnackbar('Code de réinitialisation validée', 'success');
            step.value ++ 
        } else {
            triggerSnackbar('Code de réinitialisation invalide', 'warning');
        }
        loading.value = false
    }, 600)
}

const resetValid = computed(() => {
    if (newPassword.value) {
        const isPasswordValid = 
        newPassword.value.length >= 10 &&
        /[!@#$%^&*]/.test(newPassword.value)
        const isConfirmPasswordValid = newPassword.value === newPasswordConfirmation.value;

        return isPasswordValid && isConfirmPasswordValid;
    } else {
        return false
    }
});

async function checkEmailExists() {
  try {
    const response = await apiCaller.get(`users/check_email?email=${userEmail.value}`);
    emailValidation.value = response.exists
    return emailValidation.value;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}

async function onResetPasswordRequest() {
  const emailExists = await checkEmailExists();
  if (!emailExists) {
    triggerSnackbar('Email non trouvé dans la base de données', 'warning');
    return;
  }
}

async function submitNewPassword() {   
    loading.value = true 
    setTimeout(async() => {
        const payload = {
            email: userEmail.value,
            access_code: accessCode.value,
            new_password: newPassword.value
        };

        const response = await apiCaller.post(`users/reset_password`, payload);
        emit('resetSuccess', response)

        loading.value = false 
    }, 600);
}
</script>

<template>
      <v-dialog class="dialog-width">
         <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                variant="text"
                color="secondary"
            >
                <v-icon class="mr-2">mdi-account-alert-outline</v-icon>
                Mot de passe oublié
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <Popup
                :alertText="snackbarMessage"
                :snackbar="snackbarVisible"
                :alertType="snackbarType"
                @updateSnackbar="(value) => (snackbarVisible = value)"
            />
            <SpinnLoader :loading="loading" />
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.8em;">
                    <CardTitle 
                        title="Réinitialiser votre mot de passe"
                        icon="mdi-sync"
                    />
                    <v-stepper
                        v-model="step"
                        hide-actions
                        :items="stepperHeaders"
                    >
                        <template v-slot:item.1>
                            <v-card>
                                <CardTitle 
                                    title="Envoi du code d'accès par email"
                                    icon="mdi-mail"
                                />
                                <v-form class="mr-6 ml-6">
                                    <v-text-field
                                        :rules="getEmailRules()"
                                        variant="underlined"
                                        v-model="userEmail"
                                        label="Email"
                                        type="email"
                                        required
                                        clearable
                                    />
                                </v-form>
                                <div class="d-flex align-center justify-center mb-2">
                                    <v-chip :disabled="!isEmailValid" variant="elevated" @click="sendEmail()" color="white">
                                        <v-icon class="mr-2">mdi-email-fast-outline</v-icon>
                                        Envoyer le code
                                    </v-chip>
                                </div>     
                            </v-card>
                        </template>

                        <template v-slot:item.2>
                            <v-card>
                                <CardTitle 
                                    title="Saisie du code d'accès"
                                    icon="mdi-mail"
                                />
                                <v-form class="mr-6 ml-6">
                                    <v-text-field
                                        variant="underlined"
                                        v-model="accessCode"
                                        label="Code d'accès à 6 chiffres"
                                        type="digit"
                                        required
                                        clearable
                                    />
                                </v-form>
                                <div class="d-flex align-center justify-center mb-2">
                                    <v-chip variant="elevated" @click="validateCode()" color="success">
                                        <v-icon class="mr-2">mdi-check-circle-outline</v-icon>
                                        Valider
                                    </v-chip>
                                </div>     
                            </v-card>
                        </template>

                        <template v-slot:item.3>
                            <v-card>
                                <CardTitle 
                                    title="Réinitialisation du mot de passe"
                                    icon="mdi-lock-reset"
                                />
                                <v-form>
                                    <v-text-field
                                        :rules="getPasswordRules()"
                                        variant="underlined"
                                        v-model="newPassword"
                                        label="Nouveau mot de passe"
                                        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                                        @click:append="() => (showPassword = !showPassword)"
                                        :type="showPassword ? 'text' : 'password'"
                                        required
                                        clearable
                                    ></v-text-field>

                                    <v-text-field
                                        :rules="getConfirmPasswordRules()"
                                        variant="underlined"
                                        v-model="newPasswordConfirmation"
                                        label="Confirmer le nouveau mot de passe"
                                        :append-icon="showConfirmation ? 'mdi-eye' : 'mdi-eye-off'"
                                        @click:append="() => (showConfirmation = !showConfirmation)"
                                        :type="showConfirmation ? 'text' : 'password'"
                                        required
                                        clearable
                                    ></v-text-field>
                                </v-form>

                                <div class="d-flex align-center justify-center mt-2 mb-2">
                                    <v-chip
                                    variant="elevated"
                                    :disabled="!resetValid"
                                    color="success"
                                    @click="submitNewPassword(); isActive.value = false"
                                    >
                                        <v-icon class="mr-2">mdi-check</v-icon>
                                        Confirmer le nouveau mot de passe
                                    </v-chip>
                                </div>
                                
                            </v-card>
                        </template>
                    </v-stepper>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

</style>