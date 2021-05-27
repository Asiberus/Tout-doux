<template>
  <v-container>
    <div class="d-flex justify-end">
      <v-btn>
        <v-icon>mdi-plus</v-icon>
        section
      </v-btn>
    </div>
    <div v-for="section in project.sections" :key="section.id">
      <ProjectSectionItem :section="section"></ProjectSectionItem>
      <v-divider></v-divider>
    </div>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";
import {ProjectModel} from "@/models/project.model";
import ProjectSectionItem from "@/views/project/project-detail/components/ProjectSectionItem.vue";
@Component({
  components: {ProjectSectionItem}
})
export default class ProjectSection extends Vue {
  @Prop() project!: ProjectModel;
}
</script>

<style scoped lang="scss">

</style>