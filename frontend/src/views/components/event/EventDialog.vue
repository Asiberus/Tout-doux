<template>
    <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
            <h4 class="text-h4">
                <template v-if="event"> Update Event </template>
                <template v-else> New Event </template>

                <template v-if="relatedToDate">
                    for the {{ dateFormat(relatedToDate, 'DD MMMM Y') }}
                </template>
            </h4>
            <div v-if="event">
                <v-hover v-slot="{ hover }">
                    <v-btn
                        @click="emitDeleteEvent()"
                        :color="hover || confirmDelete ? 'error' : null">
                        {{ confirmDelete ? 'Are you sure ?' : 'Delete Event' }}
                    </v-btn>
                </v-hover>
            </div>
        </v-card-title>

        <v-card-text>
            <v-form ref="form" v-model="eventForm.valid" @submit.prevent="emitSubmitEvent()">
                <v-row>
                    <v-col>
                        <v-text-field
                            ref="name"
                            v-model="eventForm.data.name"
                            :rules="eventForm.rules.name"
                            label="Name"
                            counter="50"
                            requried
                            :autofocus="!event">
                        </v-text-field>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-textarea
                            v-model="eventForm.data.description"
                            :rules="eventForm.rules.description"
                            @keyup.enter.ctrl="emitSubmitEvent()"
                            label="Description"
                            counter="150"
                            rows="1"
                            auto-grow>
                        </v-textarea>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col class="pb-1 pr-6">
                        <h6 class="text-subtitle-2 grey--text text--lighten-2 pl-1">Start</h6>
                    </v-col>
                    <v-col class="pb-1 pl-6">
                        <h6 class="text-subtitle-2 grey--text text--lighten-2 pl-1">End</h6>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col class="pr-0 pt-0">
                        <v-menu
                            v-model="startDatePicker"
                            :close-on-content-click="false"
                            transition="scale-transition"
                            offset-y
                            min-width="auto">
                            <template #activator="{ attrs, on }">
                                <v-text-field
                                    :value="formattedDate(eventForm.data.startDate)"
                                    :rules="eventForm.rules.startDate"
                                    required
                                    label="Date"
                                    prepend-icon="mdi-calendar-today"
                                    readonly
                                    v-bind="attrs"
                                    v-on="on">
                                </v-text-field>
                            </template>
                            <v-date-picker
                                v-model="eventForm.data.startDate"
                                @change="startDatePicker = false"
                                no-title
                                scrollable
                                show-adjacent-months
                                :first-day-of-week="1">
                            </v-date-picker>
                        </v-menu>
                    </v-col>

                    <v-col class="pr-6 pt-0">
                        <v-menu
                            ref="startDateTimeMenu"
                            v-model="startTimePicker"
                            :close-on-content-click="false"
                            transition="scale-transition"
                            offset-y
                            min-width="auto">
                            <template #activator="{ attrs, on }">
                                <v-text-field
                                    v-bind="attrs"
                                    v-on="on"
                                    v-model="eventForm.data.startTime"
                                    @change="startTimePicker = false"
                                    :disabled="eventForm.data.takesWholeDay"
                                    :error-messages="startTimeErrorMessage"
                                    label="Time"
                                    clearable
                                    readonly
                                    class="two-row-error">
                                </v-text-field>
                            </template>
                            <v-time-picker
                                v-if="startTimePicker"
                                v-model="eventForm.data.startTime"
                                format="24hr"
                                :allowed-minutes="allowedMinutes"
                                @click:minute="
                                    $refs.startDateTimeMenu.save(eventForm.data.startTime)
                                ">
                            </v-time-picker>
                        </v-menu>
                    </v-col>

                    <v-col class="pl-6 pr-0 pt-0">
                        <v-menu
                            v-model="endDatePicker"
                            :close-on-content-click="false"
                            transition="scale-transition"
                            offset-y
                            min-width="auto">
                            <template #activator="{ attrs, on }">
                                <v-text-field
                                    v-bind="attrs"
                                    v-on="on"
                                    @click:clear="resetEndDate()"
                                    :value="formattedDate(eventForm.data.endDate)"
                                    :disabled="eventForm.data.takesWholeDay"
                                    :error-messages="dateErrorMessage"
                                    required
                                    label="Date"
                                    prepend-icon="mdi-calendar"
                                    readonly
                                    clearable
                                    class="two-row-error">
                                </v-text-field>
                            </template>
                            <v-date-picker
                                v-model="eventForm.data.endDate"
                                @change="
                                    endDatePicker = false
                                    endTimePicker = true
                                "
                                no-title
                                scrollable
                                show-adjacent-months
                                :first-day-of-week="1">
                            </v-date-picker>
                        </v-menu>
                    </v-col>

                    <v-col class="pt-0">
                        <v-menu
                            ref="endDateTimeMenu"
                            v-model="endTimePicker"
                            :close-on-content-click="false"
                            transition="scale-transition"
                            offset-y
                            min-width="auto">
                            <template #activator="{ attrs, on }">
                                <v-text-field
                                    v-bind="attrs"
                                    v-on="on"
                                    v-model="eventForm.data.endTime"
                                    @change="endTimePicker = false"
                                    :error="showDateError && !!eventForm.data.endTime"
                                    :error-messages="endTimeErrorMessage"
                                    :disabled="
                                        !eventForm.data.endDate || eventForm.data.takesWholeDay
                                    "
                                    label="Time"
                                    clearable
                                    readonly
                                    class="two-row-error">
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
                    </v-col>
                </v-row>

                <v-row>
                    <v-col>
                        <div class="d-inline-block">
                            <v-switch v-model="eventForm.data.takesWholeDay">
                                <template #label>
                                    Takes whole day
                                    <v-icon class="ml-2">mdi-white-balance-sunny</v-icon>
                                </template>
                            </v-switch>
                        </div>
                    </v-col>
                </v-row>

                <v-card-actions class="d-flex mt-3">
                    <v-fade-transition>
                        <div
                            v-if="relatedToDate && relatedToDateError"
                            class="d-flex align-center text-body-2 orange--text">
                            <v-icon class="mr-2" color="orange">mdi-calendar-alert</v-icon>
                            Event must be related to the
                            {{ dateFormat(relatedToDate, 'DD MMMM Y') }}.
                        </div>
                    </v-fade-transition>

                    <v-spacer></v-spacer>
                    <v-btn
                        color="success"
                        text
                        type="submit"
                        :disabled="!eventForm.valid || relatedToDateError">
                        {{ event ? 'update' : 'create' }}
                    </v-btn>
                    <v-btn plain class="ml-2" @click="emitCloseEvent()">cancel</v-btn>
                </v-card-actions>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { EventModel, EventPostOrPatch } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { isEventRelatedToDate } from '@/utils/event.utils'
