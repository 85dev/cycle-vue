<script setup>
import { defineEmits, ref } from 'vue'
import apiCaller from '../../services/apiCaller.js'
import CardTitle from '../CardTitle.vue'

// Emit event for refreshing parent data after deletion
const emit = defineEmits(['refreshPositions'])

// Component Props
const props = defineProps({
    positionId: {
        type: Number,
        required: true
    },
    selectedCompanyId: {
        type: Number,
        required: true
    },
    positionType: {
        type: String,
        required: true,
        validator: (value) => ['expedition', 'client'].includes(value)
    }
})

// State
const dialog = ref(false)

// Function to delete position
async function deletePosition() {
    try {
        let endpoint = `companies/${props.selectedCompanyId}/archive_`;

        // Determine which API endpoint to call
        if (props.positionType === 'expedition') {
            endpoint += `expedition_position/${props.positionId}`;
        } else if (props.positionType === 'client') {
            endpoint += `client_position/${props.positionId}`;
        }

        await apiCaller.get(endpoint);
        emit("refreshPositions");
        dialog.value = false;
    } catch (error) {
        console.error("Error deleting position:", error);
    }
}
</script>

<template>
        <v-dialog v-model="dialog" class="dialog-width">
            <template v-slot:activator="{ props: activatorProps }">
                <v-chip
                    v-bind="activatorProps"
                    class="index-slot"
                    variant="text"
                    color="warning"
                    style="font-weight: 500;"
                >
                    <v-icon start class="ml-1">mdi-delete-outline</v-icon>
                    <span class="mr-1">Supprimer</span>
                </v-chip>
            </template>

            <template v-slot:default="{ isActive }">
                <v-card>
                    <CardTitle 
                        :title="`Archivage d'une position ${positionType === 'expedition' ? 'd’expédition' : 'client'}`"
                        icon="mdi-trash-can-outline"
                    />

                    <v-form class="d-flex align-center ma-4 pl-2 pr-2">
                        <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
                        <span class="informative-text-m">
                            Vous êtes sur le point de supprimer la position de votre suivi.
                            Elle apparaîtra dans les positions archivées et <strong>ne sera plus comptabilisée dans les calculs de stocks.</strong>
                        </span>
                    </v-form>

                    <v-card-actions>
                        <v-spacer></v-spacer>

                        <v-btn text="FERMER" @click="isActive.value = false"></v-btn>

                        <v-btn color="red" variant="elevated" @click="deletePosition">
                            Supprimer
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </template>
        </v-dialog>
</template>

<style scoped lang="scss">
@import url(../../assets/main.scss);
</style>