<template>
    <v-container>
        <div class="d-flex align-center" :class="{ 'mb-8': !editMode, 'mb-3': editMode }">
            <div class="flex-grow-1">
                <v-hover v-slot="{ hover }" class="mb-3" v-if="!editMode">
                    <h3 class="d-flex align-center">
                        {{ section.name }}
                        <v-btn
                            @click="editMode = true"
                            icon
                            class="ml-2"
                            :style="{ opacity: hover ? 1 : 0 }">
                            <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                    </h3>
                </v-hover>
                <v-form
                    v-else
                    ref="form"
                    v-model="sectionForm.valid"
                    @submit.prevent="emitUpdateEvent">
                    <div class="d-flex align-center">
                        <v-text-field
                            v-model="sectionForm.data.name"
                            label="Name"
                            :rules="sectionForm.rules.name"
                            counter="50"
                            maxlength="50"
                            required
                            autofocus>
                        </v-text-field>
                        <v-btn
                            text
                            :disabled="!sectionForm.valid"
                            @click="emitUpdateEvent"
                            class="ml-3">
                            Save
                        </v-btn>
                        <v-btn plain @click="closeEditMode"> cancel </v-btn>
                        <v-dialog v-model="deleteSectionDialog" width="50%">
                            <template #activator="{ attrs, on }">
                                <v-btn v-bind="attrs" v-on="on" color="error"> delete </v-btn>
                            </template>
                            <ConfirmDialog
                                color="accent"
                                @confirm="emitDeleteEvent"
                                @cancel="deleteSectionDialog = false">
                                <template #icon>
                                    <v-icon x-large>mdi-trash-can</v-icon>
                                </template>
                                <p>Are you sure to delete this section ?</p>
                                <p class="mb-0 font-italic" style="font-size: 1.1rem">
                                    All related tasks will be deleted
                                </p>
                            </ConfirmDialog>
                        </v-dialog>
                    </div>
                </v-form>
            </div>
            <div v-if="!editMode">
                <v-dialog v-model="taskDialog" width="60%">
                    <template #activator="{ attrs, on }">
                        <v-btn v-bind="attrs" v-on="on" :disabled="disabled">
                            <v-icon>mdi-plus</v-icon>
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
        </div>

        <v-row class="mb-3">
            <v-col cols="9">
                <template v-if="taskUncompleted.length > 0">
                    <TaskItemCard
                        v-for="task in taskUncompleted"
                        :key="task.id"
                        :task="task"
                        :disabled="disabled"
                        @toggleState="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask">
                    </TaskItemCard>
                </template>
                <template
                    v-else-if="
                        section.tasks.length > 0 && section.tasks.length === taskCompletedLength
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
                            <img src="../../../../assets/no_tasks.svg" width="200" alt="No tasks" />
                        </template>
                    </EmptyListDisplay>
                </template>
            </v-col>
            <v-col cols="3">
                <v-scale-transition origin="center">
                    <div class="d-flex align-center justify-center" v-if="section.tasks.length > 0">
                        <ProgressCircular
                            :value="taskCompletedLength"
                            :max="section.tasks.length"
                            :size="180"
                            :width="15">
                        </ProgressCircular>
                    </div>
                </v-scale-transition>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import ProgressCircular from '@/components/ProgressCircular.vue'
import { SectionModel } from '@/models/section.model'
import { TaskModel } from '@/models/task.model'
import { projectActions } from '@/store/modules/project.store'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskItemCard from '@/views/components/task/TaskItemCard.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
    components: {
        TaskItemCard,
        TaskDialog,
        ProgressCircular,
        EmptyListDisplay,
        ConfirmDialog,
    },
})
export default class ProjectSectionItem extends Vue {
    @Prop() section!: SectionModel
    @Prop() disabled!: boolean

    private editMode = false
    private deleteSectionDialog = false
    private taskDialog = false

    private sectionForm = {
        valid: false,
        data: {
            name: this.section.name,
        },
        rules: {
            name: [
                (value: string) => !!value || 'Section name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
        },
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get taskCompletedLength(): number {
        return this.section.tasks.filter((task: TaskModel) => task.completed).length
    }

    get taskUncompleted(): TaskModel[] {
        return this.section.tasks.filter((task: TaskModel) => !task.completed)
    }

    closeEditMode(): void {
        this.sectionForm.data.name = this.section.name
        this.form.resetValidation()
        this.editMode = false
    }

    emitUpdateEvent(): void {
        if (!this.sectionForm.valid) return

        this.editMode = false
        this.$emit('update', this.section.id, this.sectionForm.data.name)
    }

    emitDeleteEvent(): void {
        this.deleteSectionDialog = false
        this.$emit('delete', this.section.id)
    }

    createTask(task: Partial<TaskModel>): void {
        this.taskDialog = false
        task.sectionId = this.section.id
        this.$store.dispatch(projectActions.task.addTask, task)
    }

    toggleTaskState(id: number, completed: boolean): void {
        this.$store.dispatch(projectActions.task.editTask, { id, taskForm: { completed } })
    }

    updateTask(id: number, taskForm: Partial<TaskModel>): void {
        this.$store.dispatch(projectActions.task.editTask, { id, taskForm })
    }

    deleteTask(id: number): void {
        this.$store.dispatch(projectActions.task.deleteTask, { id, sectionId: this.section.id })
    }
}
</script>

<style scoped lang="scss"></style>
