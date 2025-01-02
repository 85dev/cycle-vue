<script setup>
// Components
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import SpinnLoader from '../SpinnLoader.vue';

// Services
import { ref, defineEmits, onMounted } from 'vue';

const props = defineProps({
    accessRequest: {
        type: Object,
        required: true
    },
})
const loading = ref(false)
const userId = ref(0)

async function acceptAccessRequest() {
    await apiCaller.patch(`accounts/${props.accessRequest.account_id}/users/${userId.value}/validate_access_request`)

    loading.value = true
    setTimeout(() => {
        sessionStore.actions.fetchAccessRequestAccounts()
        loading.value = false
    }, 1200);
}

onMounted(async() => {
    userId.value = sessionStore.getters.getUserID()
})
</script>

<template>
    <SpinnLoader :loading="loading" text="Validation de l'accès"></SpinnLoader>
      <v-dialog class="secundary-dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                variant="text"
                color="blue"
            >
                <v-icon class="mr-2">mdi-account-multiple-plus</v-icon>
                Accepter
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <v-card-title>VALIDER L'ACCES</v-card-title>
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <div class="mt-2 mb-2" style="padding: 0.4em 1em">
               
                        Souhaitez vous valider l'accès de
                        <v-chip variant="outlined" color='blue'>
                            <v-icon class="mr-1">mdi-account-outline</v-icon>
                            {{ props.accessRequest.requester_email }}
                        </v-chip>
                        aux données de la société <strong>{{ props.accessRequest.company_name }}</strong> ?
                    </div>

                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            variant="tonal"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>

                        <v-btn
                            variant="elevated"
                            color="success"
                            text="VALIDER"
                            @click="acceptAccessRequest(); isActive.value = false"
                        ></v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

</style>