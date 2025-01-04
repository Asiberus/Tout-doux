<script setup lang="ts">
import ProgressWheel from '@/components/ProgressWheel.vue'
import { ProgressWheelMode } from '@/models/preferences.model'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { usePreferencesStore } from '@/store'
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()
const preferencesStore = usePreferencesStore()

const progressWheelSize = computed<'x-small' | 'small' | 'medium' | 'large' | 'x-large'>(() => {
  if (display.xs) return 'x-small'
  if (display.smAndDown) return 'small'
  else if (display.width < 1600) return 'medium'
  else return 'x-large'
})

function updatePreferences(progressWheelMode: ProgressWheelMode): void {
  preferencesStore.updatePreferences({ progressWheelMode })
}
</script>

<template>
  <div v-if="preferences">
    <TertiaryTitle>Preferences</TertiaryTitle>

    <p class="text-subtitle-1 mb-1">
      You can here personalize the layout and the behavior of some components.
    </p>

    <h5 class="text-h6 mb-2">Progress Wheel</h5>
    <div class="progress-wheel-wrapper">
      <template v-for="mode of [ProgressWheelMode.Number, ProgressWheelMode.Percent]">
        <v-sheet
          v-ripple
          class="progress-wheel-card rounded-lg"
          :class="{ selected: preferencesStore.preferences.progressWheelMode === mode }"
          @click="updatePreferences(mode)">
          <template v-if="preferencesStore.preferences.progressWheelMode === mode">
            <v-icon class="radio-button" color="accent">mdi-radiobox-marked</v-icon>
          </template>
          <template v-else>
            <v-icon class="radio-button">mdi-radiobox-blank</v-icon>
          </template>

          <ProgressWheel
            :mode
            :size="progressWheelSize"
            value="14"
            max="20"
            color="green-accent-2" />
        </v-sheet>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.progress-wheel-wrapper {
  display: flex;
  gap: 8px;

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    flex-direction: column;
  }

  .progress-wheel-card {
    flex-grow: 1;
    position: relative;
    display: flex;
    justify-content: center;
    padding: 24px 0;
    background-color: transparent;
    border: 2px solid var(--v-secondary-base);
    cursor: pointer;

    @media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
      // We don't display hover for mobile
      &:hover {
        background-color: var(--v-secondary-darken1);
      }
    }

    &.selected {
      border-color: var(--v-accent-base);
    }

    .radio-button {
      position: absolute;
      top: 16px;
      left: 16px;
    }
  }
}
</style>
