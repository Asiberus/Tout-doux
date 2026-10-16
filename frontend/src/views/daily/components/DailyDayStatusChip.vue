<script setup lang="ts">
import { useToday } from '@/composables/useToday'
import { computed } from 'vue'

const props = defineProps<{
  date: string
}>()

const { today } = useToday()
const isPassed = computed<boolean>(() => today.value.isAfter(props.date, 'day'))
const isUpcoming = computed<boolean>(() => today.value.isBefore(props.date, 'day'))
</script>

<template>
  <v-chip
    v-if="isPassed"
    size="small"
    variant="tonal"
    prepend-icon="mdi-lock-outline"
    class="flex-shrink-0">
    Past day
  </v-chip>
  <v-chip
    v-else-if="isUpcoming"
    size="small"
    color="accent"
    variant="tonal"
    prepend-icon="mdi-calendar-arrow-right"
    class="flex-shrink-0">
    Upcoming
  </v-chip>
</template>
