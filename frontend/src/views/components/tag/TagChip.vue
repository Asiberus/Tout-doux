<script setup lang="ts">
import { Tag } from '@/models/tag.model'

defineProps<{
  tag: Tag
  small?: boolean
  xSmall?: boolean
  clearable?: boolean
  disabled?: boolean
}>()

defineEmits<{
  clear: [id: number]
}>()
</script>

<template>
  <v-chip
    :color="tag.color"
    :size="small || xSmall ? 'small' : 'default'"
    :closable="clearable && !disabled"
    :disabled
    :class="{ small, 'x-small': xSmall }"
    @click:close="$emit('clear', tag.id)">
    {{ tag.name }}
  </v-chip>
</template>

<style scoped lang="scss">
.v-chip {
  cursor: inherit;

  &:hover::before {
    opacity: 0 !important;
  }

  &.small {
    height: 20px !important;
  }

  &.x-small {
    height: 18px !important;
  }
}
</style>
