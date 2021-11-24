<template>
    <div>
        <h2 class="mb-3 ml-2">Collections</h2>
        <div class="collection-wrapper">
            <template v-if="collectionList.length">
                <v-row align-content="start" class="position-relative">
                    <v-col
                        v-for="collection in collectionList"
                        :key="'collection-' + collection.id"
                        cols="3"
                        :class="{ selected: collection.selected }">
                        <v-card
                            v-on="
                                !collection.selected
                                    ? { click: () => selectCollection(collection) }
                                    : {}
                            "
                            :disabled="collection.tasks.length === 0"
                            :title="!collection.selected ? 'Open collection' : null">
                            <v-progress-linear
                                :value="percentageOfTaskCompleted(collection)"
                                color="green accent-2"
                                height="4">
                            </v-progress-linear>
                            <v-card-text>
                                <div
                                    class="
                                        d-flex
                                        justify-space-between
                                        align-center
                                        collection-card-header
                                    ">
                                    <h3 class="white--text">
                                        <span v-if="collection.selected" class="grey--text"
                                            >Select task of the collection :
                                        </span>
                                        {{ collection.name }}
                                    </h3>
                                    <div class="mx-3" v-if="!collection.selected">
                                        <span style="font-size: 1.8em" class="white--text">{{
                                            numberOfTasksCompleted(collection)
                                        }}</span>
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
                                    <v-btn
                                        v-if="collection.selected"
                                        @click.stop="collection.selected = false"
                                        color="red"
                                        icon>
                                        <v-icon>mdi-close</v-icon>
                                    </v-btn>
                                </div>
                                <template v-if="collection.selected">
                                    <v-divider class="my-3"></v-divider>
                                    <template v-if="taskUncompleted(collection).length">
                                        <v-row align-content="start" class="task-wrapper">
                                            <v-col
                                                v-for="task of taskUncompleted(collection)"
                                                :key="'collection-task-' + task.id"
                                                cols="6">
                                                <v-card
                                                    @click="selectTask(task)"
                                                    :disabled="isTaskSelected(task)"
                                                    :color="
                                                        isTaskSelected(task)
                                                            ? 'taskCompleted'
                                                            : '#212121'
                                                    "
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
                                    </template>
                                    <template v-else>
                                        <EmptyListDisplay
                                            message="No task are related to this collection">
                                            <template #img>
                                                <img
                                                    src="../../../../assets/no_tasks.svg"
                                                    alt="No tasks"
                                                    height="150" />
                                            </template>
                                        </EmptyListDisplay>
                                    </template>
                                </template>
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </template>
            <template v-else>
                <EmptyListDisplay message="No collections available">
                    <template #img>
                        <img src="../../../../assets/project.svg" alt="No tasks" height="250" />
                    </template>
                </EmptyListDisplay>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { DailyTaskDisplayModel } from '@/models/daily-task.model'
import { TaskModel } from '@/models/task.model'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { DailyTaskCollectionDisplayModel } from '@/models/collection.model'

@Component({
    components: {
        EmptyListDisplay,
    },
})
export default class DailyTaskUpdateCollectionList extends Vue {
    @Prop() collectionList!: DailyTaskCollectionDisplayModel[]
    @Prop() dailyTaskList!: DailyTaskDisplayModel[]

    get taskUncompleted(): (collection: DailyTaskCollectionDisplayModel) => TaskModel[] {
        return (collection: DailyTaskCollectionDisplayModel) =>
            collection.tasks.filter((task: TaskModel) => !task.completed)
    }

    // todo : change color of task selected
    get isTaskSelected(): (task: TaskModel) => boolean {
        return (task: TaskModel) =>
            this.dailyTaskList.some(
                (dailyTask: DailyTaskDisplayModel) => task.id === dailyTask.taskId
            )
    }

    get numberOfTasksCompleted(): (collection: DailyTaskCollectionDisplayModel) => number {
        return (collection: DailyTaskCollectionDisplayModel) =>
            collection.tasks.filter((task: TaskModel) => task.completed).length
    }

    get percentageOfTaskCompleted(): (collection: DailyTaskCollectionDisplayModel) => number {
        return (collection: DailyTaskCollectionDisplayModel) =>
            (this.numberOfTasksCompleted(collection) / collection.tasks.length) * 100
    }

    selectCollection(collection: DailyTaskCollectionDisplayModel): void {
        collection.selected = true
    }

    selectTask(task: TaskModel): void {
        this.$emit('selectTask', { taskId: task.id })
    }
}
</script>

<style scoped lang="scss">
.position-relative {
    position: relative;
    height: 100%;
}

.collection-wrapper {
    height: 20rem;

    .selected {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        max-width: 100%;
        z-index: 1;

        .v-card {
            height: 100%;

            .v-card__text {
                height: 100%;

                .collection-card-header {
                    height: 15%;
                }

                .task-wrapper {
                    height: 80%;
                    overflow-y: auto;
                }
            }
        }
    }
}
</style>
