<template>
    <div>
        <div class="d-flex justify-end mb-5">
            <v-dialog v-model="sectionDialog" width="60%">
                <template #activator="{ on, attrs }">
                    <v-btn
                        v-if="sections.length > 0"
                        :disabled="project.archived"
                        v-bind="attrs"
                        v-on="on">
                        <v-icon>mdi-plus</v-icon>
                        section
                    </v-btn>
                </template>
                <SectionDialog
                    :is-dialog-open="sectionDialog"
                    @submit="createSection"
                    @close="sectionDialog = false">
                </SectionDialog>
            </v-dialog>
        </div>

        <template v-if="sections.length > 0">
            <div v-for="(section, index) in sections" :key="section.id">
                <ProjectSectionItem
                    :section="section"
                    @update="updateSection"
                    @delete="deleteSection">
                </ProjectSectionItem>
                <v-divider v-if="index !== sections.length - 1" class="my-3" />
            </div>
        </template>
        <template v-else>
            <EmptyListDisplay class="mt-15">
                <template #img>
                    <img src="../../../../assets/project_section.svg" alt="No sections" />
                </template>
                <template #message>
                    <div class="d-flex align-center mt-2">
                        <span>This project has no section</span>
                        <v-btn
                            v-if="!project.archived"
                            @click="sectionDialog = true"
                            small
                            class="ml-3">
                            <v-icon left small>mdi-plus</v-icon>
                            add a section
                        </v-btn>
                    </div>
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { ProjectTask } from '@/models/project.model'
import { SectionTask } from '@/models/section.model'
import { projectActions } from '@/store/modules/project.store'
import ProjectSectionItem from '@/views/project/project-detail/components/ProjectSectionItem.vue'
import SectionDialog from '@/views/project/project-detail/components/SectionDialog.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({
    components: {
        ProjectSectionItem,
        SectionDialog,
        EmptyListDisplay,
    },
})
export default class ProjectSection extends Vue {
    sectionDialog = false

    get project(): ProjectTask {
        return this.$store.state.project.currentProject
    }

    get sections(): SectionTask[] {
        return this.project.sections
    }

    createSection(data: { name: string }): void {
        this.sectionDialog = false
        this.$store.dispatch(projectActions.section.addSection, {
            name: data.name,
            projectId: this.project.id,
        })
    }

    updateSection(id: number, name: string): void {
        this.$store.dispatch(projectActions.section.editSection, { id, name })
    }

    deleteSection(id: number): void {
        this.$store.dispatch(projectActions.section.deleteSection, id)
    }
}
</script>

<style scoped lang="scss"></style>
