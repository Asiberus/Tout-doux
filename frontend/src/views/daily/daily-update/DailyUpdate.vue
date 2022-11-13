<template>
    <div>
        <div class="d-flex justify-space-between align-center mb-4">
            <h2 class="text-h3">
                <span class="grey--text">Daily : </span>{{ dateFormat(date, 'dddd DD MMMM Y') }}
            </h2>
            <v-btn @click="goToDailyDetail()" color="accent" rounded class="mr-10">
                Start day
                <v-icon right>mdi-arrow-right</v-icon>
            </v-btn>
        </div>

        <v-stepper
            @change="onStepperChange($event)"
            :value="dailyStepper"
            non-linear
            alt-labels
            class="daily-stepper">
            <v-stepper-header>
                <v-divider></v-divider>
                <v-stepper-step :step="1" editable color="accent"> Task </v-stepper-step>
                <v-divider></v-divider>
                <v-stepper-step :step="2" editable color="accent"> Event </v-stepper-step>
                <v-divider></v-divider>
            </v-stepper-header>
            <v-stepper-items>
                <v-stepper-content :step="1">
                    <DailyUpdateTask :date="date"></DailyUpdateTask>
                </v-stepper-content>
                <v-stepper-content :step="2">
                    <DailyUpdateEvent :date="date"></DailyUpdateEvent>
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

@Component({ components: { DailyUpdateTask, DailyUpdateEvent } })
export default class DailyUpdate extends Vue {
    @Prop({ required: true }) readonly date!: string
    @Prop({ validator: value => value === 'task' || value === 'event' })
    readonly step!: 'task' | 'event'

    dailyStepper = 1

    private beforeMount(): void {
        if (this.step === 'task') this.dailyStepper = 1
        else if (this.step === 'event') this.dailyStepper = 2
    }

    goToDailyDetail(): void {
        localStorage.setItem('openDailyDetailTo', this.date)
        this.$router.push({ name: 'daily-overview' })
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
