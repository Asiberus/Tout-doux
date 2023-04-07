<template>
    <div v-if="project">
        <div class="d-flex align-center">
            <h3 class="text-h3"><span class="grey--text">Project : </span>{{ project.name }}</h3>
            <v-chip v-if="project.archived" color="accent" class="ml-3">
                <v-icon small class="mr-1"> mdi-archive </v-icon>
                Archived
            </v-chip>
        </div>

        <v-divider class="my-4" />

        <v-tabs v-model="projectTab" background-color="transparent" color="accent">
            <v-tab :to="{ name: 'project-detail' }" exact>Description</v-tab>
            <v-tab :to="{ name: 'project-detail-section' }">Section</v-tab>
            <v-tab :to="{ name: 'project-detail-event' }">Event</v-tab>
            <v-tab disabled>Historic</v-tab>
            <v-tab :to="{ name: 'project-detail-settings' }">Settings</v-tab>
        </v-tabs>

        <div class="pa-5">
            <router-view />
        </div>
    </div>
</template>

<script lang="ts">
import { ProjectDetail } from '@/models/project.model'
import { projectActions } from '@/store/modules/project.store'
import { Component, Prop, Vue } from 'vue-property-decorator'
import TagGroup from '@/views/components/tag/TagGroup.vue'

@Component({ components: { TagGroup } })
export default class ProjectDetailComponent extends Vue {
    @Prop() private projectId!: number

    projectTab = 'description'

    get project(): ProjectDetail | undefined {
        return this.$store.state.project.currentProject
    }

    mounted(): void {
        this.$store.dispatch(projectActions.retrieveProject, this.projectId)
    }
}
</script>

<style scoped lang="scss"></style>
