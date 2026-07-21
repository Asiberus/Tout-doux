<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const { sm, mdAndUp } = useDisplay()

defineProps<{
  icon?: string
}>()

const size = computed<'default' | 'large' | 'x-large'>(() => {
  if (sm.value) return 'large'
  else if (mdAndUp.value) return 'x-large'
  else return 'default'
})
</script>

<template>
  <div class="d-flex align-center justify-center justify-sm-start gap-2">
    <v-icon v-if="icon" :size>
      {{ icon }}
    </v-icon>
    <h1 class="text-h4 text-md-h3">
      <slot></slot>
    </h1>
  </div>
</template>
