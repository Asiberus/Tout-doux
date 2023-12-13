<template>
    <div class="collection-general">
        <div class="collection-general__tasks">
            <div class="d-flex flex-column flex-sm-row flex-wrap column-gap-2 row-gap-1 mb-2">
                <h5 class="text-h6 text-sm-h5 flex-grow-1">List of {{ collection.itemName }}</h5>

                <div class="d-flex justify-space-between align-center gap-2">
                    <FilterChip
                        v-if="collection.tasks.length > 0"
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
                                :disabled="collection.archived"
                                :small="
                                    $vuetify.breakpoint.xsOnly && collection.itemName.length > 10
                                "
                                :block="
                                    $vuetify.breakpoint.xsOnly && collection.tasks.length === 0
                                ">
                                <v-icon left>mdi-plus</v-icon>
                                {{ collection.itemName }}
                            </v-btn>
                        </template>
                        <TaskDialog
                            :is-dialog-open="taskDialog"
                            :item-name="collection.itemName"
                            @create="createTask"
                            @close="taskDialog = false">
                        </TaskDialog>
                    </v-dialog>
                </div>
            </div>

            <template v-if="!displayCompletedTask">
                <template v-if="uncompletedTasks.length > 0">
                    <TaskCard
                        v-for="task in uncompletedTasks"
                        :key="task.id"
                        :task="task"
                        :disabled="collection.archived"
                        :item-name="collection.itemName"
                        @toggle-state="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask"
                        class="mb-2">
                    </TaskCard>
                </template>
                <template
                    v-else-if="
                        collection.tasks.length > 0 &&
                        collection.tasks.length === completedTasks.length
                    ">
                    <EmptyListDisplay
                        :message="`You completed all the ${collection.itemName} of this collection!`"
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
                        :message="`This collection has no ${collection.itemName}.`"
                        class="empty-list-display">
                        <template #img>
                            <img
                                src="../../../../assets/collection-no-tasks.svg"
                                alt="No tasks"
                                class="empty-list-display__img" />
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
                        :disabled="collection.archived"
                        :item-name="collection.itemName"
                        @toggle-state="toggleTaskState"
                        @update="updateTask"
                        @delete="deleteTask"
                        class="mb-2">
                    </TaskCard>
                </template>
                <template v-else>
                    <EmptyListDisplay
                        :message="`You didn't complete any ${collection.itemName} yet!`"
                        class="empty-list-display">
                        <template #img>
                            <img
                                src="../../../../assets/collection-no-tasks.svg"
                                alt="No tasks"
                                class="empty-list-display__img" />
                        </template>
                    </EmptyListDisplay>
                </template>
            </template>
        </div>

        <div class="collection-general__description">
            <div class="d-flex justify-center mb-2">
                <ProgressWheel
                    :size="progressWheelSize"
                    :mode="preferences.progressWheelMode"
                    :value="completedTasks.length"
                    :max="collection.tasks.length"
                    color="collection lighten-2">
                </ProgressWheel>
            </div>
            <h5 class="text-h6 text-sm-h5 mb-1 mb-lg-2">Description</h5>
            <v-card class="rounded-lg">
                <v-card-text>
                    <div
                        ref="description"
                        @click="displayDescription = !displayDescription"
                        class="collection-general__description__content text-body-2"
                        :class="{
                            'display-description': displayDescription,
                            'cursor-pointer': isDescriptionOverflowing,
                        }">
                        {{ collection.description }}
                    </div>

                    <div class="d-flex justify-end align-center mt-1" title="Created on">
                        <v-icon small>mdi-clock</v-icon>
                        <span class="font-italic ml-1">{{ createdDate }}</span>
                    </div>
                </v-card-text>
            </v-card>
        </div>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import ProgressWheel from '@/components/ProgressWheel.vue'
import { CollectionDetail } from '@/models/collection.model'
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { collectionActions } from '@/store/modules/collection.store'
import TaskDialog from '@/views/components/task/TaskDialog.vue'
import TaskCard from '@/views/components/task/TaskCard.vue'
import moment from 'moment'
import { Component, Vue } from 'vue-property-decorator'
import { Preferences } from '@/models/preferences.model'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: {
        TaskDialog,
        TaskCard,
        EmptyListDisplay,
        ProgressWheel,
        FilterChip,
    },
})
export default class CollectionGeneral extends Vue {
    taskDialog = false
    displayCompletedTask = false

    displayDescription = false
    isDescriptionOverflowing = false
    descriptionElement?: HTMLElement

    get preferences(): Preferences {
        return this.$store.state.preferences.preferences
    }

    get collection(): CollectionDetail {
        return this.$store.state.collection.currentCollection
    }

    get createdDate(): string {
        return moment(this.collection.createdOn).format('D MMMM Y')
    }

    get uncompletedTasks(): Task[] {
        return this.collection.tasks.filter(({ completed }) => !completed)
    }

    get completedTasks(): Task[] {
        return this.collection.tasks.filter(({ completed }) => completed)
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
        task.collectionId = this.collection.id
        this.$store.dispatch(collectionActions.task.addTask, task)
    }

    toggleTaskState(id: number, completed: boolean): void {
        this.$store.dispatch(collectionActions.task.editTask, { id, data: { completed } })
    }

    updateTask(id: number, data: TaskPatch): void {
        this.$store.dispatch(collectionActions.task.editTask, { id, data })
    }

    deleteTask(id: number): void {
        this.$store.dispatch(collectionActions.task.deleteTask, id)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.collection-general {
    flex-grow: 1;
    display: flex;
    gap: 20px;

    &__tasks {
        flex: 0 2 calc((100% / 3) * 2 - 20px);
        min-width: 0;
        display: flex;
        flex-direction: column;

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
    }

    &__description {
        flex: 1 1 0;
        min-width: 200px;

        @media #{map-get($display-breakpoints, 'sm-and-down')} {
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
}

@media #{map-get($display-breakpoints, 'xs-only')} {
    .collection-general {
        flex-direction: column-reverse;

        &__tasks {
            flex: 1 0 auto;
        }

        &__description {
            flex: 0 0 auto;
        }
    }
}
</style>
