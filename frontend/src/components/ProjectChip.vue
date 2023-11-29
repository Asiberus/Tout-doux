<template>
    <v-chip
        :to="detailLocation"
        label
        :color="project.archived ? 'projectArchived' : 'project'"
        :ripple="ripple"
        :small="small"
        :title="title"
        :class="{ 'cursor-default': this.project.archived && !this.detailLocation }"
        @click="click($event)"
        class="project-chip px-0">
        <v-icon small class="ml-2 mr-1">mdi-briefcase-variant</v-icon>
        <div class="text-truncate mr-2">
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

    click(event: Event): void {
        if (this.project.archived) return

        this.$emit('click', event)
    }
}
</script>

<style scoped lang="scss">
.project-chip {
    min-width: 32px;
}
</style>
