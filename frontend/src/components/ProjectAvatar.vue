<script setup lang="ts">
import { Project } from '@/models/project.model'

withDefaults(
  defineProps<{
    project: Project
    hover?: boolean
    small?: boolean
  }>(),
  { hover: false, small: false }
)
</script>

<template>
  <v-avatar
    :color="project.archived ? 'projectArchived' : 'project'"
    :size="small ? 12 : 15"
    class="project-avatar"
    :class="{ hovered: hover, small: small }"
    :title="project.name">
    <span :class="{ 'project-archived': project.archived }">
      {{ project.name.slice(0, 1) }}
    </span>
  </v-avatar>
</template>

<style scoped lang="scss">
.project-avatar {
  position: absolute;
  top: 16px;
  right: 16px;
  transition: transform 0.1s ease-in-out;

  &.small span {
    font-size: 0.45rem;
  }

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
    color: rgb(var(--v-theme-antiProject));

    &.project-archived {
      color: rgb(var(--v-theme-antiProjectArchived));
    }
  }

  &:hover span {
    color: white;
  }
}
</style>
