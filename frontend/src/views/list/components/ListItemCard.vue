<template>
  <v-card rounded :to="{name: 'list-detail', params: {id: list.id}}">
    <v-progress-linear :value="listPercentageOfTaskCompleted" color="green accent-2"
                       height="6">
    </v-progress-linear>
    <v-card-text class="d-flex justify-space-between align-center">
      <div class="d-flex flex-column justify-center">
        <h1 class="white--text mt-1">{{ list.name }}</h1>
        <p class="mb-0 mt-3 ml-2">{{ ellipsisFilter(list.description, 50) }}</p>
      </div>
      <div class="pr-7">
        <span style="font-size: 2.5em;" class="white--text">{{ listTasksCompleted }}</span>
        /
        <span style="font-size: 1.5em; transform: translateY(0.3em); display: inline-block">
                {{ list.tasks.length }}
              </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {TaskDisplayModel} from "@/models/task.model";
import ListModel from "@/models/list.model";
import ellipsisFilter from "@/filters/ellipsis.filter";


@Component
export default class ListItemCard extends Vue {
  @Prop() private list!: ListModel;

  get listTasksCompleted(): number {
    return this.list.tasks.filter((task: TaskDisplayModel) => task.completed).length;
  }

  get listPercentageOfTaskCompleted(): number {
    return (this.listTasksCompleted / this.list.tasks.length) * 100;
  }

  private ellipsisFilter(value: string, numberOfCharacter: number): string {
    return ellipsisFilter(value, numberOfCharacter);
  }
}
</script>

<style scoped lang="scss">

</style>