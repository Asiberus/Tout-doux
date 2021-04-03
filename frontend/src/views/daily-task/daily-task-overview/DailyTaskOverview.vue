<template>
  <v-container>
    <h1 class="mb-6">Daily Overview</h1>
    <v-row>
      <v-col v-for="(dailyTask, index) in dailyTaskOverviewList" :key="index" cols="2">
        <DailyTaskOverviewItemCard :dailyTaskOverview="dailyTask"></DailyTaskOverviewItemCard>
      </v-col>
    </v-row>
    <div class="mt-5 d-flex justify-center" v-if="dailyTaskOverviewList.length">
      <v-btn @click="loadNextPage" :loading="dailyTaskOverviewLoading" rounded>
        Load more days
      </v-btn>
    </div>
  </v-container>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {dailyTaskService} from "@/api/daily-task.api";
import DailyTaskOverviewModel from "@/models/daily-task-overview.model";
import DailyTaskOverviewItemCard from "@/views/daily-task/daily-task-overview/components/DailyTaskOverviewItemCard.vue";

@Component({
  components: {
    DailyTaskOverviewItemCard
  }
})
export default class DailyTaskOverview extends Vue {
  private dailyTaskOverviewList: DailyTaskOverviewModel[] = [];
  private dailyTaskOverviewLoading: boolean;
  private page = 1;

  created(): void {
    this.retrieveDailyTaskOverviewList();
  }

  private retrieveDailyTaskOverviewList(): void {
    this.dailyTaskOverviewLoading = true;
    dailyTaskService.getDailyTaskOverview(this.page).then(
        (response: any) => {
          this.dailyTaskOverviewList = this.dailyTaskOverviewList.concat(response.body.content);
          this.dailyTaskOverviewLoading = false;
        }, (error: any) => {
          this.dailyTaskOverviewLoading = false;
          console.error(error)
        }
    )
  }

  private loadNextPage(): void {
    this.page += 1;
    this.retrieveDailyTaskOverviewList();
  }
}
</script>

<style scoped lang="scss">

</style>