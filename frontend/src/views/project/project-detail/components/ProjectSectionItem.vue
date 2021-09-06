<template>
  <v-container>
    <div class="d-flex align-center">
      <h3>{{ section.name }}</h3>
      <div>
        <v-btn icon>
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon>
          <v-icon>mdi-trash-can</v-icon>
        </v-btn>
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {SectionModel} from "@/models/section.model";

@Component
export default class ProjectSectionItem extends Vue {
  @Prop() section!: SectionModel;
}
</script>

<style scoped lang="scss">

</style>