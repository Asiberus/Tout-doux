<template>
    <v-avatar
        :color="project.archived ? 'projectArchived' : 'project'"
        size="15"
        class="project-avatar"
        :class="{ hovered: hover }"
        :title="project.name">
        <span :class="{ 'project-archived': project.archived }">
            {{ project.name.slice(0, 1) }}
        </span>
    </v-avatar>
</template>

<script lang="ts">
import { Project } from '@/models/project.model'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ProjectAvatar extends Vue {
    @Prop({ required: true }) project!: Project
    @Prop({ default: false }) hover!: boolean
}
</script>

<style scoped lang="scss">
.project-avatar {
    position: absolute;
    top: 16px;
    right: 16px;
    transition: transform 0.1s ease-in-out;

    &.hovered {
        transform: scale(2);

        span {
            opacity: 1;
            transform: scale(1);
        }
    }

    span {
        opacity: 0;
        font-size: 0.5rem;
        font-weight: 0;
        transform: scale(0.5);
        transition: all 0.2s ease-in-out;
        color: var(--v-antiProject-base);

        &.project-archived {
            color: var(--v-antiProjectArchived-base);
        }
    }

    &:hover span {
        color: white;
    }
}
</style>
