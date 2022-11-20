<template>
    <div>
        <v-row>
            <v-col cols="9">
                <div class="d-flex align-center mb-2">
                    <v-dialog v-model="sectionDialog" width="60%">
                        <template #activator="{ attrs, on }">
                            <v-btn v-bind="attrs" v-on="on" :disabled="disabled" class="mr-1">
                                <v-icon left>mdi-pencil</v-icon>
                                edit section
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

                    <v-spacer></v-spacer>

                    <v-chip
                        v-if="section.tasks.length > 0"
                        @click="displayCompletedTask = !displayCompletedTask"
                        :color="displayCompletedTask ? 'green' : 'grey darken-4'"
                        class="mr-3">
                        <v-icon v-if="displayCompletedTask" small class="mr-1">mdi-trophy</v-icon>
                        <v-icon v-else small class="mr-1">mdi-checkbox-blank-outline</v-icon>
                        Completed
                    </v-chip>

                    <v-dialog v-model="taskDialog" width="60%">
                        <template #activator="{ attrs, on }">
                            <v-btn v-bind="attrs" v-on="on" :disabled="disabled">
                                <v-icon left>mdi-plus</v-icon>
                                task
                            </v-btn>
                        </template>
                        <TaskDialog
                            :is-dialog-open="taskDialog"
                            @submit="createTask"
                            @close="taskDialog = false">
                        </TaskDialog>
                    </v-dialog>
                </div>

                <template v-if="!displayCompletedTask">
                    <template v-if="uncompletedTasks.length > 0">
                        <TaskItemCard
                            v-for="task of uncompletedTasks"
                            :key="task.id"
                            :task="task"
                            :disabled="disabled"
                            @toggle-state="toggleTaskState"
                            @update="updateTask"
                            @delete="deleteTask">
                        </TaskItemCard>
                    </template>
                    <template
                        v-else-if="
                            section.tasks.length > 0 &&
                            section.tasks.length === completedTasks.length
                        ">
                        <EmptyListDisplay message="You completed all tasks of this section !">
                            <template #img>
                                <img
                                    src="../../../../assets/all_task_completed.svg"
                                    width="200"
                                    alt="All tasks completed" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                    <template v-else>
                        <EmptyListDisplay message="This section has no task yet">
                            <template #img>
                                <img
                                    src="../../../../assets/no_tasks.svg"
                                    width="200"
                                    alt="No tasks" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                </template>
                <template v-else>
                    <template v-if="completedTasks.length > 0">
                        <TaskItemCard
                            v-for="task of completedTasks"
                            :key="task.id"
                            :task="task"
                            :disabled="disabled"
                            @toggle-state="toggleTaskState">
                        </TaskItemCard>
                    </template>
                    <template v-else>
                        <EmptyListDisplay message="You didn't completed any tasks yet !">
                            <template #img>
                                <img
                                    src="../../../../assets/no_tasks.svg"
                                    width="200"
                                    alt="No tasks completed" />
                            </template>
                        </EmptyListDisplay>
                    </template>
                </template>
            </v-col>
            <v-col cols="3">
                <v-scale-transition origin="center">
                    <div class="d-flex align-center justify-center" v-if="section.tasks.length > 0">
                        <ProgressCircular
                            :value="completedTasks.length"
                            :max="section.tasks.length"
                            :size="180"
                            :width="15">
                        </ProgressCircular>
                    </div>
                </v-scale-transition>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import ProgressCircular from '@/components/ProgressCircular.vue'
import { SectionTask } from '@/models/section.model'
import { Task } from '@/models/task.model'
import { projectActions } from '@/store/modules/project.store'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskItemCard from '@/views/components/task/TaskItemCard.vue'
import SectionDialog from '@/views/project/project-detail/components/SectionDialog.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
    components: {
        SectionDialog,
        TaskItemCard,
        TaskDialog,
        ProgressCircular,
        EmptyListDisplay,
    },
})
export default class ProjectSectionItem extends Vue {
    @Prop() section!: SectionTask
    @Prop() disabled!: boolean

    taskDialog = false
    sectionDialog = false
    displayCompletedTask = false

    get completedTasks(): Task[] {
        return this.section.tasks.filter(({ completed }) => completed)
    }

    get uncompletedTasks(): Task[] {
        return this.section.tasks.filter(({ completed }) => !completed)
    }

    updateSection({ name }: { name: string }): void {
        this.sectionDialog = false
        this.$store.dispatch(projectActions.section.editSection, { id: this.section.id, name })
    }

    deleteSection(): void {
        this.sectionDialog = false
        this.$store.dispatch(projectActions.section.deleteSection, this.section.id)
    }

    createTask(task: Partial<Task>): void {
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

    updateTask(id: number, data: Partial<Task>): void {
        this.$store.dispatch(projectActions.task.editTask, { id, data, sectionId: this.section.id })
    }

    deleteTask(id: number): void {
        this.$store.dispatch(projectActions.task.deleteTask, { id, sectionId: this.section.id })
    }
}
</script>

<style scoped lang="scss"></style>
