<script setup lang="ts">
import { DailyTaskAction } from '@/models/daily-task.model'
import {
  DailyActionOptions,
  getActionChipColor,
  getActionChipTextColor,
  getLiteralFormOfDailyActionEnum,
} from '@/utils/daily-task.utils'
import { computed } from 'vue'

const action = defineModel<DailyTaskAction | null>('action')

defineProps<{
  editable?: boolean
}>()

const emit = defineEmits<{
  update: [action: DailyTaskAction | null]
}>()

const text = computed<string>(() =>
  action.value ? getLiteralFormOfDailyActionEnum(action.value) : ''
)
const color = computed<string>(() => (action.value ? getActionChipColor(action.value) : ''))
const textColor = computed<string>(() => (action.value ? getActionChipTextColor(action.value) : ''))

function updateAction(value: DailyTaskAction | null): void {
  action.value = value
  emit('update', action) // We send both event to meet all possibilities
}
</script>

<template>
  <div>
    <template v-if="editable">
      <v-menu offset-y offset-overflow>
        <template #activator="{ props: menuProps }">
          <v-chip v-bind="menuProps" size="small" :color class="rounded-lg">
            <template v-if="action">
              <span class="font-weight-bold" :class="textColor">{{ text }}</span>
            </template>
            <template v-else>
              <v-icon size="small">mdi-bullseye-arrow</v-icon>
            </template>
          </v-chip>
        </template>
        <v-list>
          <v-list-item
            v-for="option in DailyActionOptions"
            :key="option.value"
            density="compact"
            @click="updateAction(option.value)">
            <span :class="{ 'font-italic grey--text': !option.value }">
              {{ option.text }}
            </span>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    <template v-else>
      <v-chip :color="color" size="small" class="rounded-lg">
        <span class="font-weight-bold" :class="textColor">{{ text }}</span>
      </v-chip>
    </template>
  </div>
</template>
