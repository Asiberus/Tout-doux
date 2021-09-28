<template>
  <v-container>
    <div class="d-flex justify-end mb-5">
      <v-dialog v-model="sectionDialog" width="60%">
        <template #activator="{ on, attrs }">
          <v-btn v-if="project.sections.length > 0"
                 v-bind="attrs" v-on="on"
                 :disabled="project.archived">
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

    <template v-if="project.sections.length > 0">
      <div v-for="(section, index) in project.sections" :key="section.id">
        <ProjectSectionItem :section="section" :disabled="project.archived">
        </ProjectSectionItem>
        <v-divider v-if="index !== project.sections.length - 1"/>
      </div>
    </template>
    <template v-else>
      <EmptyListDisplay class="mt-15">
        <template #img>
          <img src="../../../../assets/project_section.svg" alt="No sections">
        </template>
        <template #message>
          <div class="d-flex align-center mt-2">
            <span>This project has no section</span>
            <v-btn v-if="!project.archived" @click="sectionDialog = true" small class="ml-3">
              <v-icon left small>mdi-plus</v-icon>
              add a section
            </v-btn>
          </div>
        </template>
      </EmptyListDisplay>
    </template>
  </v-container>
</template>

<script lang="ts">
import {sectionService} from '@/api/section.api';
import {SectionPost} from '@/models/section.model';
import SectionDialog from '@/views/project/project-detail/components/SectionDialog.vue';
import {Component, Prop, Vue} from "vue-property-decorator";
import {ProjectModel} from "@/models/project.model";
import ProjectSectionItem from "@/views/project/project-detail/components/ProjectSectionItem.vue";
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";

@Component({
  components: {
    ProjectSectionItem,
    SectionDialog,
    EmptyListDisplay,
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
