<template>
  <v-card rounded :to="{name: 'collection-detail', params: {id: collection.id}}">
    <v-progress-linear :value="percentageOfTaskCompleted" color="green accent-2"
                       height="6">
    </v-progress-linear>
    <v-card-text class="d-flex justify-space-between align-center">
      <div class="d-flex flex-column justify-center">
        <h1 class="white--text mt-1">{{ collection.name }}</h1>
        <p class="mb-0 mt-3 ml-2">{{ ellipsisFilter(collection.description, 50) }}</p>
      </div>
      <div class="pr-7">
        <span style="font-size: 2.5em;" class="white--text">{{ tasksCompleted }}</span>
        /
        <span style="font-size: 1.5em; transform: translateY(0.3em); display: inline-block">
                {{ collection.tasks.length }}
              </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {TaskModel} from "@/models/task.model";
import ellipsisFilter from "@/filters/ellipsis.filter";
import {CollectionModel} from "@/models/collection.model";


@Component
export default class CollectionItemCard extends Vue {
  @Prop() private collection!: CollectionModel;

  get tasksCompleted(): number {
    return this.collection.tasks.filter((task: TaskModel) => task.completed).length;
  }

  get percentageOfTaskCompleted(): number {
    return (this.tasksCompleted / this.collection.tasks.length) * 100;
  }

  private ellipsisFilter(value: string, numberOfCharacter: number): string {
    return ellipsisFilter(value, numberOfCharacter);
  }
}
</script>

<style scoped lang="scss">

</style>
