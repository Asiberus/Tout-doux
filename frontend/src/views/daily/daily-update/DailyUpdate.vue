<template>
    <div class="daily-update">
        <div class="d-flex flex-column flex-sm-row justify-space-between align-center gap-2 mb-2">
            <SecondaryTitle class="text-center text-sm-start">
                <span class="grey--text">Daily : </span>{{ dateFormat(date, 'dddd DD MMMM Y') }}
            </SecondaryTitle>

            <v-btn
                @click="goToDailyDetail()"
                :disabled="dailyTaskCount === 0 && dailyEventCount === 0"
                color="accent"
                rounded>
                Start the day
                <v-icon right>mdi-arrow-right</v-icon>
            </v-btn>
        </div>

        <v-stepper
            @change="onStepperChange($event)"
            :value="dailyStepper"
            non-linear
            alt-labels
            class="daily-update-stepper">
            <v-stepper-header>
                <v-divider></v-divider>
                <v-stepper-step :step="1" editable color="accent">
                    Task
                    <template v-if="dailyTaskCount > 0"> ({{ dailyTaskCount }}) </template>
                </v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step :step="2" editable color="accent">
                    Event
                    <template v-if="dailyEventCount > 0"> ({{ dailyEventCount }}) </template>
                </v-stepper-step>
                <v-divider></v-divider>
            </v-stepper-header>
            <v-stepper-items>
                <v-stepper-content :step="1">
                    <DailyUpdateTask
                        :date="date"
                        @daily-task-count="dailyTaskCount = $event"></DailyUpdateTask>
                </v-stepper-content>
                <v-stepper-content :step="2">
                    <DailyUpdateEvent
                        :date="date"
                        @daily-event-count="dailyEventCount = $event"></DailyUpdateEvent>
                </v-stepper-content>
            </v-stepper-items>
        </v-stepper>
    </div>
</template>

<script lang="ts">
import { dateFormat } from '@/pipes'
import DailyUpdateEvent from '@/views/daily/daily-update/steps/event/DailyUpdateEvent.vue'
import DailyUpdateTask from '@/views/daily/daily-update/steps/task/DailyUpdateTask.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import MainTitle from '@/components/MainTitle.vue'
import SecondaryTitle from '@/components/SecondaryTitle.vue'

@Component({ components: { SecondaryTitle, DailyUpdateTask, DailyUpdateEvent } })
export default class DailyUpdate extends Vue {
    @Prop({ required: true }) readonly date!: string
    @Prop({ validator: value => value === 'task' || value === 'event' })
    readonly step!: 'task' | 'event'

    dailyStepper = 1
    dailyTaskCount = 0
    dailyEventCount = 0

    private beforeMount(): void {
        if (this.step === 'task') this.dailyStepper = 1
        else if (this.step === 'event') this.dailyStepper = 2
    }

    goToDailyDetail(): void {
        localStorage.setItem('openDailyDetailTo', this.date)
        this.$router.push({ name: 'daily-summary' })
    }

    onStepperChange(index: number): void {
        const step = index === 1 ? 'task' : 'event'
        this.$router.replace({ params: { step } })
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.daily-update {
    height: 100%;
    display: flex;
    flex-direction: column;

    @media #{map-get($display-breakpoints, 'sm-and-down')} {
        .v-stepper__step--editable:hover {
            background: inherit;
        }
    }
}
</style>
