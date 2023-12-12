<template>
    <div>
        <div class="d-flex flex-column flex-sm-row justify-space-between align-center mb-3 mb-md-6">
            <MainTitle icon="mdi-trophy" class="mb-3 mb-sm-0">Daily Summary</MainTitle>
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
                @open-daily-detail="setDateParam(dailySummary.date)">
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
            @input="dailyDetailDialogInput($event)"
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
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import MainTitle from '@/components/MainTitle.vue'

@Component({ components: { MainTitle, DailySummaryCardComponent, DailyDetail } })
export default class DailySummaryComponent extends Vue {
    @Prop({ required: false }) date?: string

    dailySummaryList: DailySummary[] = []
    dailyOverviewLoading = false
    dailyDetailDialog = false
    dateSelected = ''
    today = moment().format('YYYY-MM-DD')

    daysPerPage = 21

    created(): void {
        this.daysPerPage = this.calculateDaysPerPage()
        const endDate = moment()
            .subtract(this.daysPerPage - 1, 'days')
            .format('YYYY-MM-DD')
        this.retrieveDailySummaryList(this.today, endDate)
    }

    mounted(): void {
        if (!this.date) return
        if (!moment(this.date).isValid()) this.removeDateParam()

        this.openDailyDetailDialog(this.date)
    }

    destroyed(): void {
        // Scroll is reset whenever the user change route.
        showScroll()
    }

    @Watch('$route', { deep: true })
    private onRouterChange(): void {
        if (!this.date) {
            this.dailyDetailDialog = false
            return
        }

        if (!moment(this.date).isValid()) this.removeDateParam()

        this.openDailyDetailDialog(this.date)
    }

    private calculateDaysPerPage(): number {
        const { breakpoint } = this.$vuetify
        if (breakpoint.xsOnly) return 7
        else if (breakpoint.smAndDown) return 14
        else if (breakpoint.lgAndDown) return 21
        else return 42 // for xl only
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
            .subtract(this.daysPerPage, 'days')
            .format('YYYY-MM-DD')

        this.retrieveDailySummaryList(startDate, endDate)
    }

    openDailyDetailDialog(date: string): void {
        this.dateSelected = date
        this.dailyDetailDialog = true
    }

    dailyDetailDialogInput(value: boolean): void {
        if (!value) this.removeDateParam({ push: true })
    }

    updateDailyTaskCompleted(date: string, numberOfDailyTaskCompleted: number): void {
        const dailyTaskSummary = this.dailySummaryList.find(d => d.date === date)
        if (dailyTaskSummary) dailyTaskSummary.totalTaskCompleted = numberOfDailyTaskCompleted
    }

    setDateParam(date: string): void {
        this.$router.push({ name: 'daily-summary', params: { date } })
    }

    removeDateParam(options: { push?: boolean } = {}): void {
        const { push } = options
        if (push) this.$router.push({ name: 'daily-summary' })
        else this.$router.replace({ name: 'daily-summary' })
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
