<template>
    <div class="collection-card-wrapper" :class="{ selected: selected }" @click="selectCollection">
        <v-card
            :disabled="tasksUncompleted.length === 0"
            :class="{ 'cursor-pointer': !selected }"
            class="rounded-lg">
            <v-progress-linear
                :value="percentageOfTaskCompleted"
                color="collection lighten-2"
                height="4"
                class="flex-shrink-0">
            </v-progress-linear>
            <v-card-text class="">
                <div class="d-flex align-center">
                    <h3
                        class="text-body-h1 text-sm-h6 white--text"
                        :class="{ 'text-truncate': !selected }"
                        :title="collection.name">
                        {{ collection.name }}
                    </h3>
                    <template v-if="!selected">
                        <v-spacer></v-spacer>
                        <TaskCounter
                            :value="tasksCompleted.length"
                            :max="collection.tasks.length"
                            :show-icon="false"
                            class="ml-2">
                        </TaskCounter>
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
                        <v-spacer></v-spacer>
                        <v-btn @click.stop="unselectCollection" color="red" icon>
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </template>
                </div>
                <template v-if="selected">
                    <v-divider class="mt-2"></v-divider>
                    <div class="task-wrapper">
                        <TaskCard
                            v-for="task of tasksUncompleted"
                            :key="`task-${task.id}`"
                            :task="task"
                            @click.native="selectTask(task)"
                            :selected="isTaskSelected(task)"
                            :class="{ 'cursor-pointer': !isTaskSelected(task) }"
                            :small="true"
                            :completable="false"
                            :display-options="false"
                            elevation="3"
                            color="grey darken-4">
                        </TaskCard>
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
import { CollectionDetail } from '@/models/collection.model'
import TaskCard from '@/views/components/task/TaskCard.vue'
import TaskCounter from '@/components/TaskCounter.vue'

@Component({ components: { TaskCounter, TaskCard } })
export default class DailyUpdateCollectionListItem extends Vue {
    @Prop() collection!: CollectionDetail
    @Prop() dailyTaskList!: DailyTask[]
    @Prop() selected!: boolean

    get tasks(): Task[] {
        return this.collection.tasks
    }

    get tasksCompleted(): Task[] {
        return this.tasks.filter(task => task.completed)
    }

    get tasksUncompleted(): Task[] {
        return this.tasks.filter(task => !task.completed)
    }

    get percentageOfTaskCompleted(): number {
        return (this.tasksCompleted.length / this.tasks.length) * 100
    }

    isTaskSelected(task: Task): boolean {
        return this.dailyTaskList.some((dailyTask: DailyTask) => task.id === dailyTask.task?.id)
    }

    selectCollection(): void {
        if (this.tasksUncompleted.length !== 0 && !this.selected)
            this.$emit('update:selected', true)
    }

    unselectCollection(): void {
        this.$emit('update:selected', false)
    }

    selectTask(task: Task): void {
        if (this.isTaskSelected(task)) return

        this.$emit('select-task', { taskId: task.id })
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.selected {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    cursor: default;

    & > .v-card {
        height: 100%;

        @media #{map-get($display-breakpoints, 'xs-only')} {
            .v-card__text {
                padding: 12px;
            }
        }

        .task-wrapper {
            overflow-y: auto;
            padding: 12px 0;
            display: grid;
            // auto fit with 260px min size but max 2 column
            grid-template-columns: repeat(
                auto-fill,
                minmax(max(260px, calc((100% - 8px) / 2)), 1fr)
            );
            gap: 8px;
        }
    }
}

.collection-card-wrapper:not(.selected) .v-card__text {
    padding: 16px;
}
</style>
