<template>
    <v-card class="d-flex flex-column">
        <div class="d-flex flex-column flex-sm-row gap-2 px-6 pt-4 pb-2">
            <h4 class="text-h5 text-sm-h4 flex-grow-1">
                <template v-if="event"> Update event </template>
                <template v-else> New event </template>

                <template v-if="relatedToDate">
                    for the {{ dateFormat(relatedToDate, 'DD MMMM Y') }}
                </template>
            </h4>

            <v-hover v-slot="{ hover }" v-if="event">
                <v-btn
                    @click="emitDeleteEvent()"
                    :color="hover || confirmDelete ? 'error' : null"
                    class="align-self-end align-self-sm-center">
                    {{ confirmDelete ? 'Are you sure ?' : 'Delete Event' }}
                </v-btn>
            </v-hover>
        </div>

        <v-card-text class="flex-grow-1 d-flex flex-column">
            <v-form
                ref="form"
                v-model="eventForm.valid"
                @submit.prevent="emitSubmitEvent()"
                class="flex-grow-1 d-flex flex-column gap-2">
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
                        @keyup.enter.ctrl="emitSubmitEvent()"
                        label="Description"
                        counter="150"
                        rows="1"
                        auto-grow
                        class="flex-grow-0">
                    </v-textarea>

                    <div class="d-flex flex-column flex-sm-row column-gap-6">
                        <div class="flex-grow-1">
                            <h6 class="text-subtitle-2 grey--text text--lighten-2 pl-1">Start</h6>
                            <div class="d-flex gap-2">
                                <v-menu
                                    v-model="startDatePicker"
                                    :close-on-content-click="false"
                                    transition="scale-transition"
                                    offset-y
                                    nudge-top="30"
                                    min-width="290">
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

                                <v-menu
                                    ref="startDateTimeMenu"
                                    v-model="startTimePicker"
                                    :close-on-content-click="false"
                                    transition="scale-transition"
                                    offset-y
                                    nudge-top="30"
                                    min-width="290">
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
                            </div>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="text-subtitle-2 grey--text text--lighten-2 pl-1">End</h6>
                            <div class="d-flex gap-2">
                                <v-menu
                                    v-model="endDatePicker"
                                    :close-on-content-click="false"
                                    transition="scale-transition"
                                    offset-y
                                    nudge-top="30"
                                    min-width="290">
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

                                <v-menu
                                    ref="endDateTimeMenu"
                                    v-model="endTimePicker"
                                    :close-on-content-click="false"
                                    transition="scale-transition"
                                    offset-y
                                    nudge-top="30"
                                    min-width="290">
                                    <template #activator="{ attrs, on }">
                                        <v-text-field
                                            v-bind="attrs"
                                            v-on="on"
                                            v-model="eventForm.data.endTime"
                                            @change="endTimePicker = false"
                                            :error="showDateError && !!eventForm.data.endTime"
                                            :error-messages="endTimeErrorMessage"
                                            :disabled="
                                                !eventForm.data.endDate ||
                                                eventForm.data.takesWholeDay
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
                                        @click:minute="
                                            $refs.endDateTimeMenu.save(eventForm.data.endTime)
                                        ">
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

                <div
                    v-if="relatedToDate && relatedToDateError"
                    class="error-text text-body-2 orange--text">
                    <v-icon class="mr-2" color="orange">mdi-calendar-alert</v-icon>
                    Event must be related to the
                    {{ dateFormat(relatedToDate, 'DD MMMM Y') }}.
                </div>

                <div class="d-flex justify-end gap-2">
                    <v-btn
                        color="success"
                        text
                        type="submit"
                        class="flex-grow-1 flex-md-grow-0"
                        :disabled="!eventForm.valid || relatedToDateError">
                        {{ event ? 'update' : 'create' }}
                    </v-btn>
                    <v-btn plain class="flex-grow-1 flex-md-grow-0" @click="emitCloseEvent()"
                        >cancel</v-btn
                    >
                </div>
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
    @Prop({ required: false }) startDatePlaceholder?: string

    confirmDelete = false
    eventForm = {
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
        this.populateForm(this.event)
    }

    @Watch('isDialogOpen')
    private onIsDialogOpenChanges(value: boolean): void {
        if (!value) return

        this.confirmDelete = false
        this.form.resetValidation()
        this.populateForm(this.event)
        if (!this.event) this.inputName.focus()
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
        } else {
            const startDate = this.startDatePlaceholder
                ? moment(this.startDatePlaceholder)
                : moment()

            this.eventForm.data = {
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

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

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
