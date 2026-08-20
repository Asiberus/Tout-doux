<script setup lang="ts">
import { hideScroll, showScroll } from '@/utils/document.utils'
import { watch } from 'vue'
import { useDisplay } from 'vuetify'

const { width } = useDisplay()

const show = defineModel<boolean>()

watch(show, value => {
  if (value) hideScroll()
  else showScroll()
})
</script>

<template>
  <v-dialog
    v-model="show"
    content-class="half-dialog"
    :transition="width < 400 ? 'dialog-bottom-transition' : 'slide-x-reverse-transition'">
    <slot></slot>
  </v-dialog>
</template>
