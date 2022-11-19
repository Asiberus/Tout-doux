<template>
    <v-card>
        <v-toolbar color="event">
            <v-toolbar-title :title="event.name"> {{ event.name }} </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn @click="emitUpdateEvent()" v-if="!isEditDisabled" icon>
                <v-icon>mdi-pencil</v-icon>
            </v-btn>
        </v-toolbar>
        <v-card-text>
            <div class="d-flex align-center mb-2 white--text">
                <template v-if="!event.takes_whole_day">
                    <div class="flex-shrink-0 d-flex align-center">
                        <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                        <span>{{ dateFormat(event.start_date, 'D MMMM Y HH:mm') }}</span>
                        <template v-if="event.end_date">
                            <v-icon small class="mx-1">mdi-arrow-right</v-icon>
                            <template v-if="isDateEqual(event.start_date, event.end_date)">
                                <span>{{ dateFormat(event.end_date, 'HH:mm') }}</span>
                            </template>
                            <template v-else>
                                <span>{{ dateFormat(event.end_date, 'D MMMM Y HH:mm') }}</span>
                            </template>
                        </template>
                    </div>
                </template>

                <template v-else>
                    <v-icon title="Takes whole day" class="mr-2">mdi-white-balance-sunny</v-icon>
                    <span>{{ dateFormat(event.start_date, 'D MMMM Y') }}</span>
                </template>

                <template v-if="event.project">
                    <v-spacer class="mr-3"></v-spacer>
                    <ProjectChip :project="event.project"></ProjectChip>
                </template>
            </div>
            <p v-if="event.description">{{ event.description }}</p>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import ProjectChip from '@/components/ProjectChip.vue'
import { EventExtended } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import moment from 'moment'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({ components: { ProjectChip } })
export default class EventTooltip extends Vue {
    @Prop({ required: true }) event!: EventExtended

    get isEditDisabled(): boolean {
        return this.event.project ? this.event.project.archived : false
    }

    isDateEqual(date1: string, date2: string): boolean {
        return moment(date1).isSame(date2, 'day')
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }

    emitUpdateEvent(): void {
        this.$emit('update', this.event)
    }
}
</script>

<style scoped lang="scss"></style>
