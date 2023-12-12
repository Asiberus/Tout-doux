<template>
    <div class="flex-grow-1 d-flex flex-column">
        <div class="project-description">
            <div class="project-description__description">
                <h3 class="text-h6 text-sm-h5 mb-1 mb-lg-2">Description</h3>
                <v-card class="rounded-lg mb-3">
                    <v-card-text>
                        <div
                            ref="description"
                            @click="displayDescription = !displayDescription"
                            class="project-description__description__content text-body-2"
                            :class="{
                                'display-description': displayDescription,
                                'cursor-pointer': isDescriptionOverflowing,
                            }">
                            {{ project.description }}
                        </div>
                        <div class="d-flex justify-end align-center mt-1" title="Created on">
                            <v-icon small>mdi-clock</v-icon>
                            <span class="font-italic ml-1">{{ createdDate }}</span>
                        </div>
                    </v-card-text>
                </v-card>
                <template v-if="project.tags.length > 0">
                    <TagGroup
                        :tag-list="project.tags"
                        :max-tag="10"
                        :large="true"
                        :icon-transparent="false"
                        :auto-shrink="false"
                        :multi-row="true">
                    </TagGroup>
                </template>
            </div>
            <div class="project-description__progress-wheel">
                <ProgressWheel
                    :size="progressWheelSize"
                    :mode="preferences.progressWheelMode"
                    :value="allCompletedTasks.length"
                    :max="allTasks.length"
                    color="green accent-2">
                </ProgressWheel>
            </div>
        </div>

        <div class="d-flex flex-column flex-sm-row column-gap-2 row-gap-1 mt-5 mt-md-10 mb-2">
            <h3 class="text-h6 text-sm-h5 flex-grow-1">General Tasks</h3>

            <div class="d-flex justify-space-between align-center gap-2">
                <FilterChip
                    v-if="project.tasks.length > 0"
                    v-model="displayCompletedTask"
                    color="green darken-2"
                    icon="mdi-trophy"
                    class="flex-shrink-0">
                    Completed
                </FilterChip>

                <v-dialog
                    v-model="taskDialog"
                    :width="getDialogWidth()"
                    :fullscreen="$vuetify.breakpoint.smAndDown">
                    <template #activator="{ on, attrs }">
                        <v-btn
                            v-bind="attrs"
                            v-on="on"
                            :disabled="project.archived"
                            :block="$vuetify.breakpoint.xsOnly && project.tasks.length === 0">
                            <v-icon left>mdi-plus</v-icon>
                            task
                        </v-btn>
                    </template>
                    <TaskDialog
                        :is-dialog-open="taskDialog"
                        @create="createTask"
                        @close="taskDialog = false">
                    </TaskDialog>
                </v-dialog>
            </div>
        </div>

        <template v-if="!displayCompletedTask">
            <template v-if="uncompletedTasks.length > 0">
                <div class="task-wrapper">
                    <TaskCard
                        v-for="task of uncompletedTasks"
                        :key="task.id"
                        :task="task"
                        :disabled="project.archived"
                        @toggle-state="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask">
                    </TaskCard>
                </div>
            </template>
            <template
                v-else-if="
                    project.tasks.length > 0 && project.tasks.length === completedTasks.length
                ">
                <EmptyListDisplay
                    message="You completed all the general tasks of this project!"
                    class="empty-list-display">
                    <template #img>
                        <img
                            src="../../../../assets/all_task_completed.svg"
                            alt="All tasks completed"
                            class="empty-list-display__img" />
                    </template>
                </EmptyListDisplay>
            </template>
            <template v-else>
                <EmptyListDisplay
                    message="This project has no general task."
                    class="empty-list-display">
                    <template #img>
                        <img
                            src="../../../../assets/project-no-tasks.svg"
                            alt="No tasks"
                            class="empty-list-display__img" />
                    </template>
                </EmptyListDisplay>
            </template>
        </template>
        <template v-else>
            <template v-if="completedTasks.length > 0">
                <div class="task-wrapper">
                    <TaskCard
                        v-for="task of completedTasks"
                        :key="task.id"
                        :task="task"
                        :disabled="project.archived"
                        @toggle-state="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask">
                    </TaskCard>
                </div>
            </template>
            <template v-else>
                <EmptyListDisplay
                    message="You didn't completed any general tasks yet!"
                    class="empty-list-display">
                    <template #img>
                        <img
                            src="../../../../assets/project-no-tasks.svg"
                            alt="No tasks completed"
                            class="empty-list-display__img" />
                    </template>
                </EmptyListDisplay>
            </template>
        </template>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import ProgressWheel from '@/components/ProgressWheel.vue'
