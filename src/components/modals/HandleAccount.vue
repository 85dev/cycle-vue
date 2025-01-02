<script setup>
// Components
import RejectAccess from './RejectAccess.vue';

// Services
import apiCaller from '@/services/apiCaller';
import sessionStore from '@/stores/sessionStore';
import { handleAccountHeaders } from '@/models/tableHeaders';
import { getStatusRequestColor, getStatusRequestIcon, formatStatusRequest } from '@/services/textIconServices';
import dateConverter from '@/services/dateConverter'
import { ref, onMounted } from 'vue';
import CardTitle from '../CardTitle.vue';

const accounts = ref([])
const selectedCompany = ref(null)
const isOwner = ref(false)
const userEmail = ref(null)

async function fetchUsers() {
    const response = await apiCaller.get(`companies/${selectedCompany.value.id}/users`)
    accounts.value = response
}

onMounted(async() => {
    isOwner.value = sessionStore.getters.isOwner()
    userEmail.value = sessionStore.getters.getUserEmail()
    selectedCompany.value = sessionStore.getters.getSelectedCompany()

    await fetchUsers()
})
</script>

<template>
      <v-dialog class="dialog-width">
         <template v-slot:activator="{ props: activatorProps }">
            <v-list variant="elevated" density="compact" nav style="width: 100%; transition: all 0.2s; margin-top: -0.8em;">
                    <v-list-item color="blue" v-bind="activatorProps" style="display: flex;" nav>
                        <div class="aligner">
                            <v-list-item-icon>
                            <v-icon style="margin-right: 0.4em;">mdi-account-box-multiple-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-title style="margin-right: 0.2em;">Gérer les utilisateurs</v-list-item-title>
                        </div>
                    </v-list-item>                
                </v-list>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle
                        :title="`Gérer les accès de la société ${selectedCompany.name}`"
                        icon="mdi-package-variant-closed-check"
                    />
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <v-data-table
                        :items="accounts"
                        :headers="handleAccountHeaders"
                    >
                        <template v-slot:item.user_email="{ item }">
                            <v-chip variant="elevated" color="blue">
                                <v-icon class="mr-2">mdi-email-outline</v-icon>
                                {{ item.user_email }}
                            </v-chip> 
                        </template>
                        <template v-slot:item.is_owner="{ item }">
                            <v-chip
                                :variant="'elevated'"
                                :color="item.is_owner ? 'warning' : 'blue'"
                            >
                                <v-icon class="mr-2">{{ item.is_owner ? 'mdi-account-key-outline' : 'mdi-account-child-outline' }}</v-icon>
                                {{ item.is_owner ? 'Propriétaire' : 'Non-propriétaire' }}
                            </v-chip>
                        </template>
                        <template v-slot:item.account_status="{ item }">
                            <v-chip
                                :variant="'elevated'"
                                :color="getStatusRequestColor(item.account_status)"
                            >
                                <v-icon class="mr-2">{{ getStatusRequestIcon(item.account_status) }}</v-icon>
                                {{ formatStatusRequest(item.account_status) }}
                            </v-chip>
                        </template>
                        <template v-slot:item.account_created_at="{ item }">
                            <v-chip variant="elevated" color="blue">
                                <v-icon class="mr-2">mdi-clock-outline</v-icon>
                                {{ dateConverter.formatReadableDate(item.account_created_at) }}
                            </v-chip> 
                        </template>
                        <template v-slot:item.actions="{ item }">
                            <div class="actions-slot">
                                <div v-if="selectedCompany && isOwner">
                                    <RejectAccess 
                                        v-if="item.account_status !== 'rejected'"
                                        :user-id="item.user_id"
                                        :email="item.user_email"
                                        :user-email="userEmail"
                                        :selected-company-id="selectedCompany.id"
                                        :company-name="selectedCompany.name"
                                        @refresh-users="fetchUsers()"
                                    />
                                </div>
                                <div v-if="item.account_status === 'rejected'">
                                    <v-chip variant="text" color="red">
                                        <v-icon class="mr-2">mdi-alert-octagon-outline</v-icon>
                                        Accès déjà rejeté
                                    </v-chip> 
                                </div>
                            </div>  
                        </template>
                    </v-data-table>
                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            variant="text"
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