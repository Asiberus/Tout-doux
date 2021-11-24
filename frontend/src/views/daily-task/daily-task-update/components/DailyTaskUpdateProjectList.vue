<template>
    <div>
        <h2 class="mb-3 ml-2">Projects</h2>
        <div class="project-wrapper">
            <template v-if="projectList.length">
                <v-row align-content="start" class="position-relative">
                    <v-col
                        v-for="project in projectList"
                        :key="'project-' + project.content.id"
                        @click="selectProject(project)"
                        cols="4"
                        :class="{ selected: project.selected }">
                        <DailyTaskUpdateProjectListItem
                            :project="project.content"
                            :daily-task-list="dailyTaskList"
                            :is-selected="project.selected"
                            @selectTask="$emit('selectTask', $event)"
                            @unselect="project.selected = false">
                        </DailyTaskUpdateProjectListItem>
                    </v-col>
                </v-row>
            </template>
            <template v-else>
                <EmptyListDisplay message="No projects available">
                    <template #img>
                        <img src="../../../../assets/project.svg" alt="No tasks" height="250" />
                    </template>
                </EmptyListDisplay>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { DailyTaskDisplayWrapper, DailyTaskModel } from '@/models/daily-task.model'
import { ProjectModel } from '@/models/project.model'
import { TaskModel } from '@/models/task.model'
import DailyTaskUpdateProjectListItem from '@/views/daily-task/daily-task-update/components/DailyTaskUpdateProjectListItem.vue'
import { Component, Prop, Vue } from 'vue-property-decorator'

// Todo : add btn to create project in no project svg
@Component({
    components: {
        DailyTaskUpdateProjectListItem,
        EmptyListDisplay,
    },
})
export default class DailyTaskUpdateProjectList extends Vue {
    @Prop() projectList!: DailyTaskDisplayWrapper<ProjectModel>[]
    @Prop() dailyTaskList!: DailyTaskModel[]

    selectProject(project: DailyTaskDisplayWrapper<ProjectModel>): void {
        if (!project.selected) project.selected = true
    }
}
</script>

<style scoped lang="scss">
.position-relative {
    position: relative;
    height: 100%;
}

.project-wrapper {
    height: 20rem;

    .selected {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        max-width: 100%;
        z-index: 1;

        .v-card {
            height: 100%;

            .v-card__text {
                height: 100%;

                .project-card-header {
                    height: 15%;
                }

                .task-wrapper {
                    height: 80%;
                    overflow-y: auto;
                }
            }
        }
    }
}
</style>
