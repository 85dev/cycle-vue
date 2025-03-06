<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    lifecycleSteps: {
        type: Array,
        required: true
    },
    direction: {
        type: String,
        default: 'horizontal' // Can be 'horizontal' or 'vertical'
    },
    lineColor: {
        type: String,
        default: 'warning' // Vuetify color (e.g., primary, warning, success)
    },
    iconColor: {
        type: String,
        default: 'dark' // Color of timeline icons
    }
});
</script>

<template>
    <v-timeline
        v-if="props.lifecycleSteps && props.lifecycleSteps.length > 0"
        style="overflow-x: scroll;"
        class="mt-4"
        side="start"
        :direction="direction"
        line-thickness="4"
        :line-color="lineColor"
    >
        <v-timeline-item
            v-for="(step, index) in props.lifecycleSteps"
            :key="index"
            elevation="2"
            icon="mdi-cogs"
            :icon-color="props.iconColor"
            dot-color="white"
        >
            <template v-slot:opposite>
                <v-chip
                    style="height: fit-content;"
                    class="d-flex align-center mb-1 mt-2"
                    variant="elevated"
                    color="white"
                >
                    <span style="margin-left: 2px;">
                        {{ step.step_name }}
                    </span>
                </v-chip>
            </template>

            <template v-slot:default>
                <div class="informative-text" style="display: flex; flex-direction: column; align-items: center; padding: 0.6em">
                    <span class="d-flex flex-column justify-center">
                        <v-card class="d-flex align-start flex-column">
                            <v-chip variant="text">
                                <v-icon class="mr-2">mdi-domain</v-icon>
                                <span>
                                    Type d'organisation :
                                    <strong>{{ step.entity_type }}</strong>
                                </span>
                            </v-chip>
                            <v-chip variant="text" style="margin-top: -6px;">
                                <v-icon class="mr-2">mdi-account-outline</v-icon>
                                <span>
                                    organisation associée :
                                    <strong>{{ step.entity_name }}</strong>
                                </span>
                            </v-chip>
                        </v-card>
                    </span>
                </div>
            </template>
        </v-timeline-item>
    </v-timeline>
</template>