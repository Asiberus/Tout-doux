<template>
    <div class="mb-2">
        <v-card
            @click.stop="onCardClick"
            :disabled="disabled"
            :color="task.completed ? 'green' : null"
            :title="task.completed ? 'Uncomplete task' : null">
            <v-card-text>
                <v-row align-content="center">
                    <v-col cols="11" class="d-flex align-center">
                        <h3 class="ml-2 white--text font-weight-regular">
                            {{ task.name }}
                        </h3>
                    </v-col>

                    <v-col cols="1">
                        <template v-if="!task.completed">
                            <v-checkbox
                                v-if="!disabled"
                                color="success"
                                hide-details
                                :input-value="task.completed"
                                @click.native.prevent.stop.capture="emitToggleStateEvent"
                                class="mt-0">
                            </v-checkbox>
                        </template>
                        <template v-else>
                            <v-icon>mdi-check-circle</v-icon>
                        </template>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <v-dialog v-model="taskDialog" width="60%">
            <TaskDialog
                :task="task"
                :is-dialog-open="taskDialog"
                @update="emitUpdateEvent"
                @delete="emitDeleteEvent"
                @close="taskDialog = false">
            </TaskDialog>
        </v-dialog>

        <v-dialog v-model="confirmDialog" width="50%">
            <ConfirmDialog @confirm="emitToggleStateEvent()" @cancel="confirmDialog = false">
                <template #icon>
                    <v-icon x-large>mdi-trophy</v-icon>
                </template>
                <p>Are you sure to uncomplete this task ?</p>
            </ConfirmDialog>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { Task, TaskPatch } from '@/models/task.model'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({ components: { TaskDialog, ConfirmDialog } })
export default class TaskCard extends Vue {
    @Prop() private task!: Task
    @Prop({ default: false }) private disabled!: boolean

    private taskDialog = false
    private confirmDialog = false

    get backgroundColor(): string | null {
        if (this.task.completed) {
            return 'success'
        }
        return null
    }

    onCardClick(): void {
        if (this.disabled) return

        if (!this.task.completed) this.taskDialog = true
        else this.confirmDialog = true
    }

    emitToggleStateEvent(): void {
        this.$emit('toggle-state', this.task.id, !this.task.completed)
    }

    emitUpdateEvent(data: TaskPatch): void {
        this.taskDialog = false
        this.$emit('update', this.task.id, data)
    }

    emitDeleteEvent(): void {
        this.taskDialog = false
        this.$emit('delete', this.task.id)
    }
}
</script>

<style scoped></style>
