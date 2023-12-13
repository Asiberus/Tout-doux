<template>
    <v-chip
        :to="detailLocation"
        label
        :color="archived ? 'projectArchived' : 'project'"
        :ripple="ripple"
        :small="small"
        :title="title"
        :class="{ 'cursor-default': this.project.archived && !this.detailLocation }"
        @click="click($event)"
        class="section-chip px-0">
        <v-icon small class="ml-2 mr-1">mdi-briefcase-variant</v-icon>
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
import { Location } from 'vue-router'

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

    click(event: Event): void {
        if (this.project.archived) return

        this.$emit('click', event)
    }
}
</script>

<style scoped lang="scss">
.section-chip {
    min-width: 32px;

    .name-wrapper {
        display: flex;
        overflow: hidden;
        margin-right: 8px;

        .project-name,
        .section-name {
            flex: 1 1 auto;
            min-width: 1ch;
        }
    }
}
</style>
