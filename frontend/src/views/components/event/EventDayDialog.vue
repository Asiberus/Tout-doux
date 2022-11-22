<template>
    <HalfDialog :value="value" @input="$emit('input', $event)">
        <v-card height="100%" class="d-flex flex-column">
            <v-toolbar class="flex-grow-0">
                <v-toolbar-title> Events : {{ dateFormat(date, 'D MMMM YYYY') }} </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn @click="$emit('input', false)" icon>
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>
            <v-card-text class="overflow-auto flex-grow-1">
                <template v-if="events.length > 0">
                    <div class="pt-3">
                        <EventItemCard
                            v-for="event of events"
                            :key="event.id"
                            :event="event"
                            :project="event.project"
                            :clickable="event.project ? !event.project.archived : true"
                            :ripple="event.project ? !event.project.archived : true"
                            color="event"
                            :daySelected="true"
                            :caret="true"
                            :change-passed-text-color="false"
                            @update="$emit('update', $event)"
                            @delete="$emit('delete', $event)">
                        </EventItemCard>
                    </div>
                </template>
                <template v-else>
                    <EmptyListDisplay
                        message="No event for that day."
                        class="d-flex justify-center align-center fill-height">
                        <template #img>
                            <img src="../../../assets/no_events.svg" width="300" alt="No events" />
                        </template>
                    </EmptyListDisplay>
                </template>
            </v-card-text>
        </v-card>
    </HalfDialog>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import HalfDialog from '@/components/HalfDialog.vue'
import { EventExtended } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({ components: { EventItemCard, HalfDialog, EmptyListDisplay } })
export default class EventDayDialog extends Vue {
    @Prop({ required: true }) value!: boolean
    @Prop({ required: true }) date!: string
    @Prop({ required: true }) events!: EventExtended[]

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss"></style>
