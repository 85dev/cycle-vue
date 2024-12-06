<script setup>
import { defineEmits } from 'vue'

// Services
import apiCaller from '../../services/apiCaller.js'

// Emit to allow refresh of the parent component
const emit = defineEmits(['orderRefresh'])

// Variables & logic
const props = defineProps({
    piece: {
        type: Object,
        required: true
    },
    orderId: {
        type: Number,
        required: true
    },
    userId: {
      type: Number,
      required: true
    },
})

async function submitRepair() {
    const pieceRecord = {
        piece_to_change: {
            name: props.piece.name,
            urgency: props.piece.urgency,
            description: props.piece.description,
            brand: props.piece.brand
        }
    }
    await apiCaller.patch(`users/${props.userId}/cars/${props.carId}/pieces_to_change/${props.piece.id}`, pieceRecord, false)

    emit("orderRefresh")
}

</script>

<template>
    <div class="pa-4 text-center">
      <v-dialog max-width="800">
        <template v-slot:activator="{ props: activatorProps }">

        <v-btn style="width: 36px; height: 36px; box-shadow: none; background-color: none;" icon v-bind="activatorProps">              
          <v-icon size="20">mdi-pencil-outline</v-icon>
        </v-btn>

        </template>
  
        <template v-slot:default="{ isActive }">

          <v-card title="à changer">

            <v-form style="width: 100%; margin: 0 auto;">

            </v-form>
  
            <v-card-actions>

              <v-btn
                color="red"
                text="FERMER"
                variant="text"
                @click="isActive.value = false"
              ></v-btn>
  
              <v-btn
                color="green"
                text="SAUVEGARDER"
                variant="flat"
                @click="submitRepair(); isActive.value = false;"
              ></v-btn>

            </v-card-actions>

          </v-card>

        </template>
      </v-dialog>
    </div>
  </template>

<style scoped lang="scss">
.v-btn {
    &:hover {
        margin-bottom: 0em;
    }
}

.text-field {
  max-width: 60%;
  margin: 0 auto;
}
</style>