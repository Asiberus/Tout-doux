<script setup lang="ts">
import ProjectAvatar from '@/components/ProjectAvatar.vue'
import { EventExtendedModel, EventModel, EventPostOrPatch } from '@/models/event.model'
import { Project } from '@/models/project.model'
import { dateFormat } from '@/pipes'
import { isPassed } from '@/utils/event.utils'
import EventDialog from '@/views/components/event/EventDialog.vue'
import moment from 'moment'
import { useDialogWidth } from '@/composables/useDialogWidth'
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { useDisplay } from 'vuetify'

const { xs, smAndUp } = useDisplay()
const { dialogWidth, dialogFullscreen } = useDialogWidth()

const props = withDefaults(
  defineProps<{
    event: EventModel | EventExtendedModel
    project?: Project
    color?: string
    changePassedTextColor?: boolean
    disabled?: boolean
    clickable?: boolean
    daySelected?: boolean
    showIcon?: boolean
    caret?: boolean
    marginBottom?: boolean
    relatedToDate?: string
    hoverBackground?: boolean
  }>(),
  { changePassedTextColor: true, project: undefined, color: undefined, hoverBackground: true }
)

const emit = defineEmits<{
  update: [event: { id: number; data: EventPostOrPatch }]
  delete: [id: number]
}>()

onMounted(() => {
  if (descriptionElement.value && xs.value)
    isDescriptionOverflowing.value =
      descriptionElement.value.scrollWidth > descriptionElement.value.clientWidth
})

const descriptionElement = useTemplateRef('descriptionElement')

const eventDialog = ref(false)
const displayDescription = ref(false)
const isDescriptionOverflowing = ref(false)

const cardColor = computed(() => {
  if (props.color) return props.color
  if (isPassed(props.event)) return 'passedEvent'

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
    icon: 'text-white',
    date: 'text-grey-lighten-3',
    name: 'text-white',
    description: 'text-grey-lighten-2',
  }

  let color: string
  if (isPassed(props.event) && props.changePassedTextColor) color = 'text-grey'
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
    <v-hover v-slot="{ isHovering, props: hoverProps }">
      <v-card
        v-bind="hoverProps"
        :color="cardColor"
        :disabled
        :ripple="false"
        class="rounded-lg"
        :class="{
          'cursor-default': !clickable,
          'mb-3': marginBottom,
          caret,
          'no-hover-bg': !hoverBackground,
        }"
        @click="onEventCardClick()">
        <v-card-text class="d-flex align-center pa-3 pa-sm-4">
          <v-icon
            v-if="showIcon"
            icon="mdi-calendar-clock"
            :class="[getTextColor('icon')]"
            :size="smAndUp ? 'large' : 'default'"
            class="mr-2 mr-sm-3 mr-md-4" />

          <template v-if="event.takesWholeDay">
            <v-icon
              icon="mdi-white-balance-sunny"
              title="Takes whole day"
              class="mr-2"
              :class="[getTextColor('icon')]" />
          </template>

          <div class="flex-grow-1 d-flex flex-column overflow-hidden">
            <div class="date-text font-weight-bold" :class="[getTextColor('date')]">
              <template v-if="event.takesWholeDay && !daySelected">
                <span title="Date" :class="[getTextColor('date')]">
                  {{ dateFormat(event.startDate, 'DD/MM/YY') }}
                </span>
              </template>

              <template v-if="!event.takesWholeDay">
                <span title="Start date" :class="[getTextColor('date')]">
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
                  <v-icon
                    icon="mdi-arrow-right"
                    :class="[getTextColor('date')]"
                    size="small"
                    class="mx-1" />
                  <span title="End date" :class="[getTextColor('date')]">
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
              class="text-body-medium text-sm-body-large font-weight-bold text-white"
              :class="[getTextColor('name')]"
              :title="event.name">
              {{ event.name }}
            </h3>

            <span
              v-if="event.description"
              ref="descriptionElement"
              class="text-body-small text-sm-body-medium"
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
              <ProjectAvatar :project="project" :hover="isHovering || xs" :small="xs">
              </ProjectAvatar>
            </router-link>
          </template>
        </v-card-text>
      </v-card>
    </v-hover>

    <v-dialog v-model="eventDialog" :width="dialogWidth" :fullscreen="dialogFullscreen">
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
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.v-card.caret {
  overflow: visible;
}

.caret::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -5px;
  width: 14px;
  height: 14px;
  background-color: inherit;
  transform: translateY(-50%) rotate(45deg);
}

.no-hover-bg :deep(.v-card__overlay) {
  opacity: 0 !important;
}

.date-text {
  display: flex;
  align-items: center;

  @media #{map.get(variables.$display-breakpoints, 'xs')} {
    font-size: 0.8rem;
  }
}
</style>
