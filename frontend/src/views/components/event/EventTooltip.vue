<template>
    <v-card>
        <v-toolbar>
            <v-toolbar-title :title="event.name">{{ event.name }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn @click="emitUpdateEvent()" icon>
                <v-icon>mdi-pencil</v-icon>
            </v-btn>
        </v-toolbar>
        <v-card-text>
            <div class="d-flex align-center mb-2 white--text">
                <template v-if="!event.takes_whole_day">
                    <div class="flex-shrink-0">
                        <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                        <span>{{ dateFormat(event.start_date, 'D MMMM Y HH:mm') }}</span>
                        <template v-if="event.end_date">
                            <v-icon class="mx-2">mdi-arrow-right</v-icon>
                            <span>{{ dateFormat(event.end_date, 'D MMMM Y HH:mm') }}</span>
                        </template>
                    </div>
                </template>

                <template v-else>
                    <v-icon title="Takes whole day" class="mr-2">mdi-weather-sunset-up</v-icon>
                    <span>{{ dateFormat(event.start_date, 'D MMMM Y') }}</span>
                </template>

                <template v-if="event.project">
                    <v-spacer class="mr-3"></v-spacer>
                    <v-chip label color="project" class="flex-shrink-0a">
                        <span class="text-ellipsis" :title="event.project.name">
                            {{ event.project.name }}
                        </span>
                    </v-chip>
                </template>
            </div>
            <p v-if="event.description">{{ event.description }}</p>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { EventExtended } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class EventTooltip extends Vue {
    @Prop({ required: true }) event!: EventExtended

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }

    emitUpdateEvent(): void {
        this.$emit('update')
    }
}
</script>

<style scoped lang="scss"></style>
