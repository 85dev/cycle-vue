<script setup>
import { defineEmits } from 'vue'

// Services
import apiCaller from '../../services/apiCaller.js'
import CardTitle from '../CardTitle.vue'

// Emit to allow refresh of the parent component
const emit = defineEmits(['refreshParts'])

// Variables & logic
const props = defineProps({
    partId: {
        type: Number,
        required: true
    },
    selectedCompanyId: {
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
    await apiCaller.deleteData(`companies/${props.selectedCompanyId}/parts/${props.partId}`, false);
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

          <v-card>
            <CardTitle 
              title="Suppression d'une pièce du catalogue"
              icon="mdi-barcode"
            />

            <v-form class="d-flex align-center ma-4 pl-6">
                <v-icon color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
                <span class="informative-text-m">Vous êtes sur le point de supprimer la pièce {{ props.reference + ' ' + props.designation }} de votre catalogue de références</span>
            </v-form>
  
            <v-card-actions>

                <v-spacer></v-spacer>

                <v-btn
                    text="FERMER"
                    @click="isActive.value = false"
                ></v-btn>

                <v-btn color="red" variant="elevated" @click="deletePart(); isActive.value = false">
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