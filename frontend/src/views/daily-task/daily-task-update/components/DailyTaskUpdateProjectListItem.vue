<template>
    <div class="card-wrapper" :class="{ selected: selected }" @click="selectProject">
        <v-card
            :disabled="allTasksUncompleted.length === 0"
            :class="{ 'cursor-pointer': !selected }">
            <v-progress-linear :value="percentageOfTaskCompleted" color="green accent-2" height="4">
            </v-progress-linear>
            <v-card-text>
                <div class="d-flex justify-space-between align-center">
                    <h3 class="d-flex align-center white--text project-title">
                        <span :title="project.name">
                            {{ project.name }}
                        </span>
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
                        </template>
                    </h3>
                    <template v-if="!selected">
                        <div class="mx-3">
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
                        <v-tabs
                            v-model="sectionTab"
                            color="accent"
                            class="section-wrapper"
                            hide-slider
                            show-arrows>
                            <v-tab
                                active-class="font-weight-bold"
                                v-for="section of taskBySection"
                                :key="`tab-${section.name}`">
                                {{ section.name }}
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
                            :key="`tab-item-${section.name}`">
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
                                            src="../../../../assets/no_tasks.svg"
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
import { DailyTask } from '@/models/daily-task.model'
import { ProjectTask } from '@/models/project.model'
import { Task } from '@/models/task.model'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
    components: {
        EmptyListDisplay,
    },
})
export default class DailyTaskUpdateProjectListItem extends Vue {
    @Prop() project!: ProjectTask
    @Prop() dailyTaskList!: DailyTask[]
    @Prop() selected!: boolean

    sectionTab = 0

    // todo : change color of task selected
    get isTaskSelected(): (task: Task) => boolean {
        return (task: Task) =>
            this.dailyTaskList.some((dailyTask: DailyTask) => task.id === dailyTask.taskId)
    }

    get taskBySection(): { name: string; tasks: Task[] }[] {
        return [
            {
                name: 'General tasks',
                tasks: this.project.tasks.filter(task => !task.completed),
            },
            ...this.project.sections.map(section => ({
                name: section.name,
                tasks: section.tasks.filter(task => !task.completed),
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
.card-wrapper {
    padding: 0.5rem;

    .project-title {
        max-width: 13rem;

        span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

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
