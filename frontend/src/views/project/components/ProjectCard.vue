<template>
    <v-card
        :to="{ name: 'project-detail', params: { id: project.id } }"
        :color="project.archived ? 'projectArchivedCard' : null"
        :ripple="false"
        class="project-card rounded-lg">
        <v-progress-linear :value="percentageOfCompletedTask" color="green accent-2" height="6">
        </v-progress-linear>
        <v-card-text class="d-flex justify-space-between align-center gap-1 pa-3 pa-sm-4">
            <div class="flex-shrink-1 overflow-hidden">
                <h5
                    class="text-h6 text-sm-h5 white--text font-weight-bold text-truncate"
                    :title="project.name">
                    {{ project.name }}
                </h5>
                <p
                    class="text-subtitle-2 text-sm-subtitle-1 text-truncate mb-0"
                    :title="project.description">
                    {{ project.description }}
                </p>

                <TagGroup
                    v-if="project.tags.length > 0"
                    :tag-list="project.tags"
                    class="mt-1"></TagGroup>
            </div>

            <div class="d-flex flex-column gap-2 align-end">
                <TaskCounter
                    v-if="project.taskCount > 0"
                    :value="project.completedTaskCount"
                    :max="project.taskCount">
                </TaskCounter>
                <div v-if="project.eventsToCome > 0" class="d-flex gap-1">
                    <span class="event-count">{{ project.eventsToCome }}</span>
                    <v-icon>mdi-calendar-clock</v-icon>
                </div>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ProjectList } from '@/models/project.model'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import TaskCounter from '@/components/TaskCounter.vue'

@Component({ components: { TaskCounter, TagGroup } })
export default class ProjectCard extends Vue {
    @Prop() private project!: ProjectList

    get percentageOfCompletedTask(): number {
        return (this.project.completedTaskCount / this.project.taskCount) * 100
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.project-card {
    min-height: 122px;
    display: grid;
    grid-template-rows: auto 1fr;

    & > * {
        min-width: 0;
    }

    .event-count {
        font-size: 1.5rem;
        color: white;

        @media #{map-get($display-breakpoints, 'sm-and-down')} {
            font-size: 1.25rem;
        }
    }
}
</style>
