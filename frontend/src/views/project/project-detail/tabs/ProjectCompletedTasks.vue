<template>
    <div>
        <div v-for="(taskList, index) in tasksList" :key="taskList.name + index">
            <h3 class="mb-3">{{ taskList.name }}</h3>
            <template v-if="taskList.tasks.length > 0">
                <v-row no-gutters>
                    <v-col v-for="task in taskList.tasks" :key="task.id" cols="6" class="px-2">
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
            <v-divider v-if="index !== tasksList.length - 1" class="my-3" />
        </div>
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
    get project(): ProjectTask {
        return this.$store.state.project.currentProject
    }

    get tasksList(): { name: string; tasks: Task[]; sectionId?: number }[] {
        return [
            {
                name: 'General tasks',
                tasks: this.project.tasks.filter(task => task.completed),
            },
            ...this.project.sections.map(section => ({
                name: section.name,
                tasks: section.tasks.filter(task => task.completed),
                sectionId: section.id,
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
