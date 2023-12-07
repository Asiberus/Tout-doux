<template>
    <div class="d-flex flex-column h-100">
        <div class="d-flex flex-column flex-sm-row align-center gap-2 mb-3 mb-md-6">
            <MainTitle icon="mdi-briefcase-variant" class="flex-grow-1">Projects</MainTitle>

            <div class="d-flex align-center gap-2">
                <FilterChip
                    :value="archived"
                    @input="toggleArchivedProject()"
                    color="accent"
                    icon="mdi-archive">
                    Archived
                </FilterChip>

                <v-dialog
                    v-model="projectDialog"
                    :width="getDialogWidth()"
                    :fullscreen="$vuetify.breakpoint.smAndDown">
                    <template #activator="{ on, attrs }">
                        <v-btn v-bind="attrs" v-on="on">
                            <v-icon left>mdi-plus</v-icon>
                            project
                        </v-btn>
                    </template>
                    <ProjectFormDialog
                        :isDialogOpen="projectDialog"
                        @submit="createProject($event)"
                        @close="projectDialog = false">
                    </ProjectFormDialog>
                </v-dialog>
            </div>
        </div>

        <template v-if="projectList.length > 0">
            <div class="project-wrapper">
                <ProjectCard v-for="project in projectList" :key="project.id" :project="project" />
            </div>
        </template>
        <template v-else>
            <EmptyListDisplay class="empty-list-display">
                <template #img>
                    <img
                        v-if="!archived"
                        src="../../../assets/project.svg"
                        alt="No project"
                        class="empty-list-display__img" />
                    <img
                        v-else
                        src="../../../assets/project_archived.svg"
                        alt="No archived project"
                        class="empty-list-display__img" />
                </template>
                <template #message>
                    <div class="d-flex flex-column align-center gap-2" v-if="!archived">
                        <span>You don't have any project yet!</span>
                        <v-btn @click="projectDialog = true">
                            <v-icon left>mdi-plus</v-icon>
                            project
                        </v-btn>
                    </div>
                    <div v-else>You don't have any archived project.</div>
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { projectService } from '@/api/project.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { ProjectList, ProjectPostOrPatch } from '@/models/project.model'
import ProjectFormDialog from '@/views/project/components/ProjectFormDialog.vue'
import ProjectCard from '@/views/project/components/ProjectCard.vue'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import MainTitle from '@/components/MainTitle.vue'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: { MainTitle, ProjectCard, ProjectFormDialog, EmptyListDisplay, FilterChip },
})
export default class ProjectListComponent extends Vue {
    @Prop({ default: false }) archived!: boolean

    projectList: ProjectList[] = []
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

    createProject(projectForm: ProjectPostOrPatch): void {
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

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.project-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(max(288px, calc((100% - 2 * 12px) / 3)), 1fr));
    gap: 12px;

    @media #{map-get($display-breakpoints, 'md-and-up')} {
        grid-template-columns: repeat(
            auto-fill,
            minmax(max(420px, calc((100% - 2 * 12px) / 3)), 1fr)
        );
    }

    @media #{map-get($display-breakpoints, 'xl-only')} {
        grid-template-columns: repeat(
            auto-fill,
            minmax(max(500px, calc((100% - 2 * 12px) / 3)), 1fr)
        );
    }

    & > * {
        min-width: 0;
    }
}

.empty-list-display {
    flex-grow: 1;

    &__img {
        width: clamp(250px, 50%, 450px);
    }
}
</style>
