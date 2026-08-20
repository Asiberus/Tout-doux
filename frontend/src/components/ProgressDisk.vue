<script setup lang="ts">
import { computed } from 'vue'

const {
  value = 0,
  max = 100,
  color = 'white',
} = defineProps<{
  value?: number
  max?: number
  color?: string
}>()

const percentage = computed<number>(() => {
  if (max === 0) return 0
  return Math.round((value / max) * 100)
})
</script>

<template>
  <v-progress-circular :model-value="percentage" :color="color" :rotate="-90" size="16" width="8">
  </v-progress-circular>
</template>
