<template>
    <div>
        <template v-if="sections.length > 0">
            <div class="d-flex align-center mb-2">
                <v-tabs
                    v-model="sectionTabs"
                    color="accent"
                    hide-slider
                    show-arrows
                    background-color="transparent">
                    <v-tab v-for="section of sections" :key="'tab-' + section.id">
                        {{ section.name }}
                    </v-tab>
                </v-tabs>

                <v-btn
                    v-if="sections.length > 0"
                    @click="sectionDialog = true"
                    :disabled="project.archived">
                    <v-icon>mdi-plus</v-icon>
                    section
                </v-btn>
            </div>

            <v-tabs-items v-model="sectionTabs" class="transparent pa-3">
                <v-tab-item v-for="section of sections" :key="'tab-item-' + section.id">
                    <ProjectSectionItem :section="section"> </ProjectSectionItem>
                </v-tab-item>
            </v-tabs-items>
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

        <v-dialog v-model="sectionDialog" width="60%">
            <SectionDialog
                :is-dialog-open="sectionDialog"
                @submit="createSection"
                @close="sectionDialog = false">
            </SectionDialog>
        </v-dialog>
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
    sectionTabs = 0

    get project(): ProjectTask {
        return this.$store.state.project.currentProject
    }

    get sections(): SectionTask[] {
        return this.project.sections
    }

    createSection(data: { name: string }): void {
        this.sectionDialog = false
        this.$store
            .dispatch(projectActions.section.addSection, {
                name: data.name,
                projectId: this.project.id,
            })
            .then(() => {
                this.sectionTabs = this.sections.length - 1
            })
    }
}
</script>

<style scoped lang="scss"></style>
