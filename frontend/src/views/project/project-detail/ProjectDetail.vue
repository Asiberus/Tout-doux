<template>
    <v-container v-if="project">
        <div class="d-flex justify-space-between align-center">
            <h1>
                Project : {{ project.name }}
                <v-chip v-if="project.archived" color="accent" class="ml-3">
                    <v-icon small class="mr-1"> mdi-archive </v-icon>
                    Archived
                </v-chip>
            </h1>
        </div>

        <v-divider class="my-3" />

        <v-tabs v-model="projectTab" background-color="transparent" color="accent">
            <v-tab :to="{ name: 'project-detail-description' }">Description</v-tab>
            <v-tab :to="{ name: 'project-detail-section' }">Section</v-tab>
            <v-tab disabled>Event</v-tab>
            <v-tab :to="{ name: 'project-detail-completed-tasks' }">Completed Task</v-tab>
            <v-tab disabled>Historic</v-tab>
            <v-tab :to="{ name: 'project-detail-configuration' }">Configuration</v-tab>
        </v-tabs>

        <router-view />
    </v-container>
</template>

<script lang="ts">
import { ProjectModel } from '@/models/project.model'
import { projectActions } from '@/store/modules/project.store'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ProjectDetail extends Vue {
    @Prop() private projectId!: number

    projectTab = 'description'

    get project(): ProjectModel | undefined {
        return this.$store.state.project.currentProject
    }

    mounted(): void {
        this.$store.dispatch(projectActions.retrieveProject, this.projectId)
    }
}
</script>

<style scoped lang="scss"></style>
