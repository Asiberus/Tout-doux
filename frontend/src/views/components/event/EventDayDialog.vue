<template>
    <HalfDialog :value="value" @input="$emit('input', $event)">
        <v-card
            v-touch="{ right: () => $emit('input', false) }"
            height="100%"
            class="d-flex flex-column">
            <v-toolbar class="flex-grow-0">
                <v-toolbar-title class="text-body-1 text-sm-h6 mr-2">
                    Events : {{ dateFormat(date, 'D MMMM YYYY') }}
                </v-toolbar-title>

                <v-btn
                    @click="$emit('open-event-dialog', date)"
                    :small="$vuetify.breakpoint.xsOnly"
                    :icon="$vuetify.breakpoint.xsOnly"
                    class="new-event-btn">
                    <v-icon>mdi-plus</v-icon>
                    <template v-if="$vuetify.breakpoint.smAndUp">event</template>
                </v-btn>

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
                            color="event"
                            :daySelected="true"
                            :change-passed-text-color="false"
                            @update="$emit('update', $event)"
                            @delete="$emit('delete', $event)">
                        </EventItemCard>
                    </div>
                </template>
                <template v-else>
                    <EmptyListDisplay class="d-flex justify-center align-center fill-height">
                        <template #img>
                            <img
                                src="../../../assets/no_events.svg"
                                alt="No events"
                                class="empty-img" />
                        </template>
                        <template #message>
                            <p class="text-body-1 text-sm-h6 white--text mb-0">
                                No event for that day.
                            </p>
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
import { EventModel } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import EventItemCard from '@/views/components/event/EventItemCard.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({ components: { EventItemCard, HalfDialog, EmptyListDisplay } })
export default class EventDayDialog extends Vue {
    @Prop({ required: true }) value!: boolean
    @Prop({ required: true }) date!: string
    @Prop({ required: true }) events!: EventModel[]

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.empty-img {
    width: clamp(250px, 50%, 350px);
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
    .new-event-btn {
        background-color: #353535 !important;
    }
}
</style>
