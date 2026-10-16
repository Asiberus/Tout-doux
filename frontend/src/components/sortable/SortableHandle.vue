<script setup lang="ts">
import { ComponentPublicInstance } from 'vue'
import { SetHandle } from '@/utils/sortable.utils'

const props = defineProps<{
  setHandle: SetHandle
  label: string
}>()

function bindHandle(button: Element | ComponentPublicInstance | null): void {
  props.setHandle((button as ComponentPublicInstance | null)?.$el ?? null)
}
</script>

<template>
  <v-btn :ref="bindHandle" icon variant="plain" :aria-label="label" class="sortable-handle">
    <v-icon icon="mdi-drag-vertical" size="small" />
  </v-btn>
</template>

<style scoped lang="scss">
.sortable-handle {
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--sortable-gutter-width);
  height: auto;
  border-radius: 0;
  cursor: grab;
  touch-action: none;
  opacity: var(--sortable-handle-opacity);
  transition:
    opacity 0.15s,
    background-color 0.15s;

  &:hover,
  &:focus-visible {
    opacity: 1;
    background-color: rgba(var(--v-theme-on-surface), 0.06);
  }

  // Au toucher, la poignée n'est qu'un repère dans la marge de la carte : les touchers passent au
  // travers, vers l'appui long de la carte
  @media (hover: none) {
    left: 2px;
    width: 8px;
    pointer-events: none;

    .v-icon {
      font-size: 16px;
    }
  }
}
</style>
