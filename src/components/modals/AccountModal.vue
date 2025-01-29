<script setup>
//Vue essentials
import { ref, defineEmits } from 'vue';

//Components
import CreateCompany from './CreateCompany.vue';
import JoinCompany from './JoinCompany.vue';
import CardTitle from '../CardTitle.vue';

const emit = defineEmits(['refreshParent'])

const props = defineProps({
    origin: {
        type: String
    }
})

function refreshParent() {
    emit('refreshParent')
}
</script>

<template>
      <v-dialog class="dialog-width">
        <template v-slot:activator="{ props: activatorProps }">
            <v-list v-if="!props.origin" variant="elevated" density="compact" nav style="width: 100%; transition: all 0.2s;">
                    <v-list-item color="blue" v-bind="activatorProps" style="display: flex;" nav>
                        <div class="aligner">
                            <v-list-item-icon>
                            <v-icon style="margin-right: 0.4em;">mdi-office-building-plus-outline</v-icon>
                            </v-list-item-icon>
                            <v-list-item-title style="margin-right: 0.2em;">Rejoindre une société</v-list-item-title>
                        </div>
                    </v-list-item>                
            </v-list>
            <div v-else>
                <v-chip v-bind="activatorProps" variant="elevated" color="blue">
                    <v-icon class="mr-2">mdi-account-plus-outline</v-icon>
                    Rejoindre une société
                </v-chip>
            </div>
        </template>
  
        <template v-slot:default="{ isActive }">
            <div class="card-container">
                <v-card>
                    <CardTitle
                        title="Ajouter ou rejoindre une entreprise"
                        icon="mdi-office-building"
                    />
                    <v-divider style="margin: 0em 1em;"></v-divider>
                    <v-container class="mt-4">
                        <v-row>
                            <v-col class="d-flex align-center justify-center">
                            <CreateCompany 
                                @refresh-data="refreshParent"
                            />
                            </v-col>
                            <v-col class="d-flex align-center justify-center">
                            <JoinCompany />
                            </v-col>
                        </v-row>
                    </v-container>
                    <v-card-actions>
                        <v-spacer></v-spacer>

                        <v-btn
                            variant="tonal"
                            text="FERMER"
                            @click="isActive.value = false"
                        ></v-btn>

                    </v-card-actions>
                </v-card>
            </div>
        </template>
      </v-dialog>
</template>

<style scoped lang="scss">
@import "../../assets/main.scss";

</style>