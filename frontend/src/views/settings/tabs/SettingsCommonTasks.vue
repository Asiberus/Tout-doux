<template>
    <div class="fill-height d-flex flex-column">
        <div class="text-h5 text-md-h4 mb-2 mb-md-3">Common task</div>
        <div class="d-flex flex-wrap flex-md-nowrap justify-end align-center gap-2 mb-2">
            <h3 class="flex-grow-1 text-subtitle-2 text-sm-subtitle-1 mr-md-5">
                A common task represent a task that can be done frequently (e.g. take the dog out,
                buy some groceries). It can easily be added in the daily update.
            </h3>

            <CommonTaskDialog v-model="commonTaskDialog" @create="createCommonTask($event)">
                <template #activator="{ attrs, on }">
                    <v-btn v-bind="attrs" v-on="on">
                        <v-icon left>mdi-plus</v-icon>
                        common task
                    </v-btn>
                </template>
            </CommonTaskDialog>
        </div>

        <template v-if="commonTaskList.length">
            <div class="common-task-wrapper">
                <CommonTaskCard
                    v-for="commonTask of commonTaskList"
                    :key="commonTask.id"
                    :common-task="commonTask"
                    @update="updateCommonTask($event)"
                    @delete="deleteCommonTask($event)" />
            </div>
        </template>
        <template v-else>
            <EmptyListDisplay
                message="You didn't create any common task yet."
                class="empty-list-displays">
                <template #img>
                    <img
                        src="../../../assets/no_common_task.svg"
                        alt="No common task"
                        class="empty-list-display__img" />
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { commonTaskService } from '@/api'
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import CommonTaskCard from '@/views/components/common-task/CommonTaskCard.vue'
import CommonTaskDialog from '@/views/components/common-task/CommonTaskDialog.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'

@Component({ components: { CommonTaskCard, CommonTaskDialog, EmptyListDisplay } })
export default class SettingsCommonTasks extends Vue {
    commonTaskList: CommonTask[] = []

    commonTaskDialog = false

    created(): void {
        this.fetchCommonTaskList()
    }

    private fetchCommonTaskList(): void {
        commonTaskService
            .getCommonTaskList({ size: 0 })
            .then((response: any) => {
                this.commonTaskList = response.body.content
            })
            .catch((error: any) => console.error(error))
    }

    createCommonTask(data: CommonTaskForm): void {
        commonTaskService
            .createCommonTask(data)
            .then((response: any) => {
                this.commonTaskList.push(response.body)
                this.commonTaskDialog = false
            })
            .catch((error: any) => console.error(error))
    }

    updateCommonTask({ id, data }: { id: number; data: CommonTaskForm }): void {
        commonTaskService
            .updateCommonTask(id, data)
            .then((response: any) => {
                const index = this.commonTaskList.findIndex(commonTask => commonTask.id === id)
                if (index !== -1) this.commonTaskList.splice(index, 1, response.body)
            })
            .catch((error: any) => console.error(error))
    }

    deleteCommonTask(id: number): void {
        commonTaskService
            .deleteCommonTask(id)
            .then(() => {
                const index = this.commonTaskList.findIndex(commonTask => commonTask.id === id)
                if (index !== -1) this.commonTaskList.splice(index, 1)
            })
            .catch((error: any) => console.error(error))
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.common-task-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(296px, 1fr));
    gap: 8px;

    @media #{map-get($display-breakpoints, 'sm-and-up')} {
        grid-template-columns: repeat(auto-fill, minmax(max(300px, calc((100% - 12px) / 2)), 1fr));
        gap: 12px;
    }

    & > * {
        min-width: 0;
    }
}

.empty-list-display {
    flex-grow: 1;

    &__img {
        width: clamp(200px, 50%, 300px);
    }
}
</style>
