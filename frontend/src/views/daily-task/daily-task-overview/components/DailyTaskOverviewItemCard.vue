<template>
  <v-hover v-slot="{ hover }">
    <v-card :color="backgroundColor" class="position-relative">
      <v-card-text>
        <h1 class="white--text mb-2">{{ dailyTaskDayOfWeek }}</h1>
        <div class="d-flex justify-space-between">
          <p class="daily-task-date">{{ dailyTaskDateFormat }}</p>
          <div class="pr-2" v-if="dailyTaskOverview.totalTask">
            <span style="font-size: 3em;" class="white--text">{{ dailyTaskOverview.totalTaskCompleted }}</span>
            /
            <span style="font-size: 1.8em; transform: translateY(0.3em); display: inline-block">
                {{ dailyTaskOverview.totalTask }}
              </span>
          </div>
        </div>
      </v-card-text>
      <v-scale-transition origin="center">
        <v-card-actions v-if="isToday && hover" class="card-action">
          <v-btn :to="{name: 'daily-task-update', params: {date: dailyTaskOverview.date}}"
                 class="action-button" color="accent" x-small fab>
            <v-icon>
              mdi-pencil
            </v-icon>
          </v-btn>
        </v-card-actions>
      </v-scale-transition>
    </v-card>
  </v-hover>

</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import DailyTaskOverviewModel from "../../../../models/daily-task-overview.model";
import moment from "moment";

@Component
export default class DailyTaskOverviewItemCard extends Vue {
  @Prop() private dailyTaskOverview!: DailyTaskOverviewModel;

  get isToday(): boolean {
    return moment().isSame(this.dailyTaskOverview.date, 'days');
  }

  get dailyTaskDayOfWeek(): string {
    return moment(this.dailyTaskOverview.date).format('dddd');
  }

  get dailyTaskDateFormat(): string {
    return moment(this.dailyTaskOverview.date).format('DD MMMM Y');
  }

  // todo : Set colorArray
  get colorOfTaskCompleted(): string {
    const colorArray = ['#163317', 'green darken-3', 'green darken-2', 'green darken-1', 'green'];
    const index = Math.trunc(this.dailyTaskOverview.totalTaskCompleted * colorArray.length / this.dailyTaskOverview.totalTask) - 1;
    return colorArray[index];
  }

  get backgroundColor(): string {
    if (!this.dailyTaskOverview.totalTask) {
      return '#151515';
    }
    return this.colorOfTaskCompleted;
  }
}
</script>

<style scoped lang="scss">
//Todo : move to general file
.position-relative {
  position: relative;
}

.daily-task-date {
  font-size: 1rem;
  padding-left: .3rem;
}

.card-action {
  position: absolute;
  top: -20px;
  right: 5px;
}

.action-button {

}
</style>