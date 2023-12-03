<template>
    <div>
        <v-card
            :disabled="disabled || selected"
            :color="cardColor"
            :ripple="false"
            :elevation="elevation"
            class="task-card rounded-lg"
            :class="{ 'pl-3 pt-3': !completable, 'cursor-pointer': !displayOptions, small }">
            <template v-if="displayOptions">
                <div class="task-card__actions">
                    <v-menu v-model="taskMenu" offset-y>
                        <template #activator="{ attrs, on }">
                            <v-btn
                                v-bind="attrs"
                                v-on="on"
                                x-small
                                plain
                                class="task-card__actions__btn">
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

            <div class="task-card__content" :class="{ 'mb-1': small }">
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
                    class="flex-grow-1 font-weight-medium white--text"
                    :class="{ 'text-body-2': small, 'text-body-1': !small }"
                    :title="task.name">
                    {{ task.name }}
                </div>
            </div>

            <template v-if="task.tags.length">
                <TagGroup
                    :tag-list="task.tags"
                    :small="small"
                    max-tag="3"
                    :class="{ 'pl-10': completable }">
                </TagGroup>
            </template>
        </v-card>

        <v-dialog v-model="taskDialog" width="60%">
            <TaskDialog
                :task="task"
                :is-dialog-open="taskDialog"
                :item-name="itemName"
                @update="emitUpdateEvent($event)"
                @close="taskDialog = false">
            </TaskDialog>
        </v-dialog>

        <ConfirmDialog v-model="uncompleteConfirmDialog" @confirm="emitToggleStateEvent()">
            <template #icon>
                <v-icon x-large>mdi-trophy</v-icon>
            </template>
            <p>Are you sure to uncomplete this task ?</p>
        </ConfirmDialog>

        <ConfirmDialog v-model="deleteConfirmDialog" @confirm="emitDeleteEvent()">
            <template #icon>
                <v-icon x-large>mdi-trash-can</v-icon>
            </template>
            <p>Are you sure to delete this task ?</p>
        </ConfirmDialog>
    </div>
</template>

<script lang="ts">
import { Task, TaskPatch } from '@/models/task.model'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

@Component({ components: { TaskDialog, ConfirmDialog, TagGroup } })
export default class TaskCard extends Vue {
    @Prop({ required: true }) task!: Task
    @Prop({ default: false }) disabled!: boolean
    @Prop({ default: true }) displayOptions!: boolean
    @Prop({ default: true }) completable!: boolean
    @Prop({ default: false }) small!: boolean
    @Prop({ default: false }) selected!: boolean
    @Prop({ default: 2 }) elevation!: number
    @Prop({ default: null }) color!: string | null
    @Prop({ default: 'task' }) itemName!: string

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
    min-height: 72px;
    height: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    &.small {
        min-height: 62px;
    }

    &__actions {
        position: absolute;
        top: 4px;
        right: 8px;

        &__btn {
            min-width: 0 !important;
            padding: 0 !important;
        }
    }

    &__content {
        display: flex;
        align-items: center;
        column-gap: 4px;
    }
}
</style>
