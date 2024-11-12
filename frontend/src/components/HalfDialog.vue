<script setup lang="ts">
import { hideScroll, showScroll } from '@/utils/document.utils'
import { watch } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const show = defineModel<boolean>()

watch(
  () => show.value,
  value => {
    if (value) hideScroll()
    else showScroll()
  }
)
</script>

<template>
  <v-dialog
    :model-value="show"
    content-class="half-dialog"
    :transition="display.width < 400 ? 'dialog-bottom-transition' : 'slide-x-reverse-transition'"
    @update:model-value="show = $event">
    <slot></slot>
  </v-dialog>
</template>
