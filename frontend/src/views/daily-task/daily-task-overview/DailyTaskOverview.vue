<template>
    <v-container>
        <h1 class="mb-6">Daily Overview</h1>
        <v-row>
            <v-col
                v-for="(dailyTaskOverview, index) in dailyTaskOverviewList"
                :key="index"
                cols="2">
                <DailyTaskOverviewItemCard
                    :dailyTaskOverview="dailyTaskOverview"
                    @openDailyTaskDetailDialog="openDailyTaskDetailDialog(dailyTaskOverview.date)">
                </DailyTaskOverviewItemCard>
            </v-col>
        </v-row>
        <div class="mt-5 d-flex justify-center" v-if="dailyTaskOverviewList.length">
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
                @dailyTaskCompleted="updateDailyTaskCompleted"
                @close="dailyTaskDialog = false">
            </DailyTaskDetail>
        </v-dialog>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { dailyTaskService } from '@/api/daily-task.api'
import DailyTaskOverviewModel from '@/models/daily-task-overview.model'
import DailyTaskOverviewItemCard from '@/views/daily-task/daily-task-overview/components/DailyTaskOverviewItemCard.vue'
import DailyTaskDetail from '@/views/daily-task/daily-task-overview/components/DailyTaskDetail.vue'

@Component({
    components: {
        DailyTaskOverviewItemCard,
        DailyTaskDetail,
    },
})
export default class DailyTaskOverview extends Vue {
    private dailyTaskOverviewList: DailyTaskOverviewModel[] = []
    private dailyTaskOverviewLoading = false
    private page = 1
    private dailyTaskDialog = false
    private dateSelected = ''

    created(): void {
        this.retrieveDailyTaskOverviewList()
    }

    private retrieveDailyTaskOverviewList(): void {
        this.dailyTaskOverviewLoading = true
        dailyTaskService.getDailyTaskOverview(this.page).then(
            (response: any) => {
                this.dailyTaskOverviewList = this.dailyTaskOverviewList.concat(
                    response.body.content
                )
                this.dailyTaskOverviewLoading = false
            },
            (error: any) => {
                this.dailyTaskOverviewLoading = false
                console.error(error)
            }
        )
    }

    private loadNextPage(): void {
        this.page += 1
        this.retrieveDailyTaskOverviewList()
    }

    private openDailyTaskDetailDialog(date: string): void {
        this.dailyTaskDialog = true
        this.dateSelected = date
    }

    private updateDailyTaskCompleted(date: string, numberOfDailyTaskCompleted: number): void {
        const dailyTaskOverview = this.dailyTaskOverviewList.find(
            (d: DailyTaskOverviewModel) => d.date === date
        )
        if (dailyTaskOverview) {
            dailyTaskOverview.totalTaskCompleted = numberOfDailyTaskCompleted
        }
    }
}
</script>

<style scoped lang="scss"></style>