import moment from 'moment'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class EventDialog extends Vue {
    @Prop({ required: true }) isDialogOpen!: boolean
    @Prop({ required: false }) event?: EventModel
    @Prop({ required: false }) relatedToDate?: string

    confirmDelete = false
    eventForm = {
        valid: false,
        data: {
            name: '',
            description: '',
            startDate: moment().format('YYYY-MM-DD'),
            startTime: '',
            endDate: '',
            endTime: '',
            takesWholeDay: false,
        },
        rules: {
            name: [
                (value: string) => !!value || 'Event name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
            description: [(value: string) => value.length <= 150 || 'Max 150 characters'],
            startDate: [(value: string) => !!value || 'Start date is required'],
        },
    }

    dateError = false
    startTimeError = false
    endTimeError = false
    relatedToDateError = false

    startDatePicker = false
    startTimePicker = false
    endDatePicker = false
    endTimePicker = false

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get inputName(): Vue & { focus: () => void } {
        return this.$refs.name as Vue & { focus: () => void }
    }

    get formattedDate(): (value: string) => string {
        return date => (date ? moment(date).format('D MMM. Y') : '')
    }

    get isPickerOpen(): boolean {
        return (
            this.startDatePicker || this.startTimePicker || this.endDatePicker || this.endTimePicker
        )
    }

    get showDateError(): boolean {
        return this.dateError && !this.isPickerOpen
    }

    get showStartTimeError(): boolean {
        return this.startTimeError && !this.isPickerOpen
    }

    get showEndTimeError(): boolean {
        return this.endTimeError && !this.isPickerOpen
    }

    get dateErrorMessage(): string | null {
        return this.showDateError ? 'End date must be set after the start date' : null
    }

    get startTimeErrorMessage(): string | null {
        return this.showStartTimeError
            ? 'Start time must be provided for event that occur within a day'
            : null
    }

    get endTimeErrorMessage(): string | null {
        return this.showEndTimeError
            ? 'End time must be provided for event that occur within a day'
            : null
    }

    beforeMount(): void {
        if (this.event) this.populateForm(this.event)
    }

    @Watch('isDialogOpen')
    private onIsDialogOpenChanges(value: boolean): void {
        if (!value) return

        this.confirmDelete = false
        this.form.resetValidation()
        this.populateForm(this.event)
        this.inputName.focus()
    }

    @Watch('eventForm.data', { deep: true })
    private onEventFormChanges(): void {
        const { startDate, endDate, takesWholeDay } = this.eventForm.data

        if (takesWholeDay) {
            this.resetStartTime()
            this.resetEndDate()
        }
        if (startDate && endDate) this.validateDate()
        if (this.relatedToDate) {
            const tempEvent = <EventModel>{ startDate, endDate }
            this.relatedToDateError = !isEventRelatedToDate(tempEvent, this.relatedToDate)
        }
    }

    private validateDate(): void {
        const { data } = this.eventForm

        const startDate = moment(`${data.startDate}T${data.startTime ? data.startTime : '00:00'}`)
        const endDate = moment(`${data.endDate}T${data.endTime ? data.endTime : '00:00'}`)

        this.dateError = endDate.isSameOrBefore(startDate)
        this.startTimeError = data.startDate === data.endDate && !data.startTime
        this.endTimeError = data.startDate === data.endDate && !data.endTime
    }

    private populateForm(event?: EventModel): void {
        if (event) {
            this.eventForm.data = {
                name: event.name,
                description: event.description ?? '',
                startDate: event.startDate,
                startTime: event.startTime ?? '',
                endDate: event.endDate ?? '',
                endTime: event.endTime ?? '',
                takesWholeDay: event.takesWholeDay,
            }
        } else
            this.eventForm.data = {
                name: '',
                description: '',
                startDate: moment().format('YYYY-MM-DD'),
                startTime: '',
                endDate: '',
                endTime: '',
                takesWholeDay: false,
            }
    }

    emitSubmitEvent(): void {
        if (!this.eventForm.valid || this.relatedToDateError) return

        const { data } = this.eventForm
        const event: EventPostOrPatch = {
            name: data.name,
            description: data.description || null,
            startDate: data.startDate,
            startTime: data.startTime || null,
            endDate: data.endDate || null,
            endTime: data.endTime || null,
            takesWholeDay: data.takesWholeDay,
        }

        this.$emit('submit', event)
        if (this.event) this.$emit('update', { id: this.event.id, data: event })
        else this.$emit('create', event)
    }

    emitDeleteEvent(): void {
        if (!this.confirmDelete) {
            this.confirmDelete = true
            return
        }

        if (this.event) this.$emit('delete', this.event.id)
    }

    emitCloseEvent(): void {
        this.$emit('close')
    }

    resetStartTime(): void {
        this.eventForm.data.startTime = ''
        this.startTimeError = false
    }

    resetEndDate(): void {
        this.eventForm.data.endDate = ''
        this.eventForm.data.endTime = ''
        this.dateError = false
        this.startTimeError = false
        this.endTimeError = false
    }

    allowedMinutes(value: number): boolean {
        return value % 5 === 0
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>
