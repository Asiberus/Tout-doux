<template>
    <div v-if="project">
        <h1>
            Project : {{ project.name }}
            <v-chip v-if="project.archived" color="accent" class="ml-3">
                <v-icon small class="mr-1"> mdi-archive </v-icon>
                Archived
            </v-chip>
        </h1>

        <v-divider class="my-3" />

        <v-tabs v-model="projectTab" background-color="transparent" color="accent">
            <v-tab :to="{ name: 'project-detail' }" exact>Description</v-tab>
            <v-tab :to="{ name: 'project-detail-section' }" exact>Section</v-tab>
            <v-tab :to="{ name: 'project-detail-event' }" exact>Event</v-tab>
            <v-tab :to="{ name: 'project-detail-completed-tasks' }" exact>Completed Task</v-tab>
            <v-tab exact disabled>Historic</v-tab>
            <v-tab :to="{ name: 'project-detail-configuration' }" exact>Configuration</v-tab>
        </v-tabs>

        <div class="pa-5">
            <router-view />
        </div>
    </div>
</template>

<script lang="ts">
import { ProjectTask } from '@/models/project.model'
import { projectActions } from '@/store/modules/project.store'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ProjectDetail extends Vue {
    @Prop() private projectId!: number

    projectTab = 'description'

    get project(): ProjectTask | undefined {
        return this.$store.state.project.currentProject
    }

    mounted(): void {
        this.$store.dispatch(projectActions.retrieveProject, this.projectId)
    }
}
</script>

<style scoped lang="scss"></style>
