<template>
    <v-chip
        :to="detailLocation"
        label
        :color="project.archived ? 'projectArchived' : 'project'"
        :ripple="ripple"
        :small="small"
        :title="title">
        <v-icon v-if="project.archived" small left>mdi-archive</v-icon>

        <div class="text-ellipsis">
            {{ project.name }}
        </div>
    </v-chip>
</template>

<script lang="ts">
import { Project } from 'src/models/project.model'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Location } from 'vue-router'

@Component
export default class ProjectChip extends Vue {
    @Prop({ required: true }) project!: Project
    @Prop({ default: false }) ripple!: boolean
    @Prop({ default: false }) small!: boolean
    @Prop({ default: true }) navigateToDetail!: boolean

    get title(): string {
        let title = `Go to : ${this.project.name}`
        if (this.project.archived) title += ' (Archived)'
        return title
    }

    get detailLocation(): Location | undefined {
        if (!this.navigateToDetail) return
        return { name: 'project-detail', params: { id: `${this.project.id}` } }
    }
}
</script>
