<template>
    <div>
        <v-btn
            v-if="$vuetify.breakpoint.xsOnly"
            @click="$emit('new-section')"
            :disabled="disabled"
            small
            class="mb-1">
            <v-icon left>mdi-plus</v-icon>
            section
        </v-btn>
        <div class="d-flex align-center justify-ends gap-2 mb-2">
            <h3 class="section-title text-h6">
                {{ section.name }}

                <v-dialog
                    v-model="sectionDialog"
                    :width="getDialogWidth()"
                    :fullscreen="$vuetify.breakpoint.smAndDown">
                    <template #activator="{ attrs, on }">
                        <v-btn
                            v-bind="attrs"
                            v-on="on"
                            :disabled="disabled"
                            :small="$vuetify.breakpoint.mdAndDown"
                            icon>
                            <v-icon small>mdi-pencil</v-icon>
                        </v-btn>
                    </template>
                    <SectionDialog
                        :section="section"
                        :is-dialog-open="sectionDialog"
                        @submit="updateSection"
                        @delete="deleteSection"
                        @close="sectionDialog = false">
                    </SectionDialog>
                </v-dialog>
            </h3>

            <v-btn
                v-if="$vuetify.breakpoint.smAndUp"
                @click="$emit('new-section')"
                :disabled="disabled"
                :small="$vuetify.breakpoint.mdAndDown || true"
                class="">
                <v-icon left>mdi-plus</v-icon>
                section
            </v-btn>
        </div>

        <v-row class="flex-wrap-reverse flex-sm-nowrap" :no-gutters="$vuetify.breakpoint.xsOnly">
            <v-col :cols="$vuetify.breakpoint.smAndUp ? 9 : 12">
                <div class="d-flex align-center mb-2">
                    <FilterChip
                        v-if="section.tasks.length > 0"
                        v-model="displayCompletedTask"
                        color="green darken-2"
                        icon="mdi-trophy">
                        Completed
                    </FilterChip>

                    <v-spacer></v-spacer>

                    <v-dialog
                        v-model="taskDialog"
                        :width="getDialogWidth()"
                        :fullscreen="$vuetify.breakpoint.smAndDown">
                        <template #activator="{ attrs, on }">
                            <v-btn
                                v-bind="attrs"
                                v-on="on"
                                :disabled="disabled"
                                :small="$vuetify.breakpoint.smAndDown">
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

                <template v-if="!displayCompletedTask">
                    <template v-if="uncompletedTasks.length > 0">
                        <TaskCard
                            v-for="task of uncompletedTasks"
                            :key="task.id"
                            :task="task"
                            :disabled="disabled"
                            @toggle-state="toggleTaskState"
                            @update="updateTask"
                            @delete="deleteTask"
                            class="mb-2">
                        </TaskCard>
                    </template>
                    <template
                        v-else-if="
                            section.tasks.length > 0 &&
                            section.tasks.length === completedTasks.length
                        ">
                        <EmptyListDisplay
                            message="You completed all the tasks of this section!"
                            class="my-3">
                            <template #img>
                                <img
                                    src="../../../../assets/all_task_completed.svg"
                                    alt="All tasks completed!"
                                    class="empty-img" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                    <template v-else>
                        <EmptyListDisplay message="This section has no task yet." class="my-3">
                            <template #img>
                                <img
                                    src="../../../../assets/project-no-tasks.svg"
                                    alt="No tasks"
                                    class="empty-img" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                </template>
                <template v-else>
                    <template v-if="completedTasks.length > 0">
                        <TaskCard
                            v-for="task of completedTasks"
                            :key="task.id"
                            :task="task"
                            :disabled="disabled"
                            @toggle-state="toggleTaskState"
                            @update="updateTask"
                            @delete="deleteTask"
                            class="mb-2">
                        </TaskCard>
                    </template>
                    <template v-else>
                        <EmptyListDisplay
                            message="You didn't completed any tasks yet!"
                            class="my-3">
                            <template #img>
                                <img
                                    src="../../../../assets/project-no-tasks.svg"
                                    alt="No tasks completed"
                                    class="empty-img" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                </template>
            </v-col>
            <v-col :cols="$vuetify.breakpoint.smAndUp ? 3 : 12">
                <v-scale-transition origin="center">
                    <div
                        v-if="section.tasks.length > 0"
                        class="d-flex flex-column align-center justify-center">
                        <template v-if="$vuetify.breakpoint.smAndUp">
                            <ProgressWheel
                                :mode="preferences.progressWheelMode"
                                :value="completedTasks.length"
                                :max="section.tasks.length"
                                :size="progressWheelSize"
                                color="green accent-2">
                            </ProgressWheel>
                        </template>
                        <template v-else>
                            <v-progress-linear
                                color="green accent-2"
                                :value="completedTasksPercentage"
                                rounded>
                            </v-progress-linear>
                            <div>{{ completedTasks.length }} / {{ section.tasks.length }}</div>
                        </template>
                    </div>
                </v-scale-transition>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import ProgressWheel from '@/components/ProgressWheel.vue'
