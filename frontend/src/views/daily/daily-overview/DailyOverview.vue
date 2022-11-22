<template>
    <div>
        <h1 class="text-h3 mb-6">Daily Overview</h1>
        <v-row>
            <v-col v-for="(dailyOverview, index) in dailySummaryList" :key="index" cols="3">
                <DailyOverviewItemCard
                    :dailySummary="dailyOverview"
                    @open-daily-detail="openDailyDetailDialog(dailyOverview.date)">
                </DailyOverviewItemCard>
            </v-col>
        </v-row>
        <div class="mt-5 d-flex justify-center" v-if="dailySummaryList.length">
            <v-btn @click="loadNextPage" :loading="dailyOverviewLoading" rounded>
                Load more days
            </v-btn>
        </div>

        <v-dialog
            v-model="dailyDetailDialog"
            fullscreen
            hide-overlay
            scrollable
            transition="dialog-bottom-transition">
            <DailyDetail
                :date="dateSelected"
                @daily-task-completed="updateDailyTaskCompleted"
                @close="dailyDetailDialog = false">
            </DailyDetail>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { dailyTaskService } from '@/api/daily-task.api'
import DailySummary from '@/models/daily-summary.model'
import { hideScroll, showScroll } from '@/utils/document.utils'
import DailyDetail from '@/views/daily/daily-overview/components/DailyDetail.vue'
import DailyOverviewItemCard from '@/views/daily/daily-overview/components/DailyOverviewItemCard.vue'
import moment from 'moment'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({ components: { DailyOverviewItemCard, DailyDetail } })
export default class DailyOverview extends Vue {
    @Prop() readonly openToDate?: string
    dailySummaryList: DailySummary[] = []
    dailyOverviewLoading = false
    page = 1
    dailyDetailDialog = false
    dateSelected = ''

    created(): void {
        this.retrieveDailySummaryList()
    }

    mounted(): void {
        const date = localStorage.getItem('openDailyDetailTo')
        if (date && moment(date).isValid()) {
            this.openDailyDetailDialog(date)
            localStorage.removeItem('openDailyDetailTo')
        }
    }

    @Watch('dailyDetailDialog')
    private onDailyDetailDialogChanges(value: boolean): void {
        if (value) hideScroll()
        else showScroll()
    }

    private retrieveDailySummaryList(): void {
        this.dailyOverviewLoading = true
        dailyTaskService.getDailySummary(this.page).then(
            (response: any) => {
                this.dailySummaryList = this.dailySummaryList.concat(response.body.content)
                this.dailyOverviewLoading = false
            },
            (error: any) => {
                this.dailyOverviewLoading = false
                console.error(error)
            }
        )
    }

    loadNextPage(): void {
        this.page += 1
        this.retrieveDailySummaryList()
    }

    openDailyDetailDialog(date: string): void {
        this.dailyDetailDialog = true
        this.dateSelected = date
    }

    updateDailyTaskCompleted(date: string, numberOfDailyTaskCompleted: number): void {
        const dailyTaskSummary = this.dailySummaryList.find(d => d.date === date)
        if (dailyTaskSummary) dailyTaskSummary.totalTaskCompleted = numberOfDailyTaskCompleted
    }
}
</script>

<style scoped lang="scss"></style>
