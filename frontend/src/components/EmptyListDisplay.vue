<script setup lang="ts">
// Todo : change path of svg

defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="img-wrapper">
    <slot name="img"></slot>
    <div class="img-description">
      <slot name="message">{{ message }}</slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.img-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .img-description {
    margin-top: 1.5rem;
    text-align: center;
  }
}
</style>
