<script setup lang="ts">
import ProgressWheel from '@/components/ProgressWheel.vue'
import { ProgressWheelMode } from '@/models/preferences.model'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { usePreferencesStore } from '@/store'
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const { xs, smAndDown, width } = useDisplay()
const preferencesStore = usePreferencesStore()

const progressWheelSize = computed<'x-small' | 'small' | 'medium' | 'large' | 'x-large'>(() => {
  if (xs.value) return 'x-small'
  if (smAndDown.value) return 'small'
  else if (width.value < 1600) return 'medium'
  else return 'x-large'
})

function updatePreferences(progressWheelMode: ProgressWheelMode): void {
  preferencesStore.updatePreferences({ progressWheelMode })
}
</script>

<template>
  <div v-if="preferencesStore.preferences">
    <TertiaryTitle>Preferences</TertiaryTitle>

    <p class="text-body-large mb-1">
      You can here personalize the layout and the behavior of some components.
    </p>

    <h5 class="text-title-large mb-2">Progress Wheel</h5>
    <div class="progress-wheel-wrapper">
      <template v-for="mode of [ProgressWheelMode.Number, ProgressWheelMode.Percent]" :key="mode">
        <v-sheet
          v-ripple
          class="progress-wheel-card rounded-lg"
          :class="{ selected: preferencesStore.loadedPreferences.progressWheelMode === mode }"
          @click="updatePreferences(mode)">
          <template v-if="preferencesStore.loadedPreferences.progressWheelMode === mode">
            <v-icon icon="mdi-radiobox-marked" class="radio-button" color="accent" />
          </template>
          <template v-else>
            <v-icon icon="mdi-radiobox-blank" class="radio-button" />
          </template>

          <ProgressWheel
            :mode
            :size="progressWheelSize"
            :value="14"
            :max="20"
            color="green-accent-2" />
        </v-sheet>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';
@use 'vuetify/lib/styles/settings/colors';

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
    border: 2px solid rgb(var(--v-theme-secondary));
    cursor: pointer;

    @media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
      // We don't display hover for mobile
      &:hover {
        background-color: map.get(colors.$grey, 'darken-4');
      }
    }

    &.selected {
      border-color: rgb(var(--v-theme-accent));
    }

    .radio-button {
      position: absolute;
      top: 16px;
      left: 16px;
    }
  }
}
</style>
