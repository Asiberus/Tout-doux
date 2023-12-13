<template>
    <v-card
        v-on="
            dailySummary.totalTask || dailySummary.totalEvent
                ? { click: () => openDailyDetailDialog() }
                : {}
        "
        :color="backgroundColor"
        :ripple="false"
        class="rounded-lg">
        <v-card-text class="daily-summary-card d-flex flex-row">
            <div class="flex-grow-1">
                <h1 class="text-h5 font-weight-medium white--text mb-0">
                    {{ dateFormat(dailySummary.date, 'dddd') }}
                </h1>
                <p class="text-subtitle-2 text-md-subtitle-1 mb-0">
                    {{ dateFormat(dailySummary.date, 'DD MMMM Y') }}
                </p>
            </div>

            <div
                class="d-flex flex-column align-end"
                :class="{ 'justify-end': dailySummary.totalTask === 0 }">
                <TaskCounter
                    v-if="dailySummary.totalTask"
                    :value="dailySummary.totalTaskCompleted"
                    :max="dailySummary.totalTask"
                    class="flex-shrink-0 mb-2">
                </TaskCounter>

                <div v-if="dailySummary.totalEvent > 0" class="flex-shrink-0 d-flex gap-1">
                    <span class="daily-event">{{ dailySummary.totalEvent }}</span>
                    <v-icon>mdi-calendar-clock</v-icon>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { dateFormat } from '@/pipes'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { DailySummary } from 'src/models/daily-summary.model'
import TaskCounter from '@/components/TaskCounter.vue'

@Component({ components: { TaskCounter } })
export default class DailySummaryCardComponent extends Vue {
    @Prop({ required: true }) dailySummary!: DailySummary

    // todo : Set colorArray
    get colorOfTaskCompleted(): string {
        const colorArray = [
            '#163317',
            'green darken-4',
            'green darken-3',
            'green darken-2',
            'green',
        ]
        const index =
            Math.trunc(
                (this.dailySummary.totalTaskCompleted * colorArray.length) /
                    this.dailySummary.totalTask
            ) - 1
        return colorArray[index]
    }

    get backgroundColor(): string | null {
        if (!this.dailySummary.totalTask && !this.dailySummary.totalEvent) return '#151515'
        else if (!this.dailySummary.totalTaskCompleted) return null

        return this.colorOfTaskCompleted
    }

    openDailyDetailDialog(): void {
        this.$emit('open-daily-detail')
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.daily-summary-card {
    min-height: 96px;

    .daily-event {
        font-size: 1.5rem;
        color: white;

        @media #{map-get($display-breakpoints, 'sm-and-down')} {
            font-size: 1.25rem;
        }
    }
}
</style>
