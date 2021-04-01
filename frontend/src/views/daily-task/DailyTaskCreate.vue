<template>
  <v-container>
    <h1 class="mb-6"><span class="grey--text">Daily Task : </span>{{ dateFormatted }}</h1>

    <v-row>
      <v-col cols="8">
        <h2 class="mb-3 ml-2">Projects</h2>
        <v-row align-content="start" class="project-wrapper">
          <v-col v-for="project in projectList" :key="'project-' + project.id" cols="3"
                 :class="{selected: project.selected}">
            <v-card v-on="!project.selected ? {click: () => selectProject(project)}: {}">
              <v-progress-linear :value="percentageOfTaskCompleted(project)" color="green accent-2"
                                 height="4">
              </v-progress-linear>
              <v-card-text>
                <div class="d-flex justify-space-between align-center project-card-header">
                  <h3 class="white--text">
                    <span v-if="project.selected" class="grey--text">Select task for project : </span>
                    {{ project.name }}
                    <v-icon v-if="project.priority === priorityEnum.IMPORTANT" color="error" dense small>
                      mdi-alert-decagram
                    </v-icon>
                  </h3>
                  <div class="mx-3" v-if="!project.selected">
                    <span style="font-size: 1.8em;" class="white--text">{{ numberOfTasksCompleted(project) }}</span>
                    /
                    <span style="font-size: 1.1em; transform: translateY(0.3em); display: inline-block">
                      {{ project.tasks.length }}
                    </span>
                  </div>
                  <v-btn v-if="project.selected" @click.stop="project.selected = false" color="red" icon>
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
                <template v-if="project.selected">
                  <v-divider class="my-3"></v-divider>
                  <template v-if="taskUncompleted(project).length">
                    <v-row align-content="start" class="task-wrapper">
                      <v-col v-for="task of taskUncompleted(project)" :key="'project-task-' + task.id"
                             cols="6">
                        <v-card @click="selectTask(task)" :disabled="isTaskSelected(task)"
                                color="#212121" elevation="5">
                          <v-card-text class="p-1">
                            <h5 class="white--text">
                              {{ task.name }}
                              <v-icon v-if="task.priority === priorityEnum.IMPORTANT" color="error" dense small>
                                mdi-alert-decagram
                              </v-icon>
                            </h5>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </template>
                  <template v-else>
                    <EmptyListDisplay message="No task are related to this project">
                      <template #img>
                        <img src="../../assets/no_tasks.svg" alt="No tasks" height="150">
                      </template>
                    </EmptyListDisplay>
                  </template>
                </template>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-3"></v-divider>
        <h2 class="mb-3 ml-2">Collections</h2>
        <v-row align-content="start" class="collection-wrapper">
          <v-col v-for="collection in collectionList" :key="'collection-' + collection.id" cols="3">
            <v-card>
              <v-progress-linear :value="percentageOfTaskCompleted(collection)" color="green accent-2"
                                 height="4">
              </v-progress-linear>
              <v-card-text class="d-flex justify-space-between align-center">
                <h3 class="white--text">
                  {{ collection.name }}
                </h3>
                <div class="pr-3">
                  <span style="font-size: 1.8em;" class="white--text">{{ numberOfTasksCompleted(collection) }}</span>
                  /
                  <span style="font-size: 1.1em; transform: translateY(0.3em); display: inline-block">
                    {{ collection.tasks.length }}
                  </span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </v-col>
      <v-col cols="4" class="daily-task-wrapper">
        <h2 class="mb-3">Tasks of the day</h2>
        <template v-for="dailyTask in dailyTaskList">
          <v-hover v-slot="{ hover }" :key="'daily-task' + dailyTask.id + dailyTask.name">
            <v-card class="daily-task-card mb-3">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-menu>
                    <template #activator="{ on, attrs }">
                      <v-chip v-bind="attrs" v-on="on" class="mr-3" :color="getActionChipColor(dailyTask.action)">
                        <template v-if="dailyTask.action">{{
                            getLiteralFormOfDailyActionEnum(dailyTask.action)
                          }}
                        </template>
                        <!--                    <template v-else><v-icon>mdi-playlist-check</v-icon></template>-->
                        <template v-else>
                          <v-icon>mdi-notification-clear-all</v-icon>
                        </template>
                      </v-chip>
                    </template>
                    <v-list>
                      <v-list-item v-for="action in dailyTaskActionItems" :key="action.value"
                                   @click="updateDailyTaskAction(dailyTask.id, action.value)" dense>
                        <span :class="{'font-italic grey--text': !action.value}">{{ action.text }}</span>
                      </v-list-item>
                    </v-list>
                  </v-menu>

                  <template v-if="dailyTask.task">
                    <div class="flex-grow-1 d-flex align-center">
                      <h4 class="white--text font-weight-regular">
                        {{ dailyTask.task.name }}
                        <v-icon v-if="dailyTask.task.priority === priorityEnum.IMPORTANT" dense small color="error"
                                class="ml-1">
                          mdi-alert-decagram
                        </v-icon>
                      </h4>
                    </div>
                  </template>

                  <v-slide-x-reverse-transition>
                    <div v-if="hover" class="daily-task-card-actions">
                      <v-btn @click="deleteDailyTask(dailyTask.id)"
                             icon color="error" small class="ml-3">
                        <v-icon>mdi-trash-can</v-icon>
                      </v-btn>
                    </div>
                  </v-slide-x-reverse-transition>
                </div>
              </v-card-text>
            </v-card>
          </v-hover>
        </template>

      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import moment from "moment";
