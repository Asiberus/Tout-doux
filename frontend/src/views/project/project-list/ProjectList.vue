<template>
    <div>
        <div class="d-flex justify-end align-end mb-4">
            <h1 class="flex-grow-1 text-h3 mb-3">Projects</h1>

            <FilterChip
                :value="archived"
                @input="toggleArchivedProject()"
                color="accent"
                icon="mdi-archive"
                class="mr-3">
                Archived
            </FilterChip>

            <v-dialog v-model="projectDialog" width="60%">
                <template #activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on">
                        <v-icon left>mdi-plus</v-icon>
                        project
                    </v-btn>
                </template>
                <ProjectFormDialog
                    :isDialogOpen="projectDialog"
                    @submit="createProject"
                    @close="projectDialog = false">
                </ProjectFormDialog>
            </v-dialog>
        </div>

        <template v-if="projectList.length > 0">
            <v-row>
                <v-col v-for="project in projectList" :key="project.id" cols="4">
                    <ProjectItemCard :project="project" />
                </v-col>
            </v-row>
        </template>
        <template v-else>
            <EmptyListDisplay>
                <template #img>
                    <img
                        src="../../../assets/project.svg"
                        alt="No project"
                        style="max-width: 450px"
                        v-if="!archived" />
                    <img
                        src="../../../assets/project_archived.svg"
                        alt="No archived project"
                        style="max-width: 450px"
                        v-else />
                </template>
                <template #message>
                    <div class="d-flex align-center" v-if="!archived">
                        <span>You don't have any project yet !</span>
                        <v-btn @click="projectDialog = true" small class="ml-2">
                            <v-icon left>mdi-plus</v-icon>
                            project
                        </v-btn>
                    </div>
                    <div v-else>You don't have any archived project</div>
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { projectService } from '@/api/project.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { Project, ProjectTask } from '@/models/project.model'
import ProjectFormDialog from '@/views/project/components/ProjectFormDialog.vue'
import ProjectItemCard from '@/views/project/components/ProjectItemCard.vue'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({
    components: { ProjectItemCard, ProjectFormDialog, EmptyListDisplay, FilterChip },
})
export default class ProjectList extends Vue {
    @Prop() archived: boolean = false

    projectList: ProjectTask[] = []
    projectDialog = false

    created(): void {
        this.retrieveProjectList({ archived: this.archived })
    }

    @Watch('archived')
    private onArchivedProjectsChanges(value: boolean): void {
        this.retrieveProjectList({ archived: value })
    }

    retrieveProjectList(params = {}): void {
        projectService.getProjectList(params).then(
            (response: any) => {
                this.projectList = response.body.content
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    createProject(projectForm: Partial<Project>): void {
        this.projectDialog = false
        projectService.createProject(projectForm).then(
            (response: any) => {
                this.$router.push({ name: 'project-detail', params: { id: response.body.id } })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    toggleArchivedProject(): void {
        this.$router.replace({ query: { archived: (!this.archived).toString() } })
    }
}
</script>

<style scoped lang="scss"></style>
