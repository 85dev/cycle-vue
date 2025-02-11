<script setup>
// Vue essentials
import { ref, defineEmits } from 'vue';

// Headers & services
import { accessRequestsHeaders } from '@/models/tableHeaders'
import { getStatusRequestColor, getStatusRequestIcon, formatStatusRequest } from '@/services/textIconServices';
import CardTitle from '../CardTitle.vue';
import ValidateRequest from './ValidateRequest.vue';

const props = defineProps({
    accessRequests: {
        type: Array
    },
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip :variant="(accessRequests && accessRequests.length === 0) ? 'outlined' : 'elevated'" :elevation="(accessRequests && accessRequests.length === 0) ? 0 : 4" v-bind="activatorProps" class="ml-2 mb-2" :color="(accessRequests && accessRequests.length === 0) ? 'secondary' : 'warning' ">
                <v-icon class="mr-2">mdi-account-multiple-check-outline</v-icon>
                {{ accessRequests.length }} demande(s) à valider
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle
                        title="Demande(s) d'accès à valider"
                        icon="mdi-account-check-outline"
                    />
                    <v-divider style="margin: 0em 1em;"></v-divider>
                    <v-card class="pa-4">
                        <v-data-table
                            density="comfortable"
                            no-data-text="Aucune demande enregistrée"
                            :items="props.accessRequests"
                            :headers="accessRequestsHeaders"
                        >
                        <template v-slot:item.company_name="{ item }">
                            <v-chip variant="elevated" color="white">
                                <v-icon class="mr-2">mdi-office-building</v-icon>
                                {{ item.company_name }}
                            </v-chip> 
                        </template>
                        <template v-slot:item.requester_email="{ item }">
                            <v-chip variant="text">
                                <v-icon class="mr-2">mdi-email-lock-outline</v-icon>
                                {{ item.requester_email }}
                            </v-chip> 
                        </template>
                        <template v-slot:item.requested_owner_rights="{ item }">
                            <v-chip
                                variant="outlined"
                                :color="item.requested_owner_rights ? 'warning' : 'blue'"
                            >
                                <v-icon class="mr-2">{{ item.requested_owner_rights ? 'mdi-account-key-outline' : 'mdi-account-child-outline' }}</v-icon>
                                {{ item.requested_owner_rights ? 'Propriétaire' : 'Non-propriétaire' }}
                            </v-chip>
                        </template>
                        <template v-slot:item.request_status="{ item }">
                            <v-chip
                                :variant="'elevated'"
                                :color="getStatusRequestColor(item.request_status)"
                            >
                                <v-icon class="mr-2">{{ getStatusRequestIcon(item.request_status) }}</v-icon>
                                {{ formatStatusRequest(item.request_status) }}
                            </v-chip>
                        </template>
                        <template v-slot:item.actions="{ item }">
                            <div class="actions-slot">
                                <ValidateRequest :access-request="item"/>
                            </div>  
                        </template>
                        </v-data-table>
                    </v-card>
                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            variant="tonal"
                            text="FERMER"
                            @click="isActive.value = false"
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