import CollectionModel from "@/models/collection.model";
import {DailyTaskProjectDisplayModel, ProjectModel} from "@/models/project.model";
import {projectService} from "@/api/project.api";
import {collectionService} from "@/api/collection.api";
import {TaskDisplayModel, TaskModel} from "@/models/task.model";
import {PriorityEnum} from "@/models/priority.enum";
import {DailyTaskActionEnum, DailyTaskModel} from "@/models/daily-task.model";
import {dailyTaskService} from "@/api/daily-task.api";
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";

// todo : garder les task selectionnées dans les project et collections
@Component({
  components: {
    EmptyListDisplay
  }
})
export default class DailyTaskCreate extends Vue {
  @Prop() private date!: string;

  private dailyTaskList: DailyTaskModel[] = [];
  private projectList: DailyTaskProjectDisplayModel[] = [];
  private collectionList: CollectionModel[] = [];

  private priorityEnum = PriorityEnum;
  private dailyTaskActionEnum = DailyTaskActionEnum;

  get dateFormatted(): string {
    return moment(this.date).format('dddd DD MMMM Y');
  }

  get taskUncompleted(): (item: DailyTaskProjectDisplayModel) => TaskDisplayModel[] {
    return (item: DailyTaskProjectDisplayModel) => item.tasks.filter((task: TaskDisplayModel) => !task.completed);
  }

  // todo : change color of task selected
  get isTaskSelected(): (task: TaskModel) => boolean {
    return (task: TaskModel) => this.dailyTaskList.some((dailyTask: DailyTaskModel) => task.id === dailyTask.taskId);
  }

  get numberOfTasksCompleted(): (item: DailyTaskProjectDisplayModel | CollectionModel) => number {
    return (item: ProjectModel | CollectionModel) => item.tasks.filter((task: TaskDisplayModel) => task.completed).length;
  }

  get percentageOfTaskCompleted(): (item: DailyTaskProjectDisplayModel | CollectionModel) => number {
    return (item: ProjectModel | CollectionModel) => (this.numberOfTasksCompleted(item) / item.tasks.length) * 100;
  }

  get dailyTaskActionItems(): { text: string; value: DailyTaskActionEnum | null }[] {
    return [
      {value: null, text: 'No action'},
      {value: this.dailyTaskActionEnum.THINK, text: this.getLiteralFormOfDailyActionEnum(DailyTaskActionEnum.THINK)},
      {value: this.dailyTaskActionEnum.WORK, text: this.getLiteralFormOfDailyActionEnum(DailyTaskActionEnum.WORK)},
      {value: this.dailyTaskActionEnum.FINISH, text: this.getLiteralFormOfDailyActionEnum(DailyTaskActionEnum.FINISH)},
    ];
  }

