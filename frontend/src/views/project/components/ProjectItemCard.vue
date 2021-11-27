<template>
    <v-card
        rounded
        :to="{ name: 'project-detail', params: { id: project.id } }"
        :color="project.archived ? 'projectArchived' : null">
        <v-progress-linear :value="percentageOfTaskCompleted" color="green accent-2" height="6">
        </v-progress-linear>
        <v-card-text class="d-flex justify-space-between align-center">
            <div class="d-flex flex-column justify-center">
                <h1 class="white--text mt-1">{{ project.name }}</h1>
                <p class="mb-0 mt-3 ml-2">{{ ellipsisFilter(project.description, 50) }}</p>
            </div>
            <div class="pr-7">
                <span style="font-size: 2.5em" class="white--text">{{
                    allTasksCompleted.length
                }}</span>
                /
                <span style="font-size: 1.5em; transform: translateY(0.3em); display: inline-block">
                    {{ allTasks.length }}
                </span>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Task } from '@/models/task.model'
import ellipsisFilter from '@/filters/ellipsis.filter'
import { ProjectTask } from '@/models/project.model'

@Component
export default class ProjectItemCard extends Vue {
    @Prop() private project!: ProjectTask

    get allTasks(): Task[] {
        return this.project.tasks.concat(...this.project.sections.map(section => section.tasks))
    }

    get allTasksCompleted(): Task[] {
        return this.allTasks.filter(task => task.completed)
    }

    get percentageOfTaskCompleted(): number {
        return (this.allTasksCompleted.length / this.allTasks.length) * 100
    }

    ellipsisFilter(value: string, numberOfCharacter: number): string {
        return ellipsisFilter(value, numberOfCharacter)
    }
}
</script>

<style scoped lang="scss"></style>
