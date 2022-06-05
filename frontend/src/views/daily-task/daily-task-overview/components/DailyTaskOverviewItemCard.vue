<template>
    <v-hover v-slot="{ hover }">
        <v-card
            v-on="
                dailyTaskSummary.totalTask || dailyTaskSummary.totalEvent
                    ? { click: () => openDailyTaskDetailDialog() }
                    : {}
            "
            :color="backgroundColor"
            :ripple="false">
            <v-card-text>
                <div class="d-flex align-end">
                    <div class="d-flex flex-column">
                        <h1 class="white--text mb-2">{{ dailyTaskDayOfWeek }}</h1>
                        <p class="daily-task-date">{{ dailyTaskDateFormat }}</p>
                    </div>
                    <v-spacer></v-spacer>
                    <div v-if="dailyTaskSummary.totalEvent > 0" class="d-flex flex-shrink-0">
                        <span class="daily-task-event mr-1">
                            {{ dailyTaskSummary.totalEvent }}
                        </span>
                        <v-icon>mdi-calendar-clock</v-icon>
                    </div>
                    <div v-if="dailyTaskSummary.totalTask" class="flex-shrink-0 ml-6">
                        <span style="font-size: 3em" class="white--text">{{
                            dailyTaskSummary.totalTaskCompleted
                        }}</span>
                        /
                        <span
                            style="
                                font-size: 1.8em;
                                transform: translateY(0.3em);
                                display: inline-block;
                            ">
                            {{ dailyTaskSummary.totalTask }}
                        </span>
                    </div>
                </div>
            </v-card-text>
            <v-scale-transition origin="center">
                <v-card-actions v-if="isToday && hover" class="card-action">
                    <v-btn
                        :to="{
                            name: 'daily-task-update',
                            params: { date: dailyTaskSummary.date },
                        }"
                        color="accent"
                        x-small
                        fab>
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                </v-card-actions>
            </v-scale-transition>
        </v-card>
    </v-hover>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import DailyTaskSummary from '../../../../models/daily-task-summary.model'
import moment from 'moment'

@Component
export default class DailyTaskOverviewItemCard extends Vue {
    @Prop() dailyTaskSummary!: DailyTaskSummary

    get isToday(): boolean {
        return moment().isSame(this.dailyTaskSummary.date, 'days')
    }

    get dailyTaskDayOfWeek(): string {
        return moment(this.dailyTaskSummary.date).format('dddd')
    }

    get dailyTaskDateFormat(): string {
        return moment(this.dailyTaskSummary.date).format('DD MMMM Y')
    }

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
                (this.dailyTaskSummary.totalTaskCompleted * colorArray.length) /
                    this.dailyTaskSummary.totalTask
            ) - 1
        return colorArray[index]
    }

    get backgroundColor(): string | null {
        if (!this.dailyTaskSummary.totalTask && !this.dailyTaskSummary.totalEvent) return '#151515'
        else if (!this.dailyTaskSummary.totalTaskCompleted) return null

        return this.colorOfTaskCompleted
    }

    openDailyTaskDetailDialog(): void {
        this.$emit('open-daily-task-detail')
    }
}
</script>

<style scoped lang="scss">
.daily-task-date {
    font-size: 1rem;
    padding-left: 0.3rem;
}

.daily-task-event {
    font-size: 1.8em;
    color: white;
}

.card-action {
    position: absolute;
    top: -20px;
    right: 5px;
}
</style>
