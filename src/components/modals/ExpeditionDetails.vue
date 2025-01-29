<script setup>
// Services
import { statusIcon, statusIconColor, statusText } from '@/services/textIconServices.js'
import CardTitle from '../CardTitle.vue';
import { detailedExpeditionsHeaders } from '@/models/tableHeaders'

const props = defineProps({
    selectedCompanyId: {
        type: Number,
        required: true
    },
    expedition: {
        type: Object,
        required: true
    }
})

console.log(props.expedition);

</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                class="index-slot"
                variant="text"
                color="blue"
                style="margin-right: 0.6em; font-weight: 500;"
            >
                <v-icon start class="ml-1">mdi-gesture-spread</v-icon>
                <span class="mr-1">Consulter</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        title="Détails de l'expédition"
                        icon="mdi-cube-send"
                    />
                    <v-divider style="margin: 0em 1em; padding: 6px;"></v-divider>
                    <v-card style="margin: 0.4em">
                        <v-data-table
                            :headers="detailedExpeditionsHeaders"
                            :items="props.expedition.expedition_positions"
                            density="compact"
                        >
                        <template v-slot:item.quantity="{ item }">
                            <v-chip variant="elevated" color="success" outlined>
                                <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                                {{ item.quantity }}
                            </v-chip>
                        </template>
                        </v-data-table>
                    </v-card> 

                    <v-card-actions>

                        <v-spacer></v-spacer>

                        <v-btn
                            color="red"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>