<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

defineProps<{
  text: string
}>()

const textElement = useTemplateRef('textElement')
const isTruncated = ref(false)

function measure(): void {
  if (!textElement.value) return
  isTruncated.value = textElement.value.scrollWidth > textElement.value.clientWidth
}
</script>

<template>
  <span ref="textElement" class="text-truncate" @mouseenter="measure()">
    {{ text }}
    <v-tooltip activator="parent" :text location="top" :disabled="!isTruncated" />
  </span>
</template>
