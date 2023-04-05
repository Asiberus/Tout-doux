<template>
    <div>
        <v-card
            :disabled="disabled"
            :color="task.completed ? 'green darken-2' : null"
            :ripple="false"
            class="task-card rounded-lg">
            <div class="task-card__header">
                <template v-if="task.completed">
                    <v-btn @click="openUncompleteDialog()" icon>
                        <v-icon>mdi-checkbox-marked-outline</v-icon>
                    </v-btn>
                </template>
                <template v-else>
                    <v-btn @click="emitToggleStateEvent()" icon>
                        <v-icon>mdi-checkbox-blank-outline</v-icon>
                    </v-btn>
                </template>

                <div
                    class="flex-grow-1 text-body-1 font-weight-medium white--text text-truncate"
                    :title="task.name">
                    {{ task.name }}
                </div>

                <div class="align-self-start d-flex">
                    <v-menu v-model="taskMenu" offset-y>
                        <template #activator="{ attrs, on }">
                            <v-btn
                                v-bind="attrs"
                                v-on="on"
                                x-small
                                plain
                                class="task-card__header__action">
                                <v-icon small>mdi-dots-vertical</v-icon>
                            </v-btn>
                        </template>
                        <v-list dense>
                            <v-list-item @click="openEditDialog()">
                                <v-icon small left>mdi-pencil</v-icon>
                                <v-list-item-title>Edit</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="openDeleteDialog()">
                                <v-icon small left>mdi-trash-can</v-icon>
                                <v-list-item-title>Delete</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>
            </div>

            <div class="task-card__footer">
                <template v-if="task.tags.length">
                    <v-icon small class="tag-icon mr-1">mdi-tag</v-icon>
                    <TagGroup2
                        :tag-list="task.tags"
                        :padding="false"
                        max-tag="3"
                        class="task-card__footer__tags">
                    </TagGroup2>
                </template>
            </div>
        </v-card>

        <v-dialog v-model="taskDialog" width="60%">
            <TaskDialog
                :task="task"
                :is-dialog-open="taskDialog"
                @update="emitUpdateEvent($event)"
                @close="taskDialog = false">
            </TaskDialog>
        </v-dialog>

        <v-dialog v-model="uncompleteConfirmDialog" width="50%">
            <ConfirmDialog
                @confirm="emitToggleStateEvent()"
                @cancel="uncompleteConfirmDialog = false">
                <template #icon>
                    <v-icon x-large>mdi-trophy</v-icon>
                </template>
                <p>Are you sure to uncomplete this task ?</p>
            </ConfirmDialog>
        </v-dialog>

        <v-dialog v-model="deleteConfirmDialog" width="50%">
            <ConfirmDialog @confirm="emitDeleteEvent()" @cancel="deleteConfirmDialog = false">
                <template #icon>
                    <v-icon x-large>mdi-trash-can</v-icon>
                </template>
                <p>Are you sure to delete this task ?</p>
            </ConfirmDialog>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { Task, TaskPatch } from '@/models/task.model'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import TagGroup2 from '@/views/components/tag/TagGroup2.vue'

@Component({ components: { TaskDialog, ConfirmDialog, TagGroup2 } })
export default class TaskCard extends Vue {
    @Prop() private task!: Task
    @Prop({ default: false }) private disabled!: boolean

    taskMenu = false
    taskDialog = false
    uncompleteConfirmDialog = false
    deleteConfirmDialog = false

    openEditDialog(): void {
        this.taskDialog = true
    }

    openDeleteDialog(): void {
        this.deleteConfirmDialog = true
    }

    openUncompleteDialog(): void {
        this.uncompleteConfirmDialog = true
    }

    emitToggleStateEvent(): void {
        this.$emit('toggle-state', this.task.id, !this.task.completed)
    }

    emitUpdateEvent(data: TaskPatch): void {
        this.taskDialog = false
        this.$emit('update', this.task.id, data)
    }

    emitDeleteEvent(): void {
        this.$emit('delete', this.task.id)
    }
}
</script>

<style scoped lang="scss">
.task-card {
    padding: 8px;

    &__header {
        display: flex;
        align-items: center;
        column-gap: 4px;

        &__action {
            min-width: 0 !important;
            padding: 0 !important;
        }
    }

    &__footer {
        min-height: 20px;
        padding-left: 40px;
        display: flex;
        align-items: center;

        .tag-icon {
            opacity: 0.62;
        }

        &__tags {
            min-width: 0;
        }
    }
}
</style>
