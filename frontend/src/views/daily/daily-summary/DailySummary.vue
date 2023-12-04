<template>
    <div>
        <div class="d-flex flex-column flex-sm-row justify-space-between align-center mb-3 mb-md-6">
            <MainTitle class="mb-3 mb-sm-0">Daily Summary</MainTitle>
            <v-btn
                :to="{ name: 'daily-update', params: { date: this.today, step: 'task' } }"
                color="accent"
                rounded
                outlined>
                prepare the day
            </v-btn>
        </div>

        <div class="daily-wrapper">
            <DailySummaryCardComponent
                v-for="dailySummary in dailySummaryList"
                :key="dailySummary.date"
                :daily-summary="dailySummary"
                @open-daily-detail="openDailyDetailDialog(dailySummary.date)">
            </DailySummaryCardComponent>
        </div>

        <div class="mt-5 d-flex justify-center" v-if="dailySummaryList.length">
            <v-btn @click="loadNextPage()" :loading="dailyOverviewLoading" rounded>
                Load more days
            </v-btn>
        </div>

        <DailyDetail
            v-model="dailyDetailDialog"
            :date="dateSelected"
            @daily-task-completed="updateDailyTaskCompleted">
        </DailyDetail>
    </div>
</template>

<script lang="ts">
import { dailyTaskService } from '@/api/daily-task.api'
import { DailySummary } from '@/models/daily-summary.model'
import { showScroll } from '@/utils/document.utils'
import DailyDetail from '@/views/daily/daily-summary/components/DailyDetail.vue'
import DailySummaryCardComponent from '@/views/daily/daily-summary/components/DailySummaryCard.vue'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'
import MainTitle from '@/components/MainTitle.vue'

@Component({ components: { MainTitle, DailySummaryCardComponent, DailyDetail } })
export default class DailySummaryComponent extends Vue {
    dailySummaryList: DailySummary[] = []
    dailyOverviewLoading = false
    dailyDetailDialog = false
    dateSelected = ''
    today = moment().format('YYYY-MM-DD')

    DAYS_PER_PAGE = 21

    created(): void {
        const endDate = moment()
            .subtract(this.DAYS_PER_PAGE - 1, 'days')
            .format('YYYY-MM-DD')
        this.retrieveDailySummaryList(this.today, endDate)
    }

    mounted(): void {
        const date = localStorage.getItem('openDailyDetailTo')
        if (date && moment(date).isValid()) {
            this.openDailyDetailDialog(date)
            localStorage.removeItem('openDailyDetailTo')
        }
    }

    destroyed(): void {
        // Scroll is reset whenever the user change route.
        showScroll()
    }

    private retrieveDailySummaryList(startDate: string, endDate: string): void {
        this.dailyOverviewLoading = true
        dailyTaskService.getDailySummary(startDate, endDate).then(
            (response: any) => {
                this.dailySummaryList = this.dailySummaryList.concat(response.body)
                this.dailyOverviewLoading = false
            },
            (error: any) => {
                this.dailyOverviewLoading = false
                console.error(error)
            }
        )
    }

    loadNextPage(): void {
        const lastDailySummary = this.dailySummaryList.at(-1)
        if (!lastDailySummary) return

        const startDate = moment(lastDailySummary.date).subtract(1, 'days').format('YYYY-MM-DD')
        const endDate = moment(lastDailySummary.date)
            .subtract(this.DAYS_PER_PAGE, 'days')
            .format('YYYY-MM-DD')

        this.retrieveDailySummaryList(startDate, endDate)
    }

    openDailyDetailDialog(date: string): void {
        this.dateSelected = date
        this.dailyDetailDialog = true
    }

    updateDailyTaskCompleted(date: string, numberOfDailyTaskCompleted: number): void {
        const dailyTaskSummary = this.dailySummaryList.find(d => d.date === date)
        if (dailyTaskSummary) dailyTaskSummary.totalTaskCompleted = numberOfDailyTaskCompleted
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.daily-wrapper {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

    @media #{map-get($display-breakpoints, 'sm-and-down')} {
        grid-template-columns: repeat(auto-fit, minmax(288px, 1fr));
    }

    & > * {
        min-width: 0;
    }
}
</style>
