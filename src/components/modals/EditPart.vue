<script setup>
import { onMounted, ref, defineEmits } from 'vue';

// Services
import apiCaller from '../../services/apiCaller.js';
import dateConverter from '@/services/dateConverter.js';

const props = defineProps({
    userId: {
        type: Number
    },
    partId: {
        type: Number
    }
})

const designation = ref(null)

const emit = defineEmits(['refreshPart'])
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn
            v-bind="activatorProps"
            icon
            size="16"
            style="margin-bottom: 6px;"
            class="no-effects"
          >              
          <v-icon>mdi-pencil-outline</v-icon>
          </v-btn>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Modification de la pièce`" style="padding: 0.4em;">
                    <v-divider style="margin: 0em 1em;"></v-divider>

                    <v-text class="informative-text">
                        <v-icon>mdi-alert-circle-outline</v-icon>
                        Ni la référence ou la désignation d'une pièce ne peuvent être changées
                    </v-text>
                    <v-text-field
                        clearable
                        disabled="true"
                        variant="underlined"
                        class="form-part"
                        v-model="designation"
                        label="Désignation"
                        required
                    ></v-text-field>

                    <v-text-field
                        clearable
                        disabled="true"
                        variant="underlined"
                        class="form-part"
                        v-model="reference"
                        label="Référence"
                        required
                    ></v-text-field>

                    <v-text-field
                        clearable
                        variant="underlined"
                        class="form-part"
                        v-model="material"
                        label="Matière"
                        required
                    ></v-text-field>

                    <v-text-field
                        clearable
                        variant="underlined"
                        class="form-part"
                        v-model="drawing"
                        label="Dessin"
                        required
                    ></v-text-field>

                    <v-card-actions style="margin-bottom: 0.8em;">

                        <v-spacer></v-spacer>

                        <v-btn
                            variant="tonal"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>
            
                        <v-btn 
                            variant="elevated"
                            color="success"
                            @click="submitClientOrder(); isActive.value = false"
                        >
                            Modifier les informations
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