<script setup>
import { defineEmits } from 'vue'

// Services
import apiCaller from '../../services/apiCaller.js'

// Emit to allow refresh of the parent component
const emit = defineEmits(['refreshParts'])

// Variables & logic
const props = defineProps({
    partId: {
        type: Number,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
    },
    designation: { 
        type: String,
    }
})

async function deletePart() {
    await apiCaller.deleteData(`users/${props.userId}/parts/${props.partId}`, false);
    emit("refreshParts");
}

</script>

<template>
    <div class="pa-4 text-center">
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
          <div style="margin-left: -2em; margin-right: -2em;">
            <v-chip
                  v-bind="activatorProps"
                  class="index-slot"
                  variant="text"
                  color="red"
                  style="font-weight: 500;"
              >
                  <v-icon start class="ml-1">mdi-delete-outline</v-icon>
                  <span class="mr-1">Supprimer</span>
            </v-chip>
          </div>

        </template>
  
        <template v-slot:default="{ isActive }">

          <v-card title="Suppression d'une commande">

            <v-form style="width: 94%; margin: 0 auto;">
                <span class="informative-text-m">Vous êtes sur le point de supprimer la pièce {{ props.reference + ' ' + props.designation }}</span>
            </v-form>
  
            <v-card-actions style="margin-bottom: 0.8em;">

                <v-spacer></v-spacer>

                <v-btn
                    color="red"
                    text="FERMER"
                    @click="isActive.value = false"
                ></v-btn>

                <v-btn color="red" @click="deletePart(); isActive.value = false">
                    Supprimer la pièce
                </v-btn>

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