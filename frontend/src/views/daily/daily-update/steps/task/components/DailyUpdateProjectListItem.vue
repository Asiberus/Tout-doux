<template>
    <div class="pa-2" :class="{ selected: selected }" @click="selectProject">
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
                                    <ProgressCircular
                                        v-if="section.tasks.length > 0"
                                        :value="section.tasks.filter(t => t.completed).length"
                                        :max="section.tasks.length"
                                        :size="16"
                                        :width="8"
                                        :display-text="false"
                                        class="ml-1"
                                        :title="`${
                                            section.tasks.filter(t => t.completed).length
                                        } of ${section.tasks.length} tasks completed`">
                                    </ProgressCircular>
                                </span>
                            </v-tab>
                        </v-tabs>
                        <v-btn @click.stop="unselectProject" color="red" icon>
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </template>
                </div>
                <template v-if="selected">
                    <v-divider class="mt-3"></v-divider>

                    <v-tabs-items v-model="sectionTab" class="task-wrapper pt-3">
                        <v-tab-item
                            v-for="section of taskBySection"
                            :key="`tab-item-${section.id}`">
                            <template v-if="taskUncompleted(section.tasks).length">
                                <v-row align-content="start">
                                    <v-col
                                        v-for="task of taskUncompleted(section.tasks)"
                                        :key="`${section.name}-task-${task.id}`"
                                        cols="6">
                                        <v-card
                                            @click="selectTask(task)"
                                            :disabled="isTaskSelected(task)"
                                            :color="
                                                isTaskSelected(task) ? 'taskCompleted' : '#212121'
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
                                    :message="`No task are related to ${section.name}`">
                                    <template #img>
                                        <img
                                            src="../../../../../../assets/no_tasks.svg"
                                            alt="No tasks"
                                            height="150" />
                                    </template>
                                </EmptyListDisplay>
                            </template>
                        </v-tab-item>
                    </v-tabs-items>
                </template>
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import ProgressCircular from '@/components/ProgressCircular.vue'
import { DailyTask } from '@/models/daily-task.model'
import { ProjectTask } from '@/models/project.model'
import { Task } from '@/models/task.model'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({ components: { EmptyListDisplay, ProgressCircular } })
export default class DailyUpdateProjectListItem extends Vue {
    @Prop() project!: ProjectTask
    @Prop() dailyTaskList!: DailyTask[]
    @Prop() selected!: boolean
    @Prop({ default: 0 }) sectionSelected!: number

    sectionTab = 0

    // todo : change color of task selected
    get isTaskSelected(): (task: Task) => boolean {
        return (task: Task) =>
            this.dailyTaskList.some((dailyTask: DailyTask) => task.id === dailyTask.taskId)
    }

    get taskBySection(): { id: number; name: string; tasks: Task[] }[] {
        return [
            {
                id: 0,
                name: 'General tasks',
                tasks: this.project.tasks,
            },
            ...this.project.sections
                .filter(section => section.tasks.some(task => !task.completed))
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

    selectProject(): void {
        if (this.allTasksUncompleted.length === 0 || this.selected) return

        this.sectionTab = 0
        this.$emit('update:selected', true)
    }

    unselectProject(): void {
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

            .project-title {
                max-width: 17.5rem;
            }

            .section-wrapper {
                // Set width to low value to let flex handle it
                // See when fit-content are implemented on firefox
                width: 1rem;
            }

            .task-wrapper {
                flex-grow: 1;
                overflow-y: auto;
            }
        }
    }
}
</style>
