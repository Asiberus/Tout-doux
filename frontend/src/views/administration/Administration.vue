<script setup lang="ts">
import MainTitle from '@/components/MainTitle.vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()
</script>

<template>
  <div>
    <MainTitle icon="mdi-security" class="mb-2 mb-md-6">Administration</MainTitle>

    <div class="administration">
      <div class="administration__tabs">
        <v-tabs
          :direction="display.mdAndUp ? 'vertical' : undefined"
          color="accent"
          show-arrows
          bg-color="transparent">
          <v-tab :to="{ name: 'administration-user-list' }" exact class="justify-start">
            <v-icon start size="small">mdi-account-group</v-icon>
            User List
          </v-tab>
          <v-tab :to="{ name: 'administration-feedback' }" exact class="justify-start">
            <v-icon start size="small">mdi-comment-quote</v-icon>
            Feedback
          </v-tab>
        </v-tabs>
      </div>
      <div class="administration__content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.administration {
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
  .administration {
    flex-direction: row;

    &__tabs {
      flex: 0 0 calc(100% / 6 - 12px);
    }
  }
}
</style>
