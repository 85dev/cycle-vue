<script setup>
// Services
import CardTitle from '../CardTitle.vue';
import { detailedDelExpeditionsHeaders, detailedUndelExpeditionsHeaders } from '@/models/tableHeaders'

const props = defineProps({
    origin: {
        type: String,
        required: true,
    },
    selectedCompanyId: {
        type: Number,
        required: true
    },
    expedition: {
        type: Object,
        required: true
    }
})

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
                <v-icon start class="ml-1">mdi-dolly</v-icon>
                <span class="mr-1">Consulter</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        :title="`Détails de l\'expédition ${props.expedition.number}`"
                        icon="mdi-cube-send"
                    />
                    <v-divider style="margin: 0em 1em; padding: 6px;"></v-divider>
                    <v-card style="margin: 0.4em">
                        <CardTitle 
                            title="Contenu de l'expédition"
                            variant="elevated"
                            icon="mdi-ferry"
                            color="dark"
                        />
                        <v-data-table
                            :headers="props.origin === 'delivered' ? detailedDelExpeditionsHeaders : detailedUndelExpeditionsHeaders"
                            :items="props.expedition.expedition_positions"
                            density="compact"
                        >
                        <template v-slot:item.quantity="{ item }">
                            <v-chip variant="text" color="success" outlined>
                                <v-icon class="mr-2">mdi-package-variant-closed-check</v-icon>
                                {{ item.quantity }}
                            </v-chip>
                        </template>
                        <template v-slot:item.quantity_status="{ item }">
                            <v-chip variant="text" :color="item.quantity_status === 'full' ? 'success' : 'warning'" outlined>
                                <v-icon class="mr-2">{{ item.quantity_status === 'full' ? 'mdi-package-variant-closed-check' : 'mdi-package-variant' }} </v-icon>
                                {{ item.quantity_status === 'full' ? 'Complet' : 'Partiel' }}
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