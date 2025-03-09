<script setup>
import { defineEmits } from 'vue';

const emit = defineEmits('refresh')

// Services
import CardTitle from '../CardTitle.vue';

import CreateClient from './CreateClient.vue'
import CreateSupplier from './CreateSupplier.vue'
import CreatePart from './CreatePart.vue';
import CreateSubcontractor from './CreateSubcontractor.vue';
import CreateLogisticPlace from './CreateLogisticPlace.vue';
import CreateTransporter from './CreateTransporter.vue';

</script>

<template>
    <div class="pa-4 text-center">
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-list variant="elevated" density="compact" nav style="margin: -16px; transition: all 0.2s;">
                <v-list-item v-bind="activatorProps" style="width: 100%;" class="d-flex align-content-start">
                    <div class="aligner" style="width: 100%;">
                        <v-list-item-icon>
                        <v-icon style="margin-right: 0.4em;">mdi-database-plus-outline</v-icon>
                        </v-list-item-icon>
                        <v-list-item-title style="margin-right: 0.2em;">Ajouter des données</v-list-item-title>
                    </div>
                </v-list-item>                
            </v-list>

        </template>
  
        <template v-slot:default="{ isActive }">

          <v-card class="d-flex">
            <CardTitle 
                title="Ajouter des données"
                icon="mdi-database-plus-outline"
            />
              <v-container
                style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 16px; width: 100%;"
              >
                <CreatePart origin="menu" @refresh-parts="emit('refresh')" />
                <CreateClient origin="menu" @refresh-clients="emit('refresh')" />
                <CreateSupplier origin="menu" @refresh-suppliers="emit('refresh')" />
                <CreateSubcontractor origin="menu" @refresh-sub-contractors="emit('refresh')" />
                <CreateLogisticPlace origin="menu" @refresh-logistic-places="emit('refresh')" />
                <CreateTransporter origin="menu" @resfresh-logistics="emit('refresh')" />
              </v-container>

            <v-card-actions>

                <v-spacer></v-spacer>

                <v-btn
                    variant="text"
                    text="FERMER"
                    @click="isActive.value = false"
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