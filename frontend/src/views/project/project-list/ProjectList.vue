<template>
    <v-container>
        <h1 class="mb-6">Projects</h1>
        <div class="d-flex justify-end align-center mb-3">
            <v-chip class="mr-3" :color="archived ? 'accent' : null" @click="toggleArchivedProject">
                <v-icon v-if="archived" small class="mr-1"> mdi-archive </v-icon>
                <v-icon v-else small class="mr-1"> mdi-checkbox-blank-outline </v-icon>
                Archived
            </v-chip>
            <v-dialog v-model="projectDialog" width="60%">
                <template #activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on">
                        <v-icon left>mdi-plus</v-icon>
                        Add a project
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
            <EmptyListDisplay class="mt-10">
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
                            add a project
                        </v-btn>
                    </div>
                    <div v-else>You don't have any archived project</div>
                </template>
            </EmptyListDisplay>
        </template>
    </v-container>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { projectService } from '@/api/project.api'
import ProjectFormDialog from '@/views/project/components/ProjectFormDialog.vue'
import ProjectItemCard from '@/views/project/components/ProjectItemCard.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { Project, ProjectTask } from '@/models/project.model'

@Component({
    components: {
        ProjectItemCard,
        ProjectFormDialog,
        EmptyListDisplay,
    },
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
