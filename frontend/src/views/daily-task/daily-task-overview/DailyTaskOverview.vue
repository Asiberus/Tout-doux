<template>
    <v-container>
        <h1 class="mb-6">Daily Overview</h1>
        <v-row>
            <v-col v-for="(dailyTaskOverview, index) in dailyTaskSummaryList" :key="index" cols="2">
                <DailyTaskOverviewItemCard
                    :dailyTaskSummary="dailyTaskOverview"
                    @open-daily-task-detail="openDailyTaskDetailDialog(dailyTaskOverview.date)">
                </DailyTaskOverviewItemCard>
            </v-col>
        </v-row>
        <div class="mt-5 d-flex justify-center" v-if="dailyTaskSummaryList.length">
            <v-btn @click="loadNextPage" :loading="dailyTaskOverviewLoading" rounded>
                Load more days
            </v-btn>
        </div>

        <v-dialog
            v-model="dailyTaskDialog"
            fullscreen
            hide-overlay
            scrollable
            transition="dialog-bottom-transition">
            <DailyTaskDetail
                :date="dateSelected"
                @daily-task-completed="updateDailyTaskCompleted"
                @close="dailyTaskDialog = false">
            </DailyTaskDetail>
        </v-dialog>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { dailyTaskService } from '@/api/daily-task.api'
import DailyTaskSummary from '@/models/daily-task-overview.model'
import DailyTaskOverviewItemCard from '@/views/daily-task/daily-task-overview/components/DailyTaskOverviewItemCard.vue'
import DailyTaskDetail from '@/views/daily-task/daily-task-overview/components/DailyTaskDetail.vue'

@Component({
    components: {
        DailyTaskOverviewItemCard,
        DailyTaskDetail,
    },
})
export default class DailyTaskOverview extends Vue {
    dailyTaskSummaryList: DailyTaskSummary[] = []
    dailyTaskOverviewLoading = false
    page = 1
    dailyTaskDialog = false
    dateSelected = ''

    created(): void {
        this.retrieveDailyTaskSummaryList()
    }

    private retrieveDailyTaskSummaryList(): void {
        this.dailyTaskOverviewLoading = true
        dailyTaskService.getDailyTaskSummary(this.page).then(
            (response: any) => {
                this.dailyTaskSummaryList = this.dailyTaskSummaryList.concat(response.body.content)
                this.dailyTaskOverviewLoading = false
            },
            (error: any) => {
                this.dailyTaskOverviewLoading = false
                console.error(error)
            }
        )
    }

    loadNextPage(): void {
        this.page += 1
        this.retrieveDailyTaskSummaryList()
    }

    openDailyTaskDetailDialog(date: string): void {
        this.dailyTaskDialog = true
        this.dateSelected = date
    }

    updateDailyTaskCompleted(date: string, numberOfDailyTaskCompleted: number): void {
        const dailyTaskSummary = this.dailyTaskSummaryList.find(d => d.date === date)
        if (dailyTaskSummary) {
            dailyTaskSummary.totalTaskCompleted = numberOfDailyTaskCompleted
        }
    }
}
</script>

<style scoped lang="scss"></style>
