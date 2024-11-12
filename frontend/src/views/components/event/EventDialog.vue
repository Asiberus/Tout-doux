<script setup lang="ts">
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { isEventRelatedToDate } from '@/utils/event.utils'
import moment from 'moment'
import { computed, onBeforeMount, ref, useTemplateRef, watch } from 'vue'

const { isDialogOpen, event, relatedToDate, startDatePlaceholder } = defineProps<{
  isDialogOpen: boolean
  event?: EventModel
  relatedToDate?: string
  startDatePlaceholder?: string
}>()

const emit = defineEmits<{
  submit: [data: EventPostOrPatch]
  update: [event: { id: number; data: EventPostOrPatch }]
  create: [data: EventPostOrPatch]
  delete: [id: number]
  close: []
}>()

onBeforeMount(() => populateForm(event))

const formRef = useTemplateRef('form')
const inputNameRef = useTemplateRef('name')

const confirmDelete = ref(false)
const eventForm = ref({
  valid: false,
  data: {
    name: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    takesWholeDay: false,
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'Event name is required',
      (value: string): boolean | string => value.length <= 50 || 'Max 50 characters',
    ],
    description: [(value: string): boolean | string => value.length <= 150 || 'Max 150 characters'],
    startDate: [(value: string): boolean | string => !!value || 'Start date is required'],
  },
})

const dateError = ref(false)
const startTimeError = ref(false)
const endTimeError = ref(false)
const relatedToDateError = ref(false)

const startDatePicker = ref(false)
const startTimePicker = ref(false)
const endDatePicker = ref(false)
const endTimePicker = ref(false)

const isPickerOpen = computed<boolean>(
  () => startDatePicker.value || startTimePicker.value || endDatePicker.value || endTimePicker.value
)
const showDateError = computed<boolean>(() => dateError.value && !isPickerOpen.value)
const showStartTimeError = computed<boolean>(() => startTimeError.value && !isPickerOpen.value)
const showEndTimeError = computed<boolean>(() => endTimeError.value && !isPickerOpen.value)
const dateErrorMessage = computed<string | null>(() =>
  showDateError.value ? 'End date must be set after the start date' : null
)
const startTimeErrorMessage = computed<string | null>(() =>
  showStartTimeError.value ? 'Start time must be provided for event that occur within a day' : null
)
const endTimeErrorMessage = computed<string | null>(() =>
  showEndTimeError.value ? 'End time must be provided for event that occur within a day' : null
)

watch(
  () => isDialogOpen,
  (value: boolean) => {
    if (!value) return

    confirmDelete.value = false
    formRef.resetValidation()
    populateForm(event)
    if (!event) inputNameRef.focus()
  }
)

watch(
  () => eventForm.value.data,
  () => {
    const { startDate, endDate, takesWholeDay } = eventForm.value.data

    if (takesWholeDay) {
      resetStartTime()
      resetEndDate()
    }
    if (startDate && endDate) validateDate()
    if (relatedToDate) {
      const tempEvent = <EventModel>{ startDate, endDate }
      relatedToDateError.value = !isEventRelatedToDate(tempEvent, relatedToDate)
    }
  }
)

function validateDate(): void {
  const { data } = eventForm.value

  const startDate = moment(`${data.startDate}T${data.startTime ? data.startTime : '00:00'}`)
  const endDate = moment(`${data.endDate}T${data.endTime ? data.endTime : '00:00'}`)

  dateError.value = endDate.isSameOrBefore(startDate)
  startTimeError.value = data.startDate === data.endDate && !data.startTime
  endTimeError.value = data.startDate === data.endDate && !data.endTime
}

function populateForm(eventToUpdate?: EventModel): void {
  if (eventToUpdate) {
    eventForm.value.data = {
      name: eventToUpdate.name,
      description: eventToUpdate.description ?? '',
      startDate: eventToUpdate.startDate,
      startTime: eventToUpdate.startTime ?? '',
      endDate: eventToUpdate.endDate ?? '',
      endTime: eventToUpdate.endTime ?? '',
      takesWholeDay: eventToUpdate.takesWholeDay,
    }
  } else {
    const startDate = startDatePlaceholder ? moment(startDatePlaceholder) : moment()

    eventForm.value.data = {
      name: '',
      description: '',
      startDate: startDate.format('YYYY-MM-DD'),
      startTime: '',
      endDate: '',
      endTime: '',
      takesWholeDay: false,
    }
  }
}

