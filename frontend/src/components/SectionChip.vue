<template>
    <v-chip
        :to="detailLocation"
        label
        :color="archived ? 'projectArchived' : 'project'"
        :ripple="ripple"
        :small="small"
        :title="title">
        <v-icon v-if="archived" small left>mdi-archive</v-icon>

        <div class="name-wrapper">
            <span class="project-name text-ellipsis">{{ project.name }}</span>
            <span class="mx-1">•</span>
            <span class="section-name text-ellipsis">{{ section.name }}</span>
        </div>
    </v-chip>
</template>

<script lang="ts">
import { Project } from 'src/models/project.model'
import { SectionExtended } from 'src/models/section.model'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Location, Route } from 'vue-router'

@Component
export default class SectionChip extends Vue {
    @Prop({ required: true }) section!: SectionExtended
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
            params: { id: `${this.project.id}` },
            query: { id: `${this.section.id}` },
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

    // Todo: fix css rules to make it fit content
    .project-name {
        max-width: 50%;
        flex-grow: 1;
        flex-shrink: 1;
    }

    .section-name {
        flex-basis: fit-content;
        flex-shrink: 2;
        flex-grow: 1;
        max-width: min-content;
    }
}
</style>
