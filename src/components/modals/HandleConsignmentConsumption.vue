<script setup>
import { ref, defineEmits, onMounted } from 'vue';
import apiCaller from '@/services/apiCaller';
import dateConverter from '@/services/dateConverter';
import CardTitle from '../CardTitle.vue';

const props = defineProps({
    selectedCompanyId: {
        type: Number,
        required: true
    },
    stock: {
        type: Object,
        required: true
    },
    currentQuantity: {
        type: Number,
        required: true
    },
    clientId: {
        type: Number,
        required: true
    },
    partReference: {
        type: String,
        required: true
    },
    partDesignation: {
        type: String,
        required: true
    },
    partPrice: {
        type: Number,
        required: true
    },
    origin: {
        type: String,
        required: true
    }           
})

const consumptionRows = ref([])
const parts = ref([])
const number =ref('')
const beginDate = ref(dateConverter.formatISODate(new Date()))
const endDate = ref(dateConverter.formatISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)))

const addRow = () => {
    consumptionRows.value.push({
        part_reference: `${props.partReference} ${props.partDesignation}`,
        quantity: props.currentQuantity,
        price: props.partPrice
    });
};

const deleteRow = (index) => {
    consumptionRows.value.splice(index, 1);
};

async function fetchParts() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${props.clientId}/parts_by_client`);
    parts.value = response;
}

async function submitConsumption() {
    const payload = {
        consignment_stock_id: props.stock.id,
        begin_date: beginDate.value,
        end_date: endDate.value,
        number: number.value,
        consignment_consumptions: consumptionRows.value.map(row => ({
            part_id: parts.value.find(p => `${p.reference} ${p.designation}` === row.part_reference)?.id,
            quantity: row.quantity,
            price: row.price
        }))
    }

    const response = await apiCaller.post(`companies/${props.selectedCompanyId}/consignment_stocks/${props.stock.id}/create_consignment_consumption`, payload, true)
    emit('refreshConsignment')
}

const emit = defineEmits('refreshConsignment')

onMounted(async() => {
    await fetchParts()

    addRow()
})
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-chip
                v-bind="activatorProps"
                style="width: fit-content;"
                variant="outlined"
                color="blue"
                class="text-body-2"
            >
                <v-icon start class="ml-1">mdi-cart-arrow-up</v-icon>
                Gérer la consommation
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card style="padding: 0.4em;">
                    <CardTitle 
                        :title="`Enregistrer une consommation au ${props.stock.address}`"
                        icon="mdi-cart-outline"
                    />
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <v-row align="d-flex align-center pa-4" style="margin-bottom: -2em;" dense>
                        <v-col cols="4">
                            <v-text-field
                                v-model="number"
                                label="Numéro de commande"
                                variant="underlined"
                            ></v-text-field>
                        </v-col>
                        <v-col cols="3">
                            <v-text-field
                                v-model="beginDate"
                                label="Date de début"
                                type="date"
                                variant="underlined"
                            ></v-text-field>
                        </v-col>
                        <v-col cols="3">
                            <v-text-field
                                v-model="endDate"
                                label="Date de fin"
                                type="date"
                                variant="underlined"
                            ></v-text-field>
                        </v-col>
                    </v-row>

                    <div class="d-flex flex-column">
                        <span class="informative-text">
                            Quantité maximale à renseigner : <strong>{{ props.currentQuantity === 0 ? 'Aucune pièce en stock chez le client' : props.currentQuantity }}</strong>
                        </span>
                    </div>

                    <v-card class="mr-2 ml-2 mt-2 d-flex flex-column">
                        <div v-for="(row, index) in consumptionRows" :key="index" class="consumption-row pa-4">
                            <v-row class="d-flex align-center mt-2">
                                <v-col cols="4">
                                    <v-select
                                        v-model="row.part_reference"
                                        label="Référence"
                                        variant="underlined"
                                        density="compact"
                                        :items="parts.map(p => `${p.reference} ${p.designation}`)"
                                    ></v-select>
                                </v-col>
                                <v-col cols="3">
                                    <v-text-field
                                        v-model="row.quantity"
                                        label="Quantité"
                                        type="number"
                                        variant="underlined"
                                        density="compact"
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="3">
                                    <v-text-field
                                        v-model="row.price"
                                        label="Prix"
                                        type="number"
                                        variant="underlined"
                                        density="compact"
                                    ></v-text-field>
                                </v-col>
                                <v-col v-if="props.origin !== 'single'" cols="2" class="d-flex justify-center">
                                    <v-btn
                                        icon
                                        @click="deleteRow(index)"
                                        :disabled="consumptionRows.length === 1"
                                    >
                                        <v-icon>mdi-delete</v-icon>
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </div>
                    </v-card>

                    <div v-if="props.origin !== 'single'" class="d-flex justify-center mt-2">
                        <v-btn
                            prepend-icon="mdi-plus"
                            class="mt-2"
                            @click="addRow"
                        >
                            Ajouter une ligne
                        </v-btn>
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
                            @click="submitConsumption(); isActive.value = false"
                        >
                            Enregistrer
                        </v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

</style>