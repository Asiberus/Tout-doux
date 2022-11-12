<template>
    <div>
        <h2 class="text-h3 mb-4">
            <span class="grey--text">Daily : </span>{{ dateFormat(date, 'dddd DD MMMM Y') }}
        </h2>

        <v-stepper value="1" non-linear alt-labels class="daily-stepper">
            <v-stepper-header>
                <v-divider></v-divider>
                <v-stepper-step step="1" editable color="accent"> Task </v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step step="2" editable color="accent"> Event </v-stepper-step>
                <v-divider></v-divider>
            </v-stepper-header>
            <v-stepper-items>
                <v-stepper-content step="1">
                    <DailyUpdateTask :date="date"></DailyUpdateTask>
                </v-stepper-content>
                <v-stepper-content step="2">
                    <DailyUpdateEvent :date="date"></DailyUpdateEvent>
                </v-stepper-content>
            </v-stepper-items>
        </v-stepper>
    </div>
</template>

<script lang="ts">
import { dateFormat } from '@/pipes'
import DailyUpdateEvent from '@/views/daily-task/daily-update/steps/event/DailyUpdateEvent.vue'
import DailyUpdateTask from '@/views/daily-task/daily-update/steps/task/DailyUpdateTask.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({ components: { DailyUpdateTask, DailyUpdateEvent } })
export default class DailyUpdate extends Vue {
    @Prop() private date!: string

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss">
.v-stepper {
    box-shadow: none !important;
    background: transparent !important;
    border: none !important;

    &__header {
        box-shadow: none !important;
    }

    &__content {
        padding: 0;
    }
}
</style>
