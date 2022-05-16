<template>
    <div class="mb-3">
        <v-card @click="openEventDialog" :disabled="disabled">
            <v-card-text class="pa-5">
                <div class="d-flex">
                    <v-icon class="mr-3">mdi-calendar-clock</v-icon>
                    <div class="flex-grow-1 flex-shrink-0 overflow-hidden pr-4">
                        <h2 class="white--text font-weight-regular mb-1">{{ event.name }}</h2>
                    </div>
                    <p class="flex-shrink-1 text-ellipsis pr-10" :title="event.description">
                        {{ event.description }}
                    </p>
                    <div class="d-flex flex-shrink-0">
                        <div title="Start date">
                            <v-icon small class="mr-1">mdi-clock-outline</v-icon>
                            <span>{{ startDate }}</span>
                        </div>

                        <div v-if="event.end_date" title="End date">
                            <v-icon small class="mx-2">mdi-arrow-right</v-icon>
                            <v-icon small class="mr-1">mdi-clock-outline</v-icon>
                            <span>{{ endDate }}</span>
                        </div>

                        <div v-if="event.takes_whole_day" class="ml-2" title="Takes whole day">
                            <v-icon small>mdi-weather-sunset-up</v-icon>
                        </div>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <v-dialog v-model="eventDialog" width="60%">
            <EventDialog
                :event="event"
                :is-dialog-open="eventDialog"
                @submit="emitUpdateEvent"
                @delete="emitDeleteEvent"
                @close="eventDialog = false"></EventDialog>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { EventModel } from '@/models/event.model'
import moment from 'moment'
import EventDialog from '@/views/components/event/EventDialog.vue'
import { Task } from '@/models/task.model'

@Component({
    components: {
        EventDialog,
    },
})
export default class EventItemCard extends Vue {
    @Prop({ required: true }) private event!: EventModel
    @Prop({ default: false }) private disabled!: boolean

    eventDialog = false

    get startDate(): string {
        return moment(this.event.start_date).format('D MMM. Y HH:mm')
    }

    get endDate(): string {
        return moment(this.event.end_date).format('D MMM. Y HH:mm')
    }

    openEventDialog(): void {
        if (this.disabled) return

        this.eventDialog = true
    }

    emitUpdateEvent(data: Partial<Task>): void {
        this.eventDialog = false
        this.$emit('update', this.event.id, data)
    }

    emitDeleteEvent(): void {
        this.eventDialog = false
        this.$emit('delete', this.event.id)
    }
}
</script>

<style scoped lang="scss"></style>
