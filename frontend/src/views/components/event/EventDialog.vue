<template>
    <v-card>
        <div class="d-flex justify-space-between align-center pa-4">
            <h2>
                {{ event ? 'Update Event' : 'New Event' }}
            </h2>
            <div>{{ eventForm.valid }}</div>
            <div v-if="event">
                <v-hover v-slot="{ hover }">
                    <v-btn
                        @click="emitDeleteEvent()"
                        :color="hover || confirmDelete ? 'error' : null">
                        {{ confirmDelete ? 'Are you sure ?' : 'Delete Event' }}
                    </v-btn>
                </v-hover>
            </div>
        </div>
        <v-card-text>
            <v-form ref="form" v-model="eventForm.valid" @submit.prevent="emitSubmitEvent()">
                <v-row>
                    <v-col>
                        <v-text-field
                            v-model="eventForm.data.name"
                            :rules="eventForm.rules.name"
                            label="Name"
                            counter="50"
                            maxlength="50"
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
                            maxlength="150"
                            rows="1"
                            auto-grow>
                        </v-textarea>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col>
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
                                    label="Start date"
                                    prepend-icon="mdi-calendar"
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
                                show-adjacent-months>
                            </v-date-picker>
                        </v-menu>
                    </v-col>

                    <v-col>
                        <v-menu
                            ref="startDateTimeMenu"
                            v-model="startDateTimePicker"
                            :close-on-content-click="false"
                            transition="scale-transition"
                            offset-y
                            min-width="auto">
                            <template #activator="{ attrs, on }">
                                <v-text-field
                                    v-bind="attrs"
                                    v-on="on"
                                    v-model="eventForm.data.startDateTime"
                                    @click:clear="resetStartDateTime()"
                                    @change="startDateTimePicker = false"
                                    :disabled="
                                        !eventForm.data.startDate || eventForm.data.takesWholeDay
                                    "
                                    clearable
                                    readonly>
                                </v-text-field>
                            </template>
                            <v-time-picker
                                v-if="startDateTimePicker"
                                v-model="eventForm.data.startDateTime"
                                format="24hr"
                                :allowed-minutes="allowedMinutes"
                                @click:minute="
                                    $refs.startDateTimeMenu.save(eventForm.data.startDateTime)
                                ">
                            </v-time-picker>
                        </v-menu>
                    </v-col>

                    <v-col>
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
                                    :rules="eventForm.rules.endDate"
                                    :disabled="
                                        !eventForm.data.startDate || eventForm.data.takesWholeDay
                                    "
                                    :error="dateError"
                                    :error-messages="dateErrorMessage"
                                    required
                                    label="End date"
                                    prepend-icon="mdi-calendar"
                                    readonly
                                    clearable>
                                </v-text-field>
                            </template>
                            <v-date-picker
                                v-model="eventForm.data.endDate"
                                @change="endDatePicker = false"
                                no-title
                                scrollable
                                show-adjacent-months>
                            </v-date-picker>
                        </v-menu>
                    </v-col>

                    <v-col>
                        <v-menu
                            ref="endDateTimeMenu"
                            v-model="endDateTimePicker"
                            :close-on-content-click="false"
                            transition="scale-transition"
                            offset-y
                            min-width="auto">
                            <template #activator="{ attrs, on }">
                                <v-text-field
                                    v-bind="attrs"
                                    v-on="on"
                                    v-model="eventForm.data.endDateTime"
                                    @change="endDateTimePicker = false"
                                    :disabled="
                                        !eventForm.data.endDate || eventForm.data.takesWholeDay
                                    "
                                    readonly>
                                </v-text-field>
                            </template>
                            <v-time-picker
                                v-if="endDateTimePicker"
                                v-model="eventForm.data.endDateTime"
                                format="24hr"
                                :allowed-minutes="allowedMinutes"
                                @click:minute="
                                    $refs.endDateTimeMenu.save(eventForm.data.endDateTime)
                                ">
                            </v-time-picker>
                        </v-menu>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col>
                        <v-switch v-model="eventForm.data.takesWholeDay">
                            <template #label>
                                Takes whole day
                                <v-icon class="ml-2">mdi-white-balance-sunny</v-icon>
                            </template>
                        </v-switch>
                    </v-col>
                </v-row>

                <v-card-actions class="d-flex justify-end mt-3">
                    <v-btn color="success" text type="submit" :disabled="!eventForm.valid">
                        {{ event ? 'update' : 'create' }}
                    </v-btn>
                    <v-btn plain class="ml-2" @click="emitCloseEvent()">cancel</v-btn>
                </v-card-actions>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { EventModel } from '@/models/event.model'
