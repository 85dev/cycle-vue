<script setup>
import { ref, onMounted, watch } from 'vue'

// Services
import apiCaller from '@/services/apiCaller';
import CardTitle from '../CardTitle.vue';
import SpinnLoader from '../SpinnLoader.vue';
import { transporters } from '@/models/preselectionData';

const props = defineProps({
    order: {
        type: Object,
        required: true
    },
    selectedCompanyId: {
        type: Number,
        required: true
    },
    transporters: {
        type: Array,
        required: true,
    }
})

const loading = ref(false)
const supplier = ref(null)
const contacts = ref([])
const selectedContact = ref(null)
const selectedTransporter = ref(null)
const createdOrderSlip = ref(null)
const informations = ref(null)
const selectedTransitMethod = ref(null)

const emit = defineEmits(['refresh']);

async function fetchContactsBySupplier() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/supplier_orders/${props.order.supplier_order_id}/contacts_by_supplier_order`);
    contacts.value = response.contacts;
    supplier.value = response.supplier.name;
}

async function createOrderSlip() {
    const transitMapping = {
        "Bateau": { is_boat: true, is_flight: false, is_train: false },
        "Avion": { is_boat: false, is_flight: true, is_train: false },
        "Train": { is_boat: false, is_flight: false, is_train: true }
    };

    const transitSelection = transitMapping[selectedTransitMethod.value] || { is_boat: false, is_flight: false, is_train: false };

    const payload = {
            company_id: props.selectedCompanyId,
            supplier_order_position_id: props.order.id, // Reference the position
            supplier_order_id: props.order.supplier_order_id, // Reference the order
            contact_id: contacts.value.find(c => `${c.first_name} ${c.last_name}` === selectedContact.value)?.id,
            transporter_id: props.transporters.find(t => t.name === selectedTransporter.value)?.id,
            informations: informations.value,
            ...transitSelection
        }
    const response = await apiCaller.post(`pdf_generator/${props.order.id}/order_slip_single_position`, payload, false)
    createdOrderSlip.value = await response.json();
}

async function downloadPdf() {
    loading.value = true
    setTimeout(async() => {
        const response = await apiCaller.getJson(`pdf_generator/${createdOrderSlip.value.id}/generate_order_slip_single_position_pdf`, false);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');

        loading.value = false
    }, 1200);
}

async function completePdfProcess() {
    await createOrderSlip()
    await downloadPdf()
}

onMounted(async() => {
    await fetchContactsBySupplier()

})
</script>

<template>
    <SpinnLoader :loading="loading" text="Génération du document" />
    <v-dialog class="secundary-dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                style="font-weight: 500;"
                v-bind="activatorProps"
                variant="text"
                color="blue"
            >
                <v-icon start class="mr-2 ml-1">mdi-file-pdf-box</v-icon>
                Télécharger
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        title="Générer un bon de commande"
                        icon="mdi-file-pdf-box"
                    />
                   
                    <v-card style="margin: 0.4em">
                        <CardTitle 
                            title="Détails de la commande fournisseur"
                            icon="mdi-list-box-outline"
                            color="blue"
                        />
                        <v-row class="pr-4 pl-4 mb-0 ml-1" style="margin-bottom: -2.4em; font-size: 14px;" align="center" justify="space-between">
                            <!-- Left Column -->
                            <v-col cols="12" md="6" class="d-flex flex-column mb-0">
                                <div v-if="props.order.supplier_order_number">
                                    <v-icon class="mr-2">mdi-file-document-outline</v-icon>
                                    <span class="mr-1">Numéro de commande : <strong>{{ props.order.supplier_order_number }}</strong></span>
                                </div>
                                <div v-if="props.order.supplier_order_status">
                                    <v-icon class="mr-2">mdi-progress-clock</v-icon>
                                    <span class="mr-1">Statut de la commande : <strong>{{ props.order.supplier_order_status }}</strong></span>
                                </div>
                                <div v-if="props.order.price">
                                    <v-icon class="mr-2">mdi-cash</v-icon>
                                    <span class="mr-1">Prix unitaire : <strong>{{ props.order.price }}</strong></span>
                                </div>
                                <div v-if="props.order.delivery_date">
                                    <v-icon class="mr-2">mdi-calendar</v-icon>
                                    <span class="mr-1">Date de livraison prévue : <strong>{{ new Date(props.order.delivery_date).toLocaleDateString() }}</strong></span>
                                </div>
                            </v-col>

                            <!-- Right Column -->
                            <v-col cols="12" md="6" class="d-flex flex-column mb-0">
                                <div v-if="props.order.part_designation">
                                    <v-icon class="mr-2">mdi-barcode-scan</v-icon>
                                    <span class="mr-1">Désignation : <strong>{{ props.order.part_designation }}</strong></span>
                                </div>
                                <div v-if="props.order.part_reference">
                                    <v-icon class="mr-2">mdi-rename</v-icon>
                                    <span class="mr-1">Référence : <strong>{{ props.order.part_reference }}</strong></span>
                                </div>
                                <div v-if="props.order.original_quantity">
                                    <v-icon class="mr-2">mdi-package-variant-closed</v-icon>
                                    <span class="mr-1">Quantité initiale : <strong>{{ props.order.original_quantity }}</strong></span>
                                </div>
                                <div v-if="props.order.quantity">
                                    <v-icon class="mr-2">mdi-package-variant</v-icon>
                                    <span class="mr-1">Quantité restante à livrer: <strong>{{ props.order.quantity }}</strong></span>
                                </div>
                                <div v-if="props.order.delivered">
                                    <v-icon class="mr-2" :color="props.order.delivered ? 'green' : 'red'">mdi-cube-send</v-icon>
                                    <span class="mr-1">Statut de livraison : <strong>{{ props.order.delivered ? 'Livrée' : 'En attente' }}</strong></span>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card>

                    <v-card style="margin: 0.4em">
                        <CardTitle 
                            title="Ajout des données pour le bon de commande"
                            icon="mdi-list-box-outline"
                        />
                        <v-row class="mr-4 ml-4 mt-0">
                            <v-text-field
                                disabled 
                                label="Fournisseur"  
                                variant="underlined"
                                v-model="supplier"
                            />
                            <v-select 
                                class="ml-4"
                                label="Contact"  
                                variant="underlined"
                                v-model="selectedContact"
                                :items="contacts.map(c => `${c.first_name} ${c.last_name}`)"
                            />
                        </v-row>
                            
                        <v-row class="mr-4 ml-4 mt-4">
                            <v-select 
                                label="Transporteur"  
                                variant="underlined"
                                v-model="selectedTransporter"
                                :items="props.transporters.map(t => t.name)"
                            />
                            <v-select 
                                label="Moyen de transport"
                                class="ml-4"
                                variant="underlined"
                                v-model="selectedTransitMethod"
                                :items="['Train', 'Bateau', 'Avion']"
                            />
                        </v-row>

                        <v-row class="mr-4 ml-4 mb-3 mt-4">
                            <v-textarea
                                label="Informations complémentaires"  
                                variant="underlined"
                                v-model="informations"
                            />
                        </v-row>
                    </v-card>

                    <v-card-actions class="mt-2">
                        <v-spacer></v-spacer>
                        <v-btn
                            variant="text"
                            @click="isActive.value = false"
                        >
                            Fermer
                        </v-btn>
                        <v-btn
                            class="ml-4 d-flex align-center"
                            color="success"
                            variant="elevated"
                            @click="completePdfProcess()"
                        >
                            <v-icon class="ml-1 mr-1">mdi-download-box-outline</v-icon>
                            Télécharger .PDF
                        </v-btn>
                    </v-card-actions>    
                </v-card>
            </div>
        </template>
    </v-dialog>
</template>

<style scoped>
:deep(.v-input__details) {
    display: none;
}
</style>