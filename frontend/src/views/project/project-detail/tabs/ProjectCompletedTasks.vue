<template>
    <div>
        <v-tabs
            v-model="sectionTabs"
            color="green"
            hide-slider
            show-arrows
            background-color="transparent">
            <v-tab v-for="section of tasksBySection" :key="'tab-' + section.id">
                {{ section.name }}
            </v-tab>
        </v-tabs>

        <v-tabs-items v-model="sectionTabs" class="transparent pa-3">
            <v-tab-item v-for="section of tasksBySection" :key="'tab-item-' + section.id">
                <h3 class="mb-3">{{ section.name }}</h3>
                <template v-if="section.tasks.length > 0">
                    <v-row no-gutters>
                        <v-col v-for="task in section.tasks" :key="task.id" cols="6" class="px-2">
                            <TaskItemCard
                                :task="task"
                                :disabled="project.archived"
                                @toggle-state="toggleTaskState">
                            </TaskItemCard>
                        </v-col>
                    </v-row>
                </template>
                <template v-else>
                    <EmptyListDisplay message="No tasks completed yet !" class="my-7">
                        <template #img>
                            <img
                                src="../../../../assets/no-task-completed.svg"
                                width="300"
                                alt="No tasks completed" />
                        </template>
                    </EmptyListDisplay>
                </template>
            </v-tab-item>
        </v-tabs-items>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { ProjectTask } from '@/models/project.model'
import { Task } from '@/models/task.model'
import { projectActions } from '@/store/modules/project.store'
import TaskItemCard from '@/views/components/task/TaskItemCard.vue'
import { Component, Vue } from 'vue-property-decorator'

@Component({
    components: {
        TaskItemCard,
        EmptyListDisplay,
    },
})
export default class ProjectCompletedTasks extends Vue {
    sectionTabs = 0

    get project(): ProjectTask {
        return this.$store.state.project.currentProject
    }

    get tasksBySection(): { id: number; name: string; tasks: Task[] }[] {
        return [
            {
                id: 0,
                name: 'General tasks',
                tasks: this.project.tasks.filter(task => task.completed),
            },
            ...this.project.sections.map(section => ({
                id: section.id,
                name: section.name,
                tasks: section.tasks.filter(task => task.completed),
            })),
        ]
    }

    toggleTaskState(id: number, completed: boolean): void {
        let payload
        if (this.project.tasks.some(task => task.id === id))
            payload = { id, data: { completed }, projectId: this.project.id }
        else {
            const section = this.project.sections.find(section =>
                section.tasks.some(task => task.id === id)
            )
            if (section) payload = { id, data: { completed }, sectionId: section.id }
        }
        this.$store.dispatch(projectActions.task.editTask, payload)
    }
}
</script>

<style scoped lang="scss"></style>
