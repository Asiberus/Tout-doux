<template>
    <div :class="{ selected }" @click="selectProject()">
        <v-card
            :disabled="allTasksUncompleted.length === 0"
            :class="{ 'cursor-pointer': !selected }"
            class="project-card rounded-lg">
            <v-progress-linear
                :value="percentageOfTaskCompleted"
                color="green accent-2"
                height="4"
                class="flex-shrink-0">
            </v-progress-linear>
            <v-card-text>
                <div class="d-flex align-center">
                    <div class="min-width-0">
                        <h3 class="text-h6 white--text text-truncate" :title="project.name">
                            {{ project.name }}
                        </h3>

                        <template v-if="!selected">
                            <div class="mt-1">
                                <template v-if="project.tags.length > 0">
                                    <TagGroup
                                        :tag-list="project.tags"
                                        max-tag="1"
                                        :small="true"
                                        :small-menu-chip="true">
                                    </TagGroup>
                                </template>
                            </div>
                        </template>
                    </div>

                    <template v-if="!selected">
                        <v-spacer></v-spacer>
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
                                class="mx-1"
                                title="Go to project">
                                <v-icon small>mdi-open-in-new</v-icon>
                            </v-btn>
                        </v-hover>
                        <template v-if="project.tags.length > 0">
                            <TagGroup :tag-list="project.tags" max-tag="3"></TagGroup>
                        </template>

                        <v-spacer></v-spacer>
                        <v-btn @click.stop="unselectProject()" color="red" icon>
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </template>
                </div>

                <template v-if="selected">
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
                            <ProgressDisk
                                v-if="section.tasks.length > 0"
                                :value="section.tasks.filter(({ completed }) => completed).length"
                                :max="section.tasks.length"
                                color="green accent-2"
                                class="ml-1 flex-shrink-0"
                                :title="`${
                                    section.tasks.filter(({ completed }) => completed).length
                                } of ${section.tasks.length} tasks completed`">
                            </ProgressDisk>
                        </v-tab>
                    </v-tabs>
                    <v-divider class="mt-0"></v-divider>

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
import { DailyTask } from '@/models/daily-task.model'
import { ProjectDetail } from '@/models/project.model'
import { Task } from '@/models/task.model'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import TaskCard from '@/views/components/task/TaskCard.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import ProgressDisk from '@/components/ProgressDisk.vue'

@Component({ components: { TaskCard, TagGroup, ProgressDisk } })
export default class DailyUpdateProjectListItem extends Vue {
    @Prop({ required: true }) project!: ProjectDetail
    @Prop({ required: true }) dailyTaskList!: DailyTask[]
    @Prop({ required: true }) selected!: boolean
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
.project-card {
    min-height: 88px;
    display: flex;
    flex-direction: column;

    .v-card__text {
        flex-grow: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .min-width-0 {
            min-width: 0;
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

    & > .project-card {
        height: 100%;

        .v-card__text {
            .section-wrapper {
                flex-grow: 0;
            }

            .tab-item-wrapper {
                flex-grow: 1;
            }

            .task-wrapper {
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
