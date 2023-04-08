<template>
    <v-card
        :to="{ name: 'project-detail', params: { id: project.id } }"
        :color="project.archived ? 'projectArchivedCard' : null"
        :ripple="false"
        class="rounded-lg">
        <v-progress-linear :value="percentageOfCompletedTask" color="green accent-2" height="6">
        </v-progress-linear>
        <v-card-text class="d-flex justify-space-between align-center">
            <div class="flex-shrink-1 overflow-hidden">
                <h5
                    class="text-h5 white--text font-weight-bold text-truncate"
                    :title="project.name">
                    {{ project.name }}
                </h5>
                <p class="text-subtitle text-truncate mb-1" :title="project.description">
                    {{ project.description }}
                </p>
                <div class="tag-wrapper">
                    <template v-if="project.tags.length > 0">
                        <TagGroup :tag-list="project.tags" max-tag="2"></TagGroup>
                    </template>
                </div>
            </div>
            <div class="px-3 flex-shrink-0">
                <span style="font-size: 2.5em" class="white--text">{{
                    project.completedTaskCount
                }}</span>
                /
                <span style="font-size: 1.5em; transform: translateY(0.3em); display: inline-block">
                    {{ project.taskCount }}
                </span>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ProjectList } from '@/models/project.model'
import TagGroup from '@/views/components/tag/TagGroup.vue'

@Component({ components: { TagGroup } })
export default class ProjectItemCard extends Vue {
    @Prop() private project!: ProjectList

    get percentageOfCompletedTask(): number {
        return (this.project.completedTaskCount / this.project.taskCount) * 100
    }
}
</script>

<style scoped lang="scss">
.tag-wrapper {
    min-height: 20px;
}
</style>
