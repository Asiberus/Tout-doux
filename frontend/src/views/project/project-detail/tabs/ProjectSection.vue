<template>
  <v-container>
    <div class="d-flex justify-end">
      <v-dialog v-model="sectionDialog" width="60%">
        <template #activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" :disabled="project.archived">
            <v-icon>mdi-plus</v-icon>
            section
          </v-btn>
        </template>
        <SectionDialog :is-dialog-open="sectionDialog"
                       @submit="createSection"
                       @close="sectionDialog = false"
        >
        </SectionDialog>
      </v-dialog>

    </div>
    <div v-for="(section, index) in project.sections" :key="section.id">
      <ProjectSectionItem :section="section" :disabled="project.archived">
      </ProjectSectionItem>
      <v-divider v-if="index !== project.sections.length - 1"/>
    </div>
  </v-container>
</template>

<script lang="ts">
import {sectionService} from '@/api/section.api';
import {SectionPost} from '@/models/section.model';
import SectionDialog from '@/views/project/project-detail/components/SectionDialog.vue';
import {Component, Prop, Vue} from "vue-property-decorator";
import {ProjectModel} from "@/models/project.model";
import ProjectSectionItem from "@/views/project/project-detail/components/ProjectSectionItem.vue";

@Component({
  components: {
    ProjectSectionItem,
    SectionDialog
  }
})
export default class ProjectSection extends Vue {
  @Prop() project!: ProjectModel;

  sectionDialog = false;

  createSection(data: { name: string }): void {
    this.sectionDialog = false;
    const section: SectionPost = {
      name: data.name,
      projectId: this.project.id
    };
    sectionService.createSection(section).then(
            response => {
              this.project.sections.unshift(response.body)
            }, error => {
              console.error(error)
            }
    )
  }

}
</script>

<style scoped lang="scss">

</style>
