<script setup lang="ts">
const active = defineModel<boolean>()
defineProps<{
  color: string
  icon: string
}>()
</script>

<template>
  <v-chip :color="active ? color : 'grey darken-4'" @click="active = !active">
    <v-icon v-if="active" size="small" class="mr-1">{{ icon }}</v-icon>
    <v-icon v-else size="small" class="mr-1">mdi-checkbox-blank-outline</v-icon>
    <slot></slot>
  </v-chip>
</template>