import moment from 'moment'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class EventDialog extends Vue {
    @Prop({ required: true }) isDialogOpen!: boolean
    @Prop() event?: EventModel

    confirmDelete = false
    eventForm = {
        valid: false,
        data: {
            name: '',
            description: '',
            startDate: moment().format('YYYY-MM-DD'),
            startDateTime: '',
            endDate: '',
            endDateTime: '',
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
    dateErrorMessage = ''

    startDatePicker = false
    startDateTimePicker = false
    endDatePicker = false
    endDateTimePicker = false

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get formattedDate(): (value: string) => string {
        return date => (date ? moment(date).format('D MMM. Y') : '')
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
    }

    @Watch('eventForm.data', { deep: true })
    private onEventFormChanges(): void {
        const { data } = this.eventForm

        if (data.takesWholeDay) {
            this.resetStartDateTime()
            this.resetEndDate()
        }
        if (data.startDate && data.endDate) this.validateEndDate()
    }

    private validateEndDate(): void {
        const { data } = this.eventForm

        const startDate = moment(
            `${data.startDate}T${data.startDateTime ? data.startDateTime : '00:00'}`
        )
        const endDate = moment(`${data.endDate}T${data.endDateTime ? data.endDateTime : '00:00'}`)

        if (endDate.isSameOrBefore(startDate)) {
            this.dateError = true
            this.dateErrorMessage = 'End date must after the start date'
        } else {
            this.dateError = false
            this.dateErrorMessage = ''
        }

        return
    }

    private populateForm(event?: EventModel): void {
        if (event) {
            let endDate = ''
            let endDateTime = ''
            if (event.end_date) {
                endDate = moment(event.end_date).format('YYYY-MM-DD')
                endDateTime = moment(event.end_date).format('HH:mm')
            }
            this.eventForm.data = {
                name: event.name,
                description: event.description ?? '',
                startDate: moment(event.start_date).format('YYYY-MM-DD'),
                startDateTime: moment(event.start_date).format('HH:mm'),
                endDate,
                endDateTime,
                takesWholeDay: event.takes_whole_day,
            }
        } else
            this.eventForm.data = {
                name: '',
                description: '',
                startDate: moment().format('YYYY-MM-DD'),
                startDateTime: '',
                endDate: '',
                endDateTime: '',
                takesWholeDay: false,
            }
    }

    emitSubmitEvent(): void {
        if (!this.eventForm.valid) return

        const { data } = this.eventForm

        const description = data.description || undefined
        const start_date = `${data.startDate}T${data.startDateTime || '00:00'}`

        let end_date
        if (data.endDate) end_date = `${data.endDate}T${data.endDateTime || '23:59'}`

        const event: Partial<EventModel> = {
            name: data.name,
            description,
            start_date,
            end_date,
            takes_whole_day: data.takesWholeDay,
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

        if (this.event) this.$emit('delete', this.event?.id)
    }

    emitCloseEvent(): void {
        this.$emit('close')
    }

    resetStartDateTime(): void {
        this.eventForm.data.startDateTime = ''
    }

    resetEndDate(): void {
        this.eventForm.data.endDate = ''
        this.eventForm.data.endDateTime = ''
    }

    allowedMinutes(value: number): boolean {
        return value % 5 === 0
    }
}
</script>

<style scoped lang="scss"></style>
