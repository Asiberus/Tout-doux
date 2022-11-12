<template>
    <v-hover v-slot="{ hover }">
        <v-card
            v-on="
                dailySummary.totalTask || dailySummary.totalEvent
                    ? { click: () => openDailyDetailDialog() }
                    : {}
            "
            :color="backgroundColor"
            :ripple="false">
            <v-card-text>
                <div class="d-flex align-end">
                    <div class="d-flex flex-column">
                        <h1 class="white--text mb-2">
                            {{ dateFormat(dailySummary.date, 'dddd') }}
                        </h1>
                        <p class="daily-date">
                            {{ dateFormat(dailySummary.date, 'DD MMMM Y') }}
                        </p>
                    </div>
                    <v-spacer></v-spacer>
                    <div v-if="dailySummary.totalEvent > 0" class="d-flex flex-shrink-0">
                        <span class="daily-event mr-1">
                            {{ dailySummary.totalEvent }}
                        </span>
                        <v-icon>mdi-calendar-clock</v-icon>
                    </div>
                    <div v-if="dailySummary.totalTask" class="flex-shrink-0 ml-6">
                        <span style="font-size: 3em" class="white--text">{{
                            dailySummary.totalTaskCompleted
                        }}</span>
                        /
                        <span
                            style="
                                font-size: 1.8em;
                                transform: translateY(0.3em);
                                display: inline-block;
                            ">
                            {{ dailySummary.totalTask }}
                        </span>
                    </div>
                </div>
            </v-card-text>
            <v-scale-transition origin="center">
                <v-card-actions v-if="isToday && hover" class="card-action">
                    <v-btn
                        :to="{
                            name: 'daily-update',
                            params: { date: dailySummary.date, step: 'task' },
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
import { dateFormat } from '@/pipes'
import moment from 'moment'
import { Component, Prop, Vue } from 'vue-property-decorator'
import DailySummary from 'src/models/daily-summary.model'

@Component
export default class DailyOverviewItemCard extends Vue {
    @Prop({ required: true }) dailySummary!: DailySummary

    get isToday(): boolean {
        return moment().isSame(this.dailySummary.date, 'days')
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
.daily-date {
    font-size: 1rem;
    padding-left: 0.3rem;
}

.daily-event {
    font-size: 1.8em;
    color: white;
}

.card-action {
    position: absolute;
    top: -20px;
    right: 5px;
}
</style>
