<template>
    <div class="pa-2" :class="{ selected: selected }" @click="selectCollection">
        <v-card :disabled="tasksUncompleted.length === 0" :class="{ 'cursor-pointer': !selected }">
            <v-progress-linear :value="percentageOfTaskCompleted" color="green accent-2" height="4">
            </v-progress-linear>
            <v-card-text>
                <div class="d-flex justify-space-between align-center">
                    <h3 class="white--text text-ellipsis" :title="collection.name">
                        {{ collection.name }}
                    </h3>
                    <template v-if="!selected">
                        <div class="mx-2 mt-1 flex-shrink-0">
                            <span style="font-size: 1.8em" class="white--text">
                                {{ tasksCompleted.length }}
                            </span>
                            /
                            <span
                                style="
                                    font-size: 1.1em;
                                    transform: translateY(0.3em);
                                    display: inline-block;
                                ">
                                {{ collection.tasks.length }}
                            </span>
                        </div>
                    </template>
                    <template v-if="selected">
                        <v-hover v-slot="{ hover }">
                            <v-btn
                                :to="{ name: 'collection-detail', params: { id: collection.id } }"
                                icon
                                small
                                :color="hover ? 'grey' : 'grey darken-3'"
                                class="ml-1"
                                title="Go to collection">
                                <v-icon small>mdi-open-in-new</v-icon>
                            </v-btn>
                        </v-hover>
                        <span class="flex-grow-1"></span>
                        <v-btn @click.stop="unselectCollection" color="red" icon>
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </template>
                </div>
                <template v-if="selected">
                    <v-divider class="mt-3"></v-divider>
                    <div class="task-wrapper pt-3">
                        <v-row align-content="start" class="fill-width">
                            <v-col
                                v-for="task of tasksUncompleted"
                                :key="`task-${task.id}`"
                                cols="6">
                                <v-card
                                    @click="selectTask(task)"
                                    :disabled="isTaskSelected(task)"
                                    :color="isTaskSelected(task) ? 'taskCompleted' : '#212121'"
                                    elevation="5"
                                    title="Select task">
                                    <v-card-text class="p-1">
                                        <h5 class="white--text">
                                            {{ task.name }}
                                        </h5>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>
                </template>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts">
import { DailyTask } from '@/models/daily-task.model'
import { Task } from '@/models/task.model'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { CollectionTask } from '@/models/collection.model'

@Component
export default class DailyTaskUpdateCollectionListItem extends Vue {
    @Prop() collection!: CollectionTask
    @Prop() dailyTaskList!: DailyTask[]
    @Prop() selected!: boolean

    // todo : change color of task selected
    get isTaskSelected(): (task: Task) => boolean {
        return (task: Task) =>
            this.dailyTaskList.some((dailyTask: DailyTask) => task.id === dailyTask.taskId)
    }

    get tasks(): Task[] {
        return this.collection.tasks
    }

    get tasksCompleted(): Task[] {
        return this.collection.tasks.filter(task => task.completed)
    }

    get tasksUncompleted(): Task[] {
        return this.collection.tasks.filter(task => !task.completed)
    }

    get numberOfTasksCompleted(): number {
        return this.collection.tasks.filter((task: Task) => task.completed).length
    }

    get percentageOfTaskCompleted(): number {
        return (this.tasksCompleted.length / this.tasks.length) * 100
    }

    selectCollection(): void {
        if (this.tasksUncompleted.length !== 0 && !this.selected)
            this.$emit('update:selected', true)
    }

    unselectCollection(): void {
        this.$emit('update:selected', false)
    }

    selectTask(task: Task): void {
        this.$emit('select-task', { taskId: task.id })
    }
}
</script>

<style scoped lang="scss">
.selected {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    cursor: default;

    .v-card {
        height: 100%;

        .v-card__text {
            height: 100%;
            display: flex;
            flex-direction: column;

            .collection-title {
                max-width: unset;
            }

            .task-wrapper {
                flex-grow: 1;
                overflow-y: auto;
                width: 100%;
            }
        }
    }
}

// Todo : place in common css file
.fill-width {
    width: 100%;
}
</style>
