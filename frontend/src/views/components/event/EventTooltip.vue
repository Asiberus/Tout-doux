<script setup lang="ts">
import ProjectChip from '@/components/ProjectChip.vue'
import { EventModel } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import moment from 'moment'
import { computed } from 'vue'

const props = defineProps<{
  event: EventModel
}>()

defineEmits<{
  update: [event: EventModel]
}>()

const isEditDisabled = computed<boolean>(() =>
  props.event.project ? props.event.project.archived : false
)

function isDateEqual(date1: string, date2: string): boolean {
  return moment(date1).isSame(date2, 'day')
}
</script>

<template>
  <v-card>
    <v-toolbar color="event">
      <v-toolbar-title :title="event.name"> {{ event.name }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="!isEditDisabled" icon @click="$emit('update', event)">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-text>
      <div class="d-flex align-center mb-2 text-white">
        <template v-if="!event.takesWholeDay">
          <div class="flex-shrink-0 d-flex align-center">
            <v-icon class="mr-2">mdi-calendar-clock</v-icon>
            <span>
              {{ dateFormat(event.startDate, 'D MMMM Y') }}
              <template v-if="event.startTime">{{ event.startTime }}</template>
            </span>
            <template v-if="event.endDate">
              <v-icon size="small" class="mx-1">mdi-arrow-right</v-icon>
              <span>
                <template v-if="!isDateEqual(event.startDate, event.endDate)">
                  {{ dateFormat(event.endDate, 'D MMMM Y') }}
                </template>
                <template v-if="event.endTime">{{ event.endTime }}</template>
              </span>
            </template>
          </div>
        </template>
        <template v-else>
          <v-icon title="Takes whole day" class="mr-2">mdi-white-balance-sunny</v-icon>
          <span>{{ dateFormat(event.startDate, 'D MMMM Y') }}</span>
        </template>

        <template v-if="event.project">
          <v-spacer class="mr-3" />
          <ProjectChip :project="event.project" />
        </template>
      </div>
      <p v-if="event.description">{{ event.description }}</p>
    </v-card-text>
  </v-card>
</template>
