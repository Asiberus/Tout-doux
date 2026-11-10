<script setup lang="ts">
const { count, late } = defineProps<{
  count: number
  late: boolean
}>()
</script>

<template>
  <v-chip
    :color="late ? 'red-accent-2' : 'orange'"
    size="small"
    class="flex-shrink-0"
    :title="`${count} late or due today`">
    <v-icon :icon="late ? 'mdi-calendar-alert' : 'mdi-calendar-today'" size="small" class="mr-1" />
    {{ count }}
  </v-chip>
</template>
