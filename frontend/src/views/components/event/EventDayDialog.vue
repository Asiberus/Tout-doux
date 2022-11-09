<template>
    <HalfDialog :value="value" @input="$emit('input', $event)">
        <v-card height="100%">
            <v-toolbar class="mb-3">
                <v-toolbar-title> Events : {{ dateFormat(date, 'D MMMM YYYY') }} </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn @click="$emit('input', false)" icon>
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>
            <v-card-text>
                <div v-for="event of events" :key="event.id">
                    <EventItemCard
                        :event="event"
                        :project="event.project"
                        :clickable="event.project ? !event.project.archived : true"
                        :ripple="event.project ? !event.project.archived : true"
                        :color="'teal'"
                        :daySelected="true"
                        :compact="true"
                        @update="$emit('update', $event)"
                        @delete="$emit('delete', $event)">
                    </EventItemCard>
                </div>
            </v-card-text>
        </v-card>
    </HalfDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { EventExtended, EventModel } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import HalfDialog from '@/components/HalfDialog.vue'

@Component({ components: { EventItemCard, HalfDialog } })
export default class EventDayDialog extends Vue {
    @Prop({ required: true }) value: boolean = false
    @Prop({ required: true }) date!: string
    @Prop({ required: true }) events!: EventExtended[]

    getEventColor(event: EventExtended): string {
        const { project } = event
        if (!project) return 'teal'
        else if (project.archived) return 'accent'
        else return 'project'
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss"></style>
