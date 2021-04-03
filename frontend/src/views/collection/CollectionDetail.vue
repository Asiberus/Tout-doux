<template>
  <v-container v-if="collection">
    <div class="d-flex justify-space-between align-center">
      <h1>
        Collection : {{ collection.name }}
      </h1>
      <div>
        <v-dialog v-model="collectionEditDialog" width="60%">
          <template #activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon>mdi-cog</v-icon>
            </v-btn>
          </template>
          <CollectionFormDialog :isDialogOpen="collectionEditDialog" :collection="collection"
                                @submit="updateCollection" @close="collectionEditDialog = false">
          </CollectionFormDialog>
        </v-dialog>

        <v-dialog v-model="collectionDeleteDialog" width="50%">
          <template #activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on" class="ml-1">
              <v-icon>mdi-trash-can</v-icon>
            </v-btn>
          </template>
          <ConfirmDialog color="error" @confirm="deleteCollection" @cancel="collectionDeleteDialog = false">
            <template #icon>
              <v-icon x-large>mdi-trash-can</v-icon>
            </template>
            <p>Are you sure to delete this collection ?</p>
            <p class="mb-0 font-italic" style="font-size: 1.1rem;">All related tasks will be deleted</p>
          </ConfirmDialog>
        </v-dialog>
      </div>
    </div>
    <v-divider class="my-3"></v-divider>
    <v-row>
      <v-col cols="8">
        <div class="d-flex align-center mb-1">
          <h3 class="flex-grow-1 mb-3 ml-2">Tasks</h3>
          <div>
            <v-btn @click="createTaskDisplayed = !createTaskDisplayed"
                   icon :color="createTaskDisplayed ? 'accent': null">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn @click="editTasksDisplay = !editTasksDisplay"
                   :disabled="tasksUncompleted.length === 0"
                   icon :color="editTasksDisplay ? 'purple': null">
              <v-icon>mdi-playlist-edit</v-icon>
            </v-btn>
          </div>
        </div>

        <template v-if="tasksUncompleted.length > 0">
          <TaskItemCard v-for="task in tasksUncompleted" :key="'task-uncompleted-' + task.id" :task="task"
                        :displayEditBtn="editTasksDisplay"
                        @toggleTaskState="toggleTaskState" @toggleEditMode="toggleTaskEditMode"
                        @taskFormSubmit="handleTaskFormSubmit" @deleteTask="deleteTask">
          </TaskItemCard>
        </template>
        <template v-else-if="collection.tasks.length > 0 && collection.tasks.length === tasksCompleted.length">
          <EmptyListDisplay message="You completed all the tasks for this collection!">
            <template #img>
              <img src="../../assets/all_task_completed.svg" alt="All tasks completed">
            </template>
          </EmptyListDisplay>
        </template>
        <template v-else>
          <EmptyListDisplay message="No task are related to this collection">
            <template #img>
              <img src="../../assets/no_tasks.svg" alt="No tasks">
            </template>
          </EmptyListDisplay>
        </template>


        <template v-if="collection.tasks.length > 0 && !(collection.tasks.length === 1 && createTaskDisplayed)">
          <h3 class="mt-7 mb-3 ml-2">Tasks completed</h3>
          <template v-if="tasksCompleted.length > 0">
            <TaskItemCard v-for="task in tasksCompleted" :key="'task-completed-' + task.id" :task="task"
                          @toggleTaskState="toggleTaskState" @toggleEditMode="toggleTaskEditMode"
                          @taskFormSubmit="handleTaskFormSubmit" @deleteTask="deleteTask">
            </TaskItemCard>
          </template>
          <template v-else>
            <EmptyListDisplay message="You didn't complete any task for this collection yet">
              <template #img>
                <img src="../../assets/no-task-completed.svg" alt="No tasks completed">
              </template>
            </EmptyListDisplay>
          </template>
        </template>

      </v-col>
      <v-col cols="4">
        <div class="d-flex justify-center mt-3">
          <v-progress-circular :value="percentageOfTaskCompleted" :color="colorOfProgressTaskCompleted"
                               :rotate="-90" :size="200" :width="20">
            <div>
              <span style="font-size: 2.5em;">{{ tasksCompleted.length }}</span>
              /
              <span style="font-size: 1em; transform: translateY(0.3em); display: inline-block">
                {{ totalTask }}
              </span>
            </div>
          </v-progress-circular>
        </div>
        <v-card class="mt-5">
          <v-card-title>Description</v-card-title>
          <v-card-text>
            {{ collection.description }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {collectionService} from "@/api/collection.api";
import {TaskDisplayModel} from "@/models/task.model";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import TaskItemCard from "@/views/project/components/TaskItemCard.vue";
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";
import {taskService} from "@/api/task.api";
import CollectionFormDialog from "@/views/collection/components/CollectionFormDialog.vue";
import {CollectionModel} from "@/models/collection.model";

@Component({
  components: {
    TaskItemCard,
    CollectionFormDialog,
    ConfirmDialog,
    EmptyListDisplay
  }
})
export default class CollectionDetail extends Vue {
  @Prop() collectionId!: number;

  private collection!: CollectionModel = null;

  private collectionEditDialog = false;

  private collectionDeleteDialog = false;

  private createTaskDisplayed = false;
  private editTasksDisplay = false;


  get tasksUncompleted(): TaskDisplayModel[] {
    return this.collection.tasks.filter((task: TaskDisplayModel) => !task.completed);
  }

  get tasksCompleted(): TaskDisplayModel[] {
    return this.collection.tasks.filter((task: TaskDisplayModel) => task.completed);
  }

  get totalTask(): number {
    return this.collection.tasks.filter((task: TaskDisplayModel) => !!task.id).length;
  }

  get percentageOfTaskCompleted(): number {
    return (this.tasksCompleted.length / this.totalTask) * 100;
  }

  get colorOfProgressTaskCompleted(): string {
    const colorArray = ['green lighten-4', 'green lighten-3', 'green lighten-2', 'green lighten-1', 'green'];
    const index = Math.trunc(this.percentageOfTaskCompleted * colorArray.length / 100) - 1;
    return colorArray[index];
  }

  created(): void {
    this.retrieveCollectionDetail();
  }

  @Watch('createTaskDisplayed')
  private onCreateTaskDisplayedChanges(value: boolean): void {
    if (value) {
      this.collection.tasks.unshift({editMode: true} as TaskDisplayModel);
    } else {
      // Delete first task if it has no id
      if (!this.collection.tasks[0].id) {
        this.collection.tasks.shift();
      }
    }
  }

  @Watch('editTasksDisplay')
  private onEditTasksDisplay(value: boolean): void {
    if (!value) {
      this.disableAllCreatedTasksEditMode();
    }
  }

  private disableAllCreatedTasksEditMode(): void {
    this.collection.tasks.filter((task: TaskDisplayModel) => task.id && task.editMode).forEach((task: TaskDisplayModel) => {
      task.editMode = false;
    });
  }

  private toggleTaskEditMode(task: TaskDisplayModel, value: boolean): void {
    // handle close create task card
    if (!task.id && !value) {
      this.createTaskDisplayed = false;
      return;
    }

    // Only one card can be in editMode
    this.disableAllCreatedTasksEditMode();
    task.editMode = value;
  }

  private retrieveCollectionDetail(): void {
    collectionService.getCollectionById(this.collectionId).then(
        (response: any) => {
          this.collection = response.body;
          this.collection.tasks.forEach((task: TaskDisplayModel) => {
            // Set all task to editMode false with the Vue reactivity $set function
            this.$set(task, 'editMode', false);
          });
        }, (error: any) => {
          console.error(error);
          this.$router.push({name: 'collection-list'});
        }
    );
  }

  private updateCollection(collectionForm: Partial<CollectionModel>): void {
    this.collectionEditDialog = false;
    collectionService.updateCollection(this.collection.id, collectionForm).then(
        (response: any) => {
          this.collection.name = response.body.name;
          this.collection.description = response.body.description;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private deleteCollection(): void {
    this.collectionDeleteDialog = false;
    collectionService.deleteCollection(this.collection.id).then(
        () => {
          this.$router.push({name: 'collection-list'});
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private handleTaskFormSubmit(taskId: number, taskForm: Partial<TaskDisplayModel>): void {
    if (taskId) {
      this.updateTask(taskId, taskForm);
    } else {
      this.createTask(taskForm);
    }
  }

  private toggleTaskState(taskId: number): void {
    const task = this.collection.tasks.find((task: TaskDisplayModel) => task.id === taskId);
    if (!task) {
      return;
    }

    taskService.updateTaskById(taskId, {completed: !task.completed} as TaskDisplayModel).then(
        (response: any) => {
          task.completed = response.body.completed
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private createTask(taskForm: Partial<TaskDisplayModel>): void {
    taskForm.collectionId = this.collection.id;
    taskService.createTask(taskForm).then(
        (response: any) => {
          this.$set(this.collection.tasks, 0, Object.assign({editMode: false}, response.body));
          this.createTaskDisplayed = false;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private updateTask(taskId: number, taskForm: Partial<TaskDisplayModel>): void {
    taskService.updateTaskById(taskId, taskForm).then(
        (response: any) => {
          const task = this.collection.tasks.find((t: TaskDisplayModel) => t.id === response.body.id);
          Object.assign(task, response.body, {editMode: false});
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private deleteTask(taskId: number): void {
    taskService.deleteTaskById(taskId).then(
        () => {
          const taskIndex = this.collection.tasks.findIndex((task: TaskDisplayModel) => task.id === taskId);
          if (taskIndex !== -1) {
            this.collection.tasks.splice(taskIndex, 1);
          }
        }, (error: any) => {
          console.error(error);
        }
    )
  }

}
</script>

<style scoped lang="scss">

</style>