import { ProjectDetail } from '@/models/project.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { projectActions } from '@/store/modules/project.store'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskCard from '@/views/components/task/TaskCard.vue'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import { Preferences } from '@/models/preferences.model'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: {
        TagGroup,
        TaskCard,
        TaskDialog,
        ProgressWheel,
        EmptyListDisplay,
        FilterChip,
    },
})
export default class ProjectDescription extends Vue {
    taskDialog = false
    displayCompletedTask = false

    displayDescription = false
    isDescriptionOverflowing = false
    descriptionElement?: HTMLElement

    get preferences(): Preferences {
        return this.$store.state.preferences.preferences
    }

    get project(): ProjectDetail {
        return this.$store.state.project.currentProject
    }

    get createdDate(): string {
        return moment(this.project.createdOn).format('D MMMM Y')
    }

    get uncompletedTasks(): Task[] {
        return this.project.tasks.filter(({ completed }) => !completed)
    }

    get completedTasks(): Task[] {
        return this.project.tasks.filter(({ completed }) => completed)
    }

    get allTasks(): Task[] {
        return this.project.tasks.concat(...this.project.sections.map(({ tasks }) => tasks))
    }

    get allCompletedTasks(): Task[] {
        return this.allTasks.filter(({ completed }) => completed)
    }

    get progressWheelSize(): 'x-small' | 'small' | 'medium' | 'large' | 'x-large' {
        if (this.$vuetify.breakpoint.xsOnly) return 'x-small'
        if (this.$vuetify.breakpoint.smAndDown) return 'small'
        else if (this.$vuetify.breakpoint.mdAndDown) return 'medium'
        else if (this.$vuetify.breakpoint.lgAndDown) return 'large'
        else return 'x-large'
    }

    mounted(): void {
        this.descriptionElement = this.$refs.description as HTMLElement
        if (this.$vuetify.breakpoint.xsOnly)
            this.isDescriptionOverflowing =
                this.descriptionElement.scrollHeight > this.descriptionElement.clientHeight
    }

    createTask(task: TaskPost): void {
        this.taskDialog = false
        task.projectId = this.project.id
        this.$store.dispatch(projectActions.task.addTask, task)
    }

    toggleTaskState(id: number, completed: boolean): void {
        this.$store.dispatch(projectActions.task.editTask, {
            id,
            data: { completed },
            projectId: this.project.id,
        })
    }

    updateTask(id: number, data: TaskPatch): void {
        this.$store.dispatch(projectActions.task.editTask, { id, data, projectId: this.project.id })
    }

    deleteTask(id: number): void {
        this.$store.dispatch(projectActions.task.deleteTask, { id })
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.project-description {
    display: flex;
    flex-wrap: wrap-reverse;
    column-gap: 20px;
    row-gap: 8px;

    &__description {
        flex: 1 1 calc(75% - 20px);
        max-width: 100%;

        @media #{map-get($display-breakpoints, 'xs-only')} {
            &__content {
                max-height: calc(4.6 * 1.25rem); // Equal to 4.6 row
                transition: all 0.3s ease-out;

                &.display-description {
                    height: fit-content;
                    max-height: 500px;
                }

                &:not(.display-description) {
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
            }
        }
    }

    &__progress-wheel {
        flex: 2 0 auto;
        display: flex;
        justify-content: center;
        align-items: center;
    }
}

.task-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(max(290px, calc((100% - 8px) / 2)), 1fr));
    gap: 8px;
}

.empty-list-display {
    flex-grow: 1;
    padding: 20px;

    &__img {
        width: clamp(200px, 50%, 300px);

        @media #{map-get($display-breakpoints, 'xl-only')} {
            width: clamp(200px, 50%, 450px);
        }
    }
}
</style>
