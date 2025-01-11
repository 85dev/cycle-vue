<script setup>
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    color: {
        type: String,
    }
})
</script>

<template>
   <v-card-title class="card-title">
    <span class="informative-text">
        <v-chip variant="elevated" :color="props.color ? props.color: 'white'" elevation="4">
            <v-icon class="mr-2">{{ props.icon }}</v-icon>
            {{ props.title }}
        </v-chip>
    </span>
  </v-card-title>
</template>

<style scoped lang="scss">
@import "../assets/main.scss";

.card-title {
    padding: 0.6rem 0rem;
    background: hsl(0, 0%, 100%);
}
</style>