<script setup>
// Components
import apiCaller from '@/services/apiCaller';
import { defineEmits } from 'vue';

const emit = defineEmits('refreshUsers')

const props = defineProps({
    selectedCompanyId: {
        type: Number,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    }
})

async function rejectUserAccess() {
    const response = await apiCaller.patch(`accounts/${props.userId}/companies/${props.selectedCompanyId}/reject`)
    emit('refreshUsers')
}
</script>

<template>
      <v-dialog class="secundary-dialog-width">
         <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                variant="outlined"
                color="red"
            >
                <v-icon class="mr-2">mdi-delete-outline</v-icon>
                <span v-if="props.email !== props.userEmail">Révoquer l'accès</span>
                <span v-else>Révoquer votre propre accès</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <v-card-title v-if="props.email !== props.userEmail">REVOQUER UN ACCES</v-card-title>
                    <v-card-title v-else>REVOQUER VOTRE PROPRE ACCES</v-card-title>
                    <v-divider style="margin: 0em 1em;"></v-divider>
                    <div class="mt-2 mb-2" style="padding: 0.4em 1em">
                        Souhaitez vous révoquer l'accès du compte 
                        <v-chip variant="outlined" color='blue'>
                            <v-icon class="mr-1">mdi-account-outline</v-icon>
                            {{ props.email }}
                        </v-chip>
                        <span class="ml-1" v-if="props.email === props.userEmail">(qui est votre propre compte)</span>
                        aux données de la société {{ props.companyName }} ?
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
                            text="REVOQUER"
                            @click="rejectUserAccess(); isActive.value = false"
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