<script setup lang="ts">
import { ProgressWheelMode } from '@/models/preferences.model'
import { computed } from 'vue'

const {
  mode = ProgressWheelMode.Number,
  value = 0,
  max = 100,
  color = 'white',
  size = 'medium',
} = defineProps<{
  mode?: ProgressWheelMode
  value?: number
  max?: number
  color?: string
  size?: 'x-small' | 'small' | 'medium' | 'large' | 'x-large'
}>()

const percentage = computed<number>(() => {
  if (max === 0) return 0
  return Math.round((value / max) * 100)
})

const computedSize = computed<number>(() => {
  if (size === 'x-large') return 250
  else if (size === 'large') return 200
  else if (size === 'medium') return 180
  else if (size === 'small') return 150
  else return 125 // for size === 'x-small'
})

const computedWidth = computed<number>(() => {
  if (size === 'x-large') return 20
  else if (size === 'large') return 18
  else if (size === 'medium') return 15
  else if (size === 'small') return 12
  else return 10 // for size === 'x-small'
})
</script>

<template>
  <v-progress-circular
    :model-value="percentage"
    :color
    :rotate="-90"
    :size="computedSize"
    :width="computedWidth">
    <div class="progress-wheel-content" :class="[size]">
      <template v-if="mode === ProgressWheelMode.Number">
        <div>
          <span class="value">{{ value }}</span>
          /
          <span class="max">{{ max }}</span>
        </div>
        <div class="text-caption">{{ percentage }}%</div>
      </template>
      <template v-if="mode === ProgressWheelMode.Percent">
        <div>
          <span class="value">{{ percentage }}</span>
          <span> %</span>
        </div>
        <div class="text-caption">{{ value }} / {{ max }}</div>
      </template>
    </div>
  </v-progress-circular>
</template>

<style scoped lang="scss">
.progress-wheel-content {
  display: flex;
  align-items: center;
  flex-direction: column;

  &.x-small {
    .value {
      font-size: 1.75rem;
    }
  }

  &.small {
    .value {
      font-size: 2rem;
    }
  }

  &.medium {
    .value {
      font-size: 2.5rem;
    }
  }

  &.large {
    .value {
      font-size: 3rem;
    }
  }

  &.x-large {
    .value {
      font-size: 3.5rem;
    }
  }

  .max {
    display: inline-block;
    transform: translateY(0.1rem);
  }
}
</style>
