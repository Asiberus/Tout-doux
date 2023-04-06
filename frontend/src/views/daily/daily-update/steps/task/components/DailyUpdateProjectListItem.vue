<template>
    <div :class="{ selected }" @click="selectProject">
        <v-card
            :disabled="allTasksUncompleted.length === 0"
            :class="{ 'cursor-pointer': !selected }">
            <v-progress-linear :value="percentageOfTaskCompleted" color="green accent-2" height="4">
            </v-progress-linear>
            <v-card-text>
                <div class="d-flex justify-space-between align-center">
                    <h3 class="white--text text-ellipsis" :title="project.name">
                        {{ project.name }}
                    </h3>
                    <template v-if="!selected">
                        <div class="mx-2 mt-1 flex-shrink-0">
                            <span style="font-size: 1.8em" class="white--text">
                                {{ allTasksCompleted.length }}
                            </span>
                            /
                            <span
                                style="
                                    font-size: 1.1em;
                                    transform: translateY(0.3em);
                                    display: inline-block;
                                ">
                                {{ allTasks.length }}
                            </span>
                        </div>
                    </template>
                    <template v-if="selected">
                        <v-hover v-slot="{ hover }">
                            <v-btn
                                :to="{ name: 'project-detail', params: { id: project.id } }"
                                icon
                                small
                                :color="hover ? 'grey' : 'grey darken-3'"
                                class="ml-1"
                                title="Go to project">
                                <v-icon small>mdi-open-in-new</v-icon>
                            </v-btn>
                        </v-hover>
                        <v-tabs
                            v-model="sectionTab"
                            color="accent"
                            class="section-wrapper"
                            hide-slider
                            show-arrows>
                            <v-tab v-for="section of taskBySection" :key="`tab-${section.id}`">
                                <span class="text-ellipsis" :title="section.name">
                                    {{ section.name }}
                                </span>
                                <ProgressCircular
                                    v-if="section.tasks.length > 0"
                                    :value="section.tasks.filter(t => t.completed).length"
                                    :max="section.tasks.length"
                                    :size="16"
                                    :width="8"
                                    :display-text="false"
                                    class="ml-1 flex-shrink-0"
                                    :title="`${section.tasks.filter(t => t.completed).length} of ${
                                        section.tasks.length
                                    } tasks completed`">
                                </ProgressCircular>
                            </v-tab>
                        </v-tabs>
                        <v-btn @click.stop="unselectProject" color="red" icon>
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </template>
                </div>
                <template v-if="selected">
                    <v-divider class="mt-3"></v-divider>

                    <v-tabs-items v-model="sectionTab" class="tab-item-wrapper">
                        <v-tab-item
                            v-for="section of taskBySection"
                            :key="`tab-item-${section.id}`">
                            <div class="task-wrapper">
                                <TaskCard
                                    v-for="task of taskUncompleted(section.tasks)"
                                    :key="`${section.name}-task-${task.id}`"
                                    :task="task"
                                    @click.native="selectTask(task)"
                                    :selected="isTaskSelected(task)"
                                    :disabled="isTaskSelected(task)"
                                    :class="{ 'cursor-pointer': !isTaskSelected(task) }"
                                    :small="true"
                                    :completable="false"
                                    :display-options="false"
                                    elevation="3"
                                    color="grey darken-4">
                                </TaskCard>
                            </div>
                        </v-tab-item>
                    </v-tabs-items>
                </template>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts">
import ProgressCircular from '@/components/ProgressCircular.vue'
import { DailyTask } from '@/models/daily-task.model'
import { ProjectDetail } from '@/models/project.model'
import { Task } from '@/models/task.model'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import TaskCard from '@/views/components/task/TaskCard.vue'

@Component({ components: { TaskCard, ProgressCircular } })
export default class DailyUpdateProjectListItem extends Vue {
    @Prop() project!: ProjectDetail
    @Prop() dailyTaskList!: DailyTask[]
    @Prop() selected!: boolean
    @Prop({ default: 0 }) sectionSelected!: number

    sectionTab = 0

    get taskBySection(): { id: number; name: string; tasks: Task[] }[] {
        return [
            {
                id: 0,
                name: 'General tasks',
                tasks: this.project.tasks,
            },
            ...this.project.sections
                .filter(({ tasks }) => tasks.some(({ completed }) => !completed))
                .map(section => ({
                    id: section.id,
                    name: section.name,
                    tasks: section.tasks,
                })),
        ]
    }

    get allTasks(): Task[] {
        return this.project.tasks.concat(this.project.sections.map(s => s.tasks).flat())
    }

    get allTasksCompleted(): Task[] {
        return this.allTasks.filter(task => task.completed)
    }

    get allTasksUncompleted(): Task[] {
        return this.allTasks.filter(task => !task.completed)
    }

    get taskUncompleted(): (tasks: Task[]) => Task[] {
        return (tasks: Task[]) => tasks.filter(task => !task.completed)
    }

    get percentageOfTaskCompleted(): number {
        return (this.allTasksCompleted.length / this.allTasks.length) * 100
    }

    @Watch('sectionSelected')
    onSectionSelectedChanges(value: number): void {
        this.sectionTab = this.taskBySection.findIndex(({ id }) => id === value) ?? 0
    }

    isTaskSelected(task: Task): boolean {
        return this.dailyTaskList.some((dailyTask: DailyTask) => task.id === dailyTask.task?.id)
    }

    selectProject(): void {
        if (this.allTasksUncompleted.length === 0 || this.selected) return

        this.sectionTab = 0
        this.$emit('update:selected', true)
    }

    unselectProject(): void {
        this.$emit('update:selected', false)
    }

    selectTask(task: Task): void {
        if (this.isTaskSelected(task)) return

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

    & > .v-card {
        height: 100%;

        .v-card__text {
            height: 100%;
            display: flex;
            flex-direction: column;

            .section-wrapper {
                width: min-content;
            }

            .task-wrapper {
                flex-grow: 1;
                overflow-y: auto;
                padding: 12px 8px 8px;
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
        }
    }
}
</style>
