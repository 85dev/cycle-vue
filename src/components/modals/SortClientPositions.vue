<script setup>
import apiCaller from '@/services/apiCaller';
import { onMounted, ref, watch } from 'vue'
import { sortingClientPositionHeaders } from '@/models/tableHeaders.js'

const props = defineProps({
    selectedCompanyId: {
        type: Number,
        required: true
    },
    partId: {
        type: Number,
        required: true
    },
    openModal: {
        type: Boolean,
        required: true,
    },
    client: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['refreshClientPositions'])

const reactiveModalValue = ref(props.openModal);
const standardStocks = ref([])
const consignmentStocks = ref([])

// Create a reactive copy of clientPositions and map new fields
const mappedClientPositions = ref([]);

async function fetchUnsortedClientPositions() {
  const response = await apiCaller.get(`companies/${props.selectedCompanyId}/parts/${props.partId}/unsorted_client_positions`)

  mappedClientPositions.value =     
    response.map(position => ({
        ...position,
        selectedStSt: null, // Default value for selected standard stock
        selectedCoSt: null  // Default value for selected consignment stock
    }))
}

async function fetchStandardStocks() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${props.client.id}/fetch_standard_stocks_by_client`)
    standardStocks.value = response
}

async function fetchConsignmentStocks() {
    const response = await apiCaller.get(`companies/${props.selectedCompanyId}/clients/${props.client.id}/fetch_consignment_stocks_by_client`)
    consignmentStocks.value = response
}

watch(
  () => props.openModal,
  (newValue) => {
    reactiveModalValue.value = newValue;
  }
);

watch(
  reactiveModalValue,
  (newValue) => {
    emit('update:openModal', newValue);
  }
);

async function submitSortedPositions() {
    const payload = {
        client_position_ids: mappedClientPositions.value.map(position => position.id),
        standard_stocks: mappedClientPositions.value.map(pos => {
            const stock = standardStocks.value.find(ss => ss.address === pos.selectedStSt);
            return stock ? parseInt(stock.id) : 0;
        }),
        consignment_stocks: mappedClientPositions.value.map(pos => {
            const stock = consignmentStocks.value.find(cs => cs.address === pos.selectedCoSt);
            return stock ? parseInt(stock.id) : 0;
        }),
    };

    const response = await apiCaller.post(`companies/${props.selectedCompanyId}/clients/${props.client.id}/sort_client_positions`, payload)
    
    emit('refreshClientPositions')
}

onMounted(async() => {
    await fetchStandardStocks()
    await fetchConsignmentStocks()
    await fetchUnsortedClientPositions()
})

</script>

<template>
    <v-dialog v-model="reactiveModalValue" persistent class="dialog-width">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Répartissez la position sur le lieu de stockage dédié`" append-icon="mdi-truck-delivery-outline" style="padding: 0.4em;">
                    
                    <div class="column-maker" style="margin-left: 6px;">
                        <div>
                            <v-icon color="red" style="margin-left: 12px;">mdi-alert-circle-outline</v-icon>
                            <span class="informative-text" style="margin-left: 6px;">Vous devez répartir la position sur les lieux de stockage du client, <strong>un seul stock</strong> peut être sélectionné</span>
                        </div>
                    </div>

                    <v-card style="margin: 0.6em;">
                        <v-data-table
                            :item-selectable="true"
                            :items="mappedClientPositions || []"
                            variant="underlined"
                            density="dense"
                            :headers="sortingClientPositionHeaders"
                        >
                        <template v-slot:item.consignment_stock="{ item }">
                            <v-select
                                class="field-slot"
                                clearable
                                variant="underlined"
                                v-model="item.selectedCoSt"
                                :items="consignmentStocks.map(cs => cs.address) || []"
                                label="Stock consignation"
                                aria-required="true"
                                :disabled="item.selectedStSt"
                            >
                            </v-select>
                        </template>
                        <template v-slot:item.standard_stock="{ item }">
                            <v-select
                                class="field-slot"
                                clearable
                                variant="underlined"
                                v-model="item.selectedStSt"
                                :items="standardStocks.map(ss => ss.address) || []"
                                label="Stock standard"
                                aria-required="true"
                                :disabled="item.selectedCoSt"
                            >
                            </v-select>
                        </template>
                        </v-data-table>
                    </v-card>

                    <v-card-actions style="margin-top: 0.2em;">

                        <v-spacer></v-spacer>
            
                        <v-btn variant="elevated" @click="submitSortedPositions(); reactiveModalValue = false" color="success">
                            Répartir la position
                        </v-btn>

                    </v-card-actions>
                </v-card>
            </div>
      </v-dialog>
</template>

<style scoped lang="scss">
@import url(../../assets/main.scss);

.field-slot {
    min-width: 120px;
}
</style>