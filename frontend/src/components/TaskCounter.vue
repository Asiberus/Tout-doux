<script setup lang="ts">
withDefaults(
  defineProps<{
    value: number
    max: number
    showIcon?: boolean
  }>(),
  { showIcon: true }
)
</script>

<template>
  <div class="wrapper">
    <span class="value">{{ value }}</span>
    <span class="separator">/</span>
    <span class="max">{{ max }}</span>
    <v-icon v-if="showIcon">mdi-trophy</v-icon>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';
@use 'vuetify/lib/styles/settings/_colors';

.wrapper {
  display: flex;
  align-items: baseline;
  column-gap: 4px;
}

.value {
  font-size: 2rem;
  line-height: 2rem;
  color: white;
}

.separator {
  font-size: 1.25rem;
  color: #{map.get(colors.$grey, 'lighten-2')};
}

.max {
  font-size: 1.5rem;
  line-height: 1.5rem;
  color: #{map.get(colors.$grey, 'lighten-2')};
  transform: translateY(1px);
}

@media #{map.get(variables.$display-breakpoints, 'sm-and-down')} {
  .value {
    font-size: 1.75rem;
  }

  .separator {
    font-size: 1rem;
  }

  .max {
    font-size: 1.25rem;
  }
}
</style>
