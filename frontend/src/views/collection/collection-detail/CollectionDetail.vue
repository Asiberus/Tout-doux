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
        <CollectionCompletedTasks :collection="collection"/>
      </v-tab-item>
      <v-tab-item value="configuration" :transition="false">
        <CollectionConfiguration :collection="collection" :tab="collectionTab"/>
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
  //Todo : remove v-container
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
}
</script>

<style scoped lang="scss">

</style>