  created(): void {
    this.retrieveDailyTaskList();
    this.retrieveProjectList();
    this.retrieveCollectionList();
  }

  // Todo : move this function to a better place
  // Todo : define color for dailytask action chip
  private getLiteralFormOfDailyActionEnum(action: DailyTaskActionEnum): string {
    switch (action) {
      case DailyTaskActionEnum.THINK:
        return 'Réfléchir';
      case DailyTaskActionEnum.WORK:
        return 'Travailler';
      case DailyTaskActionEnum.FINISH:
        return 'Finir';
      default:
        return null;
    }
  }

  private getActionChipColor(action: DailyTaskActionEnum): string {
    switch (action) {
      case DailyTaskActionEnum.THINK:
        return 'teal';
      case DailyTaskActionEnum.WORK:
        return 'purple';
      case DailyTaskActionEnum.FINISH:
        return 'red';
    }
  }

  private retrieveDailyTaskList(): void {
    const date = moment().format('Y-MM-DD');
    dailyTaskService.getDailyTasksByDate(date).then(
        (response: any) => {
          this.dailyTaskList = response.body.content;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private retrieveProjectList(): void {
    projectService.getProjectList({archived: false}).then(
        (response: any) => {
          this.projectList = response.body.content;
          this.projectList.forEach((project: DailyTaskProjectDisplayModel) => {
            this.$set(project, 'selected', false);
          })
        }, (error: any) => {
          console.error(error);
        }
    );
  }

  private retrieveCollectionList(): void {
    collectionService.getCollectionList().then(
        (response: any) => {
          this.collectionList = response.body.content;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private selectProject(project: DailyTaskProjectDisplayModel): void {
    project.selected = true;
  }

  private selectTask(task: TaskModel): void {
    this.createDailyTask({taskId: task.id});
  }

  private updateDailyTaskAction(dailyTaskId: number, action: DailyTaskActionEnum | null): void {
    this.updateDailyTask(dailyTaskId, {action});
  }

  private createDailyTask(dailyTaskForm: Partial<DailyTaskModel>): void {
    dailyTaskService.createDailyTask(dailyTaskForm).then(
        (response: any) => {
          this.dailyTaskList.push(response.body);
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private updateDailyTask(dailyTaskId: number, dailyTaskForm: Partial<DailyTaskModel>): void {
    dailyTaskService.updateDailyTask(dailyTaskId, dailyTaskForm).then(
        (response: any) => {
          const dailyTask = this.dailyTaskList.find((dailyTask: DailyTaskModel) => dailyTask.id === response.body.id);
          Object.assign(dailyTask, response.body);
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private deleteDailyTask(dailyTaskId: number): void {
    dailyTaskService.deleteDailyTask(dailyTaskId).then(
        () => {
          const dailyTaskIndex = this.dailyTaskList.findIndex((dailyTask: DailyTaskModel) => dailyTask.id === dailyTaskId);
          if (dailyTaskIndex !== -1) {
            this.dailyTaskList.splice(dailyTaskIndex, 1);
          }
        }, (error: any) => {
          console.error(error);
        }
    )
  }

}
</script>

<style scoped lang="scss">
.project-wrapper {
  height: 20rem;
  position: relative;

  .selected {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    max-width: 100%;
    z-index: 1;

    .v-card {
      height: 100%;

      .v-card__text {
        height: 100%;

        .project-card-header {
          height: 15%;
        }

        .task-wrapper {
          height: 80%;
          overflow-y: auto;
        }
      }
    }
  }
}

.collection-wrapper {
  height: 20rem;
}

.daily-task-wrapper {
  max-height: 45rem;
  overflow: auto;

  .daily-task-card {
    //&:hover .daily-task-card-actions {
    //  opacity: 1;
    //  transform: translateX(0);
    //}

    //.daily-task-card-actions {
    //  opacity: 0;
    //  transform: translateX(10px);
    //  transition: all .15s ease-in;
    //}
  }
}
</style>