<script setup lang="ts">
import MainTitle from '@/components/MainTitle.vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()
</script>

<template>
  <div class="fill-height d-flex flex-column">
    <MainTitle icon="mdi-cog" class="mb-2 mb-md-6">Settings</MainTitle>

    <div class="settings">
      <div class="settings__tabs">
        <v-tabs
          :direction="display.mdAndUp ? 'vertical' : 'horizontal'"
          color="accent"
          show-arrows
          bg-color="transparent">
          <v-tab :to="{ name: 'settings-preferences' }" exact class="justify-start">
            <v-icon start size="small">mdi-cog</v-icon>
            Preferences
          </v-tab>
          <v-tab :to="{ name: 'settings-common-tasks' }" exact class="justify-start">
            <v-icon start size="small">mdi-timeline</v-icon>
            Common Tasks
          </v-tab>
          <v-tab :to="{ name: 'settings-tags' }" exact class="justify-start">
            <v-icon start size="small">mdi-tag</v-icon>
            Tags
          </v-tab>
        </v-tabs>
      </div>
      <div class="settings__content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.settings {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__tabs {
    .v-tabs :deep(.v-slide-group__prev, .v-slide-group__next) {
      min-width: initial;
      flex-basis: auto;
    }

    @media #{map.get(variables.$display-breakpoints, 'xs')} {
      .v-tabs :deep(.v-tab) {
        font-size: 0.7rem;
        padding: 0 8px;
      }
    }
  }

  &__content {
    flex-grow: 1;
  }
}

@media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
  .settings {
    flex-direction: row;

    &__tabs {
      flex: 0 0 calc(100% / 6 - 12px);
    }
  }
}
</style>
