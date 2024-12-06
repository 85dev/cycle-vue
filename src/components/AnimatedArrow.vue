<script setup>
import { computed } from 'vue'
import { defineProps } from 'vue'

// Define props for the component
const props = defineProps({
    topValue: {
        type: Number,
        default: 50, // Default position at 50% from the top
    },
    leftValue: {
        type: Number,
        default: 50, // Default position at 50% from the left
    },
    directionValue: {
        type: Number,
        default: 0, // Default direction set to 0 degrees (down)
    },})

// Computed property for dynamically styling the arrow
const arrowStyle = computed(() => ({
    top: `${props.topValue}%`,
    left: `${props.leftValue}%`,
    transform: `rotate(${props.directionValue}deg)`,
}))
</script>

<template>
    <div :style="arrowStyle" class="arrow"></div>
</template>
  
<style scoped>
.arrow {
    position: absolute;
    z-index: 1;
    width: 24px;
    height: 24px;
    border-left: 3px solid #ffffff;
    border-bottom: 3px solid #ffffff;
}

</style>
  