function emitSubmitEvent(): void {
  if (!eventForm.value.valid || relatedToDateError.value) return

  const { data } = eventForm.value
  const eventToSubmit: EventPostOrPatch = {
    name: data.name,
    description: data.description || null,
    startDate: data.startDate,
    startTime: data.startTime || null,
    endDate: data.endDate || null,
    endTime: data.endTime || null,
    takesWholeDay: data.takesWholeDay,
  }

  emit('submit', eventToSubmit)
  if (event) emit('update', { id: eventToSubmit.id, data: eventToSubmit })
  else emit('create', eventToSubmit)
}

function emitDeleteEvent(): void {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }

  if (event) emit('delete', event.id)
}

function emitCloseEvent(): void {
  emit('close')
}

function resetStartTime(): void {
  eventForm.value.data.startTime = ''
  startTimeError.value = false
}

function resetEndDate(): void {
  eventForm.value.data.endDate = ''
  eventForm.value.data.endTime = ''
  dateError.value = false
  startTimeError.value = false
  endTimeError.value = false
}

function allowedMinutes(value: number): boolean {
  return value % 5 === 0
}

function formattedDate(value: string): string {
  return value ? moment(value).format('D MMM. Y') : ''
}
</script>

<template>
  <v-card class="d-flex flex-column">
    <div class="d-flex flex-column flex-sm-row gap-2 px-6 pt-4 pb-2">
      <h4 class="text-h5 text-sm-h4 flex-grow-1">
        <template v-if="event">Update event</template>
        <template v-else>New event</template>

        <template v-if="relatedToDate">
          for the {{ dateFormat(relatedToDate, 'DD MMMM Y') }}
        </template>
      </h4>

      <v-hover v-if="event" v-slot="{ hover }">
        <v-btn
          :color="hover || confirmDelete ? 'error' : null"
          class="align-self-end align-self-sm-center"
          @click="emitDeleteEvent()">
          {{ confirmDelete ? 'Are you sure ?' : 'Delete Event' }}
        </v-btn>
      </v-hover>
    </div>

    <v-card-text class="flex-grow-1 d-flex flex-column">
      <v-form
        ref="form"
        v-model="eventForm.valid"
        class="flex-grow-1 d-flex flex-column gap-2"
        @submit.prevent="emitSubmitEvent()">
        <div class="inputs-wrapper">
          <v-text-field
            ref="name"
            v-model="eventForm.data.name"
            :rules="eventForm.rules.name"
            label="Name"
            counter="50"
            requried
            :autofocus="!event"
            class="flex-grow-0">
          </v-text-field>

          <v-textarea
            v-model="eventForm.data.description"
            :rules="eventForm.rules.description"
            label="Description"
            counter="150"
            rows="1"
            auto-grow
            class="flex-grow-0"
            @keyup.enter.ctrl="emitSubmitEvent()">
          </v-textarea>

          <div class="d-flex flex-column flex-sm-row column-gap-6">
            <div class="flex-grow-1">
              <h6 class="text-subtitle-2 text-grey-lighten-2 pl-1">Start</h6>
              <div class="d-flex gap-2">
                <v-menu
                  v-model="startDatePicker"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  nudge-top="30"
                  min-width="290">
                  <template #activator="{ props }">
                    <v-text-field
                      v-bind="props"
                      :model-value="formattedDate(eventForm.data.startDate)"
                      :rules="eventForm.rules.startDate"
                      required
                      label="Date"
                      prepend-icon="mdi-calendar-today"
                      readonly>
                    </v-text-field>
                  </template>
                  <v-date-picker
                    v-model="eventForm.data.startDate"
                    no-title
                    scrollable
                    show-adjacent-months
                    :first-day-of-week="1"
                    @change="startDatePicker = false">
                  </v-date-picker>
                </v-menu>

                <v-menu
                  ref="startDateTimeMenu"
                  v-model="startTimePicker"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  nudge-top="30"
                  min-width="290">
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="eventForm.data.startTime"
                      :disabled="eventForm.data.takesWholeDay"
                      :error-messages="startTimeErrorMessage"
                      label="Time"
                      clearable
                      readonly
                      class="two-row-error"
                      v-bind="props"
                      @change="startTimePicker = false">
                    </v-text-field>
                  </template>
                  <v-time-picker
                    v-if="startTimePicker"
                    v-model="eventForm.data.startTime"
                    format="24hr"
                    :allowed-minutes="allowedMinutes"
                    @click:minute="$refs.startDateTimeMenu.save(eventForm.data.startTime)">
                  </v-time-picker>
                </v-menu>
              </div>
            </div>
            <div class="flex-grow-1">
              <h6 class="text-subtitle-2 text-grey-lighten-2 pl-1">End</h6>
              <div class="d-flex gap-2">
                <v-menu
                  v-model="endDatePicker"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  nudge-top="30"
                  min-width="290">
                  <template #activator="{ props }">
                    <v-text-field
                      :model-value="formattedDate(eventForm.data.endDate)"
                      :disabled="eventForm.data.takesWholeDay"
                      :error-messages="dateErrorMessage"
                      required
                      label="Date"
                      prepend-icon="mdi-calendar"
                      readonly
                      clearable
                      v-bind="props"
                      class="two-row-error"
                      @click:clear="resetEndDate()">
                    </v-text-field>
                  </template>
                  <v-date-picker
                    v-model="eventForm.data.endDate"
                    no-title
                    scrollable
                    show-adjacent-months
                    :first-day-of-week="1"
                    @change="
                      endDatePicker = false
                      endTimePicker = true
                    ">
                  </v-date-picker>
                </v-menu>

                <v-menu
                  ref="endDateTimeMenu"
                  v-model="endTimePicker"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  nudge-top="30"
                  min-width="290">
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="eventForm.data.endTime"
                      :error="showDateError && !!eventForm.data.endTime"
                      :error-messages="endTimeErrorMessage"
                      :disabled="!eventForm.data.endDate || eventForm.data.takesWholeDay"
                      label="Time"
                      clearable
                      readonly
                      class="two-row-error"
                      v-bind="props"
                      @change="endTimePicker = false">
                    </v-text-field>
                  </template>
                  <v-time-picker
                    v-if="endTimePicker"
                    v-model="eventForm.data.endTime"
                    format="24hr"
                    :allowed-minutes="allowedMinutes"
                    @click:minute="$refs.endDateTimeMenu.save(eventForm.data.endTime)">
                  </v-time-picker>
                </v-menu>
              </div>
            </div>
          </div>

          <div class="d-inline-block">
            <v-switch v-model="eventForm.data.takesWholeDay" hide-details>
              <template #label>
                Takes whole day
                <v-icon class="ml-2">mdi-white-balance-sunny</v-icon>
              </template>
            </v-switch>
          </div>
        </div>

        <div v-if="relatedToDate && relatedToDateError" class="error-text text-body-2 text-orange">
          <v-icon class="mr-2" color="orange">mdi-calendar-alert</v-icon>
          Event must be related to the
          {{ dateFormat(relatedToDate, 'DD MMMM Y') }}.
        </div>

        <div class="d-flex justify-end gap-2">
          <v-btn variant="plain" class="flex-grow-1 flex-md-grow-0" @click="emitCloseEvent()">
            cancel
          </v-btn>
          <v-btn
            color="success"
            variant="text"
            type="submit"
            class="flex-grow-1 flex-md-grow-0"
            :disabled="!eventForm.valid || relatedToDateError">
            {{ event ? 'update' : 'create' }}
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .inputs-wrapper {
    flex: 1 0 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.v-input--switch {
  margin-top: 0;
}
</style>
