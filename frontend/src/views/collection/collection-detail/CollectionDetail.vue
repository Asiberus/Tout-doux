<template>
  <v-container v-if="collection">
    <h1>Collection : {{ collection.name }}</h1>

    <v-divider class="my-3"/>

    <v-tabs v-model="collectionTab" background-color="transparent" color="accent">
      <v-tab href="#description">Description</v-tab>
      <v-tab href="#completed-tasks">Completed Task</v-tab>
      <v-tab href="#configuration">Configuration</v-tab>
    </v-tabs>

    <v-tabs-items v-model="collectionTab" class="transparent">
      <v-tab-item value="description" :transition="false">
        <CollectionDescription :collection="collection"/>
      </v-tab-item>
      <v-tab-item value="completed-tasks" :transition="false">
        <CollectionCompletedTasks/>
      </v-tab-item>
      <v-tab-item value="configuration" :transition="false">
        <CollectionConfiguration/>
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script lang="ts">
  import {collectionService} from '@/api/collection.api';
  import ConfirmDialog from '@/components/ConfirmDialog.vue';
  import EmptyListDisplay from '@/components/EmptyListDisplay.vue';
  import {CollectionModel} from '@/models/collection.model';
  import CollectionCompletedTasks from '@/views/collection/collection-detail/tabs/CollectionCompletedTasks.vue';
  import CollectionConfiguration from '@/views/collection/collection-detail/tabs/CollectionConfiguration.vue';
  import CollectionDescription from '@/views/collection/collection-detail/tabs/CollectionDescription.vue';
  import CollectionFormDialog from '@/views/collection/components/CollectionFormDialog.vue';
  import TaskItemCard from '@/views/components/task/TaskItemCard.vue';
  import {Component, Prop, Vue} from 'vue-property-decorator';

  @Component({
  components: {
    CollectionConfiguration,
    CollectionCompletedTasks,
    CollectionDescription,
    TaskItemCard,
    CollectionFormDialog,
    ConfirmDialog,
    EmptyListDisplay
  }
})
export default class CollectionDetail extends Vue {
  @Prop() collectionId!: number;

  private collection: CollectionModel | null = null;
  private collectionTab = 'description';

  created(): void {
    this.retrieveCollectionDetail();
  }

  private retrieveCollectionDetail(): void {
    collectionService.getCollectionById(this.collectionId).then(
            (response: any) => {
              this.collection = response.body;
            }, (error: any) => {
              console.error(error);
              this.$router.push({name: 'collection-list'});
            }
    );
  }

  // @Watch('createTaskDisplayed')
  // private onCreateTaskDisplayedChanges(value: boolean): void {
  //   if (value) {
  //     this.collection.tasks.unshift({editMode: true} as TaskModel);
  //   } else {
  //     // Delete first task if it has no id
  //     if (!this.collection.tasks[0].id) {
  //       this.collection.tasks.shift();
  //     }
  //   }
  // }

  // @Watch('editTasksDisplay')
  // private onEditTasksDisplay(value: boolean): void {
  //   if (!value) {
  //     this.disableAllCreatedTasksEditMode();
  //   }
  // }

  // private disableAllCreatedTasksEditMode(): void {
  //   this.collection.tasks.filter((task: TaskModel) => task.id && task.editMode).forEach((task: TaskModel) => {
  //     task.editMode = false;
  //   });
  // }

  // private toggleTaskEditMode(task: TaskModel, value: boolean): void {
  //   // handle close create task card
  //   if (!task.id && !value) {
  //     this.createTaskDisplayed = false;
  //     return;
  //   }
  //
  //   // Only one card can be in editMode
  //   this.disableAllCreatedTasksEditMode();
  //   task.editMode = value;
  // }
  //
  // private updateCollection(collectionForm: Partial<CollectionModel>): void {
  //   this.collectionEditDialog = false;
  //   collectionService.updateCollection(this.collection.id, collectionForm).then(
  //       (response: any) => {
  //         this.collection.name = response.body.name;
  //         this.collection.description = response.body.description;
  //       }, (error: any) => {
  //         console.error(error);
  //       }
  //   )
  // }
  //
  // private deleteCollection(): void {
  //   this.collectionDeleteDialog = false;
  //   collectionService.deleteCollection(this.collection.id).then(
  //       () => {
  //         this.$router.push({name: 'collection-list'});
  //       }, (error: any) => {
  //         console.error(error);
  //       }
  //   )
  // }
  //
  // private handleTaskFormSubmit(taskId: number, taskForm: Partial<TaskModel>): void {
  //   if (taskId) {
  //     this.updateTask(taskId, taskForm);
  //   } else {
  //     this.createTask(taskForm);
  //   }
  // }
  //
  // private toggleTaskState(taskId: number): void {
  //   const task = this.collection.tasks.find((task: TaskModel) => task.id === taskId);
  //   if (!task) {
  //     return;
  //   }
  //
  //   taskService.updateTaskById(taskId, {completed: !task.completed} as TaskModel).then(
  //       (response: any) => {
  //         task.completed = response.body.completed
  //       }, (error: any) => {
  //         console.error(error);
  //       }
  //   )
  // }
  //

  //
  // private updateTask(taskId: number, taskForm: Partial<TaskModel>): void {
  //   taskService.updateTaskById(taskId, taskForm).then(
  //       (response: any) => {
  //         const task = this.collection.tasks.find((t: TaskModel) => t.id === response.body.id);
  //         Object.assign(task, response.body, {editMode: false});
  //       }, (error: any) => {
  //         console.error(error);
  //       }
  //   )
  // }
  //
  // private deleteTask(taskId: number): void {
  //   taskService.deleteTaskById(taskId).then(
  //       () => {
  //         const taskIndex = this.collection.tasks.findIndex((task: TaskModel) => task.id === taskId);
  //         if (taskIndex !== -1) {
  //           this.collection.tasks.splice(taskIndex, 1);
  //         }
  //       }, (error: any) => {
  //         console.error(error);
  //       }
  //   )
  // }

}
</script>

<style scoped lang="scss">

</style>
