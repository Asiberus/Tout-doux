<template>
    <v-chip
        :to="{ name: 'project-detail', params: { id: project.id } }"
        label
        :color="project.archived ? 'projectArchived' : 'project'"
        :title="projectTitle"
        class="project-chip">
        <v-icon v-if="project.archived" small left>mdi-archive</v-icon>
        <span class="text-ellipsis">
            {{ project.name }}
        </span>
    </v-chip>
</template>

<script lang="ts">
import { Project } from 'src/models/project.model'
import { SectionExtended } from 'src/models/section.model'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ProjectChip extends Vue {
    @Prop({ required: true }) project!: Project
    @Prop({ default: null }) section!: SectionExtended | null

    get projectTitle(): string {
        if (!this.project) return ''

        let title = this.project.name
        if (this.project.archived) title += ' (Archived)'
        return title
    }
}
</script>

<style scoped lang="scss">
.project-chip {
    max-width: 10rem;
}
</style>
