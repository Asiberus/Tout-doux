<script setup lang="ts">
import { DailyTaskAction } from '@/models/daily-task.model'
import {
  DailyActionOptions,
  getActionChipColor,
  getActionChipTextColor,
  getLiteralFormOfDailyActionEnum,
} from '@/utils/daily-task.utils'
import { computed } from 'vue'

// Contrat unidirectionnel : le chip n'écrit jamais l'action, il émet `update` et laisse le
// propriétaire de la donnée décider. Un `v-model` ici reviendrait à muter un prop du parent.
const props = defineProps<{
  action: DailyTaskAction | null | undefined
  editable?: boolean
}>()

const emit = defineEmits<{
  update: [action: DailyTaskAction | null]
}>()

const text = computed<string>(() =>
  props.action ? getLiteralFormOfDailyActionEnum(props.action) : ''
)
const color = computed<string>(() => getActionChipColor(props.action))
const textColor = computed<string>(() => getActionChipTextColor(props.action))

function updateAction(value: DailyTaskAction | null): void {
  emit('update', value)
}
</script>

<template>
  <div>
    <template v-if="editable">
      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-chip v-bind="menuProps" size="small" :color variant="flat" class="rounded-lg">
            <template v-if="action">
              <span class="font-weight-bold" :class="textColor">{{ text }}</span>
            </template>
            <template v-else>
              <v-icon icon="mdi-bullseye-arrow" />
            </template>
          </v-chip>
        </template>
        <v-list>
          <v-list-item
            v-for="option in DailyActionOptions"
            :key="option.value ?? 'none'"
            density="compact"
            @click="updateAction(option.value)">
            <span :class="{ 'font-italic text-grey': !option.value }">
              {{ option.text }}
            </span>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    <template v-else>
      <v-chip :color="color" size="small" variant="flat" class="rounded-lg">
        <span class="font-weight-bold" :class="textColor">{{ text }}</span>
      </v-chip>
    </template>
  </div>
</template>
