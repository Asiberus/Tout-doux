<template>
    <v-chip
        :to="detailLocation"
        label
        :color="archived ? 'projectArchived' : 'project'"
        :ripple="ripple"
        :small="small"
        :title="title">
        <v-icon small left>mdi-briefcase-variant</v-icon>
        <div class="name-wrapper">
            <span class="project-name text-truncate">{{ project.name }}</span>
            <span class="mx-1">•</span>
            <span class="section-name text-truncate">{{ section.name }}</span>
        </div>
    </v-chip>
</template>

<script lang="ts">
import { Project } from 'src/models/project.model'
import { Section } from 'src/models/section.model'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Location, Route } from 'vue-router'

@Component
export default class SectionChip extends Vue {
    @Prop({ required: true }) section!: Section
    @Prop({ default: false }) ripple!: boolean
    @Prop({ default: false }) small!: boolean
    @Prop({ default: true }) navigateToDetail!: boolean

    get project(): Project {
        return this.section.project
    }

    get archived(): boolean {
        return this.project.archived
    }

    get detailLocation(): Location | undefined {
        if (!this.navigateToDetail) return
        return {
            name: 'project-detail-section',
            params: { id: `${this.project.id}`, sectionId: `${this.section.id}` },
        }
    }

    get title(): string {
        let title = `Go to : ${this.project.name} • ${this.section.name}`
        if (this.project.archived) title += ' (Archived)'
        return title
    }
}
</script>

<style scoped lang="scss">
.name-wrapper {
    display: flex;
    overflow: hidden;

    .project-name,
    .section-name {
        flex: 1 1 auto;
        min-width: 1ch;
    }
}
</style>
