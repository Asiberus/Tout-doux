<template>
    <div>
        <v-card
            :disabled="disabled"
            :color="cardColor"
            :ripple="false"
            :elevation="elevation"
            class="task-card rounded-lg"
            :class="{ 'pl-3 pt-3': !completable, 'cursor-pointer': true }">
            <div class="task-card__header" :class="{ 'mb-1': small }">
                <template v-if="completable">
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
                </template>

                <div
                    class="flex-grow-1 font-weight-medium white--text text-truncate"
                    :class="{ 'text-body-2': small, 'text-body-1': !small }"
                    :title="task.name">
                    {{ task.name }}
                </div>

                <template v-if="displayOptions">
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
                </template>
            </div>

            <div class="task-card__footer" :class="{ 'pl-10': completable, small }">
                <template v-if="task.tags.length">
                    <v-icon :small="!small" :x-small="small" class="tag-icon">mdi-tag</v-icon>
                    <TagGroup2
                        :tag-list="task.tags"
                        max-tag="3"
                        :small="small"
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
    @Prop({ required: true }) task!: Task
    @Prop({ default: false }) disabled!: boolean
    @Prop({ default: true }) displayOptions!: boolean
    @Prop({ default: true }) completable!: boolean
    @Prop({ default: false }) small!: boolean
    @Prop({ default: false }) selected!: boolean
    @Prop({ default: 2 }) elevation!: number
    @Prop({ default: null }) color!: string | null

    taskMenu = false
    taskDialog = false
    uncompleteConfirmDialog = false
    deleteConfirmDialog = false

    get cardColor(): string | null {
        return this.task.completed || this.selected ? 'green darken-2' : this.color
    }

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
        display: flex;
        align-items: center;

        &.small {
            min-height: 18px;
        }

        .tag-icon {
            opacity: 0.62;
            margin-right: 4px;
        }

        &__tags {
            min-width: 0;
        }
    }
}
</style>