import { SectionPatch, SectionTask } from '@/models/section.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { projectActions } from '@/store/modules/project.store'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskCard from '@/views/components/task/TaskCard.vue'
import SectionDialog from '@/views/project/project-detail/components/SectionDialog.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Preferences } from '@/models/preferences.model'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: {
        SectionDialog,
        TaskCard,
        TaskDialog,
        ProgressWheel,
        EmptyListDisplay,
        FilterChip,
    },
})
export default class ProjectSectionItem extends Vue {
    @Prop() section!: SectionTask
    @Prop() disabled!: boolean

    taskDialog = false
    sectionDialog = false
    displayCompletedTask = false

    get preferences(): Preferences {
        return this.$store.state.preferences.preferences
    }

    get completedTasks(): Task[] {
        return this.section.tasks.filter(({ completed }) => completed)
    }

    get uncompletedTasks(): Task[] {
        return this.section.tasks.filter(({ completed }) => !completed)
    }

    get completedTasksPercentage(): number {
        if (this.section.tasks.length === 0) return 0
        return Math.round((this.completedTasks.length / this.section.tasks.length) * 100)
    }

    get progressWheelSize(): 'x-small' | 'small' | 'medium' | 'large' {
        if (this.$vuetify.breakpoint.smAndDown) return 'x-small'
        else if (this.$vuetify.breakpoint.mdAndDown) return 'small'
        else if (this.$vuetify.breakpoint.lgAndDown) return 'medium'
        else return 'large'
    }

    updateSection({ name }: SectionPatch): void {
        this.sectionDialog = false
        this.$store.dispatch(projectActions.section.editSection, { id: this.section.id, name })
    }

    deleteSection(): void {
        this.sectionDialog = false
        this.$store.dispatch(projectActions.section.deleteSection, this.section.id)
    }

    createTask(task: TaskPost): void {
        this.taskDialog = false
        task.sectionId = this.section.id
        this.$store.dispatch(projectActions.task.addTask, task)
    }

    toggleTaskState(id: number, completed: boolean): void {
        this.$store.dispatch(projectActions.task.editTask, {
            id,
            data: { completed },
            sectionId: this.section.id,
        })
    }

    updateTask(id: number, data: TaskPatch): void {
        this.$store.dispatch(projectActions.task.editTask, { id, data, sectionId: this.section.id })
    }

    deleteTask(id: number): void {
        this.$store.dispatch(projectActions.task.deleteTask, { id, sectionId: this.section.id })
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.section-title {
    line-height: 1.5rem;
}

.empty-img {
    width: clamp(200px, 50%, 300px);

    @media #{map-get($display-breakpoints, 'xl-only')} {
        width: clamp(200px, 50%, 400px);
    }
}
</style>
