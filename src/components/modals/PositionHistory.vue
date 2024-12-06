<script setup>
import { onMounted, ref, defineEmits } from 'vue';

const props = defineProps({
    userId: {
        type: Number
    },
    partId: {
        type: Number
    },
    origin: {
        type: String
    }
})

const designation = ref(null)

const emit = defineEmits('refreshPart')
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
                <span class="mr-1">Historique</span>
            </v-chip>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container" style="padding: 0.4em;">
                <v-card :title="`Historique de la position`" style="padding: 0.4em;">
                    <v-divider style="margin: 0em 1em;"></v-divider>

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