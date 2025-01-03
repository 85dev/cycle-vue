<script setup>
import { ref, defineEmits } from 'vue';
import dateConverter from '@/services/dateConverter'
import { pendingRequestsHeaders } from '@/models/tableHeaders';
import CardTitle from '../CardTitle.vue';

const props = defineProps({
    pendingRequests: {
        type: Array
    },
})

</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip :variant="(pendingRequests && pendingRequests.length === 0) ? 'outlined' : 'elevated'" v-bind="activatorProps" class="ml-2 mb-2" :color="(pendingRequests && pendingRequests.length === 0) ? 'secondary' : 'warning' ">
                <v-icon class="mr-2">mdi-account-clock-outline</v-icon>
                {{ pendingRequests.length }} demande(s) en attente
              </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle
                        title="Demande(s) d'accès à d'autres sociétés"
                        icon="mdi-clock-outline"
                    />
                    <v-divider style="margin: 0em 1em;"></v-divider>
                    <v-card class="pa-4">
                        <v-data-table
                            density="comfortable"
                            no-data-text="Aucune demande enregistrée"
                            :items="props.pendingRequests"
                            :headers="pendingRequestsHeaders"
                        >
                        <template v-slot:item.company_name="{ item }">
                            <v-chip variant="elevated">
                                <v-icon class="mr-2">mdi-office-building</v-icon>
                                {{ item.company_name }}
                            </v-chip> 
                        </template>
                        <template v-slot:item.requested_owner_rights="{ item }">
                            <v-chip
                                :variant="'elevated'"
                                :color="item.requested_owner_rights ? 'warning' : 'blue'"
                            >
                                <v-icon class="mr-2">{{ item.requested_owner_rights ? 'mdi-account-key-outline' : 'mdi-account-child-outline' }}</v-icon>
                                {{ item.requested_owner_rights ? 'Propriétaire' : 'Non-propriétaire' }}
                            </v-chip>
                        </template>
                        <template v-slot:item.created_at="{ item }">
                            <v-chip variant="elevated" color="blue">
                                <v-icon class="mr-2">mdi-clock-outline</v-icon>
                                {{ dateConverter.formatReadableDate(item.created_at) }}
                            </v-chip> 
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