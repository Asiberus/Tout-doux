<script setup lang="ts">
const active = defineModel<boolean>()
withDefaults(
  defineProps<{
    color: string
    icon: string
    size?: 'default' | 'large'
  }>(),
  { size: 'default' }
)
</script>

<template>
  <v-chip :color="active ? color : undefined" :size @click="active = !active">
    <v-icon v-if="active" :icon="icon" size="small" class="mr-1" />
    <v-icon v-else icon="mdi-checkbox-blank-outline" size="small" class="mr-1" />
    <slot></slot>
  </v-chip>
</template>
