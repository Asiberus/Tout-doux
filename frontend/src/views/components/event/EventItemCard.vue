<script setup lang="ts">
import ProjectAvatar from '@/components/ProjectAvatar.vue'
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { Project } from '@/models/project.model'
import { dateFormat } from '@/pipes'
import { isPassed } from '@/utils/event.utils'
import EventDialog from '@/views/components/event/EventDialog.vue'
import moment from 'moment'
import { getDialogWidth } from '@/utils/dialog.utils'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const props = withDefaults(
  defineProps<{
    event: EventModel
    project?: Project
    color?: string
    changePassedTextColor?: boolean
    disabled?: boolean
    clickable?: boolean
    daySelected?: boolean
    showIcon?: boolean
    caret?: boolean
    marginBottom?: boolean
    relatedToDate?: boolean
  }>(),
  { changePassedTextColor: true, project: null, color: null }
)

const emit = defineEmits<{
  update: [event: { id: number; data: EventPostOrPatch }]
  delete: [id: number]
}>()

onMounted(() => {
  if (descriptionElement && display.xs)
    isDescriptionOverflowing.value =
      descriptionElement.value.scrollWidth > descriptionElement.value.clientWidth
})

const descriptionElement = useTemplateRef('descriptionElement')

const eventDialog = ref(false)
const displayDescription = ref(false)
const isDescriptionOverflowing = ref(false)

const cardColor = computed<string | null>(() => {
  if (props.color) return props.color
  if (isPassed(props.event)) return 'null' // TODO : 'null' or null ?

  return 'event'
})

function onEventCardClick(): void {
  if (!props.clickable) {
    if (!props.event.description) return

    displayDescription.value = !displayDescription.value
  } else if (!props.disabled) {
    eventDialog.value = true
  }
}

function emitUpdateEvent(data: EventPostOrPatch): void {
  eventDialog.value = false
  emit('update', { id: props.event.id, data })
}

function emitDeleteEvent(): void {
  eventDialog.value = false
  emit('delete', props.event.id)
}

function getTextColor(section: 'icon' | 'date' | 'name' | 'description'): string {
  const colorConfig = {
    icon: 'white--text',
    date: 'grey--text text--lighten-3',
    name: 'white--text',
    description: 'grey-text text--lighten-2',
  }

  let color: string
  if (isPassed(props.event) && props.changePassedTextColor) color = 'grey--text'
  else color = colorConfig[section]

  if (props.project?.archived) color += ' opacity-60'
  return color
}

function isDateEqual(date1: string, date2: string): boolean {
  return moment(date1).isSame(date2, 'day')
}
</script>

<template>
  <div>
    <v-hover v-slot="{ hover }">
      <v-card
        :color="cardColor"
        :disabled
        :ripple="false"
        class="rounded-lg"
        :class="{ 'cursor-default': !clickable, 'mb-3': marginBottom, caret }"
        @click="onEventCardClick()">
        <v-card-text class="d-flex align-center pa-3 pa-sm-4">
          <v-icon
            v-if="showIcon"
            :class="[getTextColor('icon')]"
            :size="display.smAndUp ? 'large' : 'default'"
            class="mr-2 mr-sm-3 mr-md-4">
            mdi-calendar-clock
          </v-icon>

          <template v-if="event.takesWholeDay">
            <v-icon title="Takes whole day" class="mr-2" :class="[getTextColor('icon')]">
              mdi-white-balance-sunny
            </v-icon>
          </template>

          <div class="flex-grow-1 d-flex flex-column overflow-hidden">
            <div class="date-text text-grey font-weight-bold" :class="[getTextColor('date')]">
              <template v-if="event.takesWholeDay && !daySelected">
                <span title="Date">
                  {{ dateFormat(event.startDate, 'DD/MM/YY') }}
                </span>
              </template>

              <template v-if="!event.takesWholeDay">
                <span title="Start date">
                  <template
                    v-if="
                      !daySelected ||
                      (event.endDate && !isDateEqual(event.startDate, event.endDate))
                    ">
                    {{ dateFormat(event.startDate, 'DD/MM/YY') }}
                  </template>
                  <template v-if="event.startTime">
                    {{ event.startTime }}
                  </template>
                </span>

                <template v-if="event.endDate">
                  <v-icon :class="[getTextColor('date')]" size="small" class="mx-1">
                    mdi-arrow-right
                  </v-icon>
                  <span title="End date">
                    <template v-if="!isDateEqual(event.startDate, event.endDate)">
                      {{ dateFormat(event.endDate, 'DD/MM/YY') }}
                    </template>
                    <template v-if="event.endTime">
                      {{ event.endTime }}
                    </template>
                  </span>
                </template>
              </template>
            </div>

            <h3
              class="text-body-2 text-sm-body-1 font-weight-bold text-white"
              :class="[getTextColor('name')]"
              :title="event.name">
              {{ event.name }}
            </h3>

            <span
              v-if="event.description"
              ref="description"
              class="text-caption text-sm-body-2"
              :class="[
                {
                  'text-truncate': !displayDescription,
                  'cursor-pointer': isDescriptionOverflowing,
                },
                getTextColor('description'),
              ]"
              :title="event.description">
              {{ event.description }}
            </span>
          </div>

          <template v-if="project">
            <router-link :to="{ name: 'project-detail', params: { id: project.id } }" class="ml-2">
              <ProjectAvatar :project="project" :hover="hover || display.xs" :small="display.xs">
              </ProjectAvatar>
            </router-link>
          </template>
        </v-card-text>
      </v-card>
    </v-hover>

    <v-dialog v-model="eventDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
      <EventDialog
        :event="event"
        :is-dialog-open="eventDialog"
        :related-to-date="relatedToDate"
        @submit="emitUpdateEvent"
        @delete="emitDeleteEvent"
        @close="eventDialog = false">
      </EventDialog>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.caret::after {
  content: '';
  position: absolute;
  top: calc(50% - 10px);
  left: -9px;
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 10px solid #000;
  border-right-color: inherit;
}

.date-text {
  display: flex;
  align-items: center;

  @media #{map-get($display-breakpoints, 'xs')} {
    font-size: 0.8rem;
  }
}
</style>
