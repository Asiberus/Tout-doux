<template>
    <div>
        <div class="text-h4 mb-4">Common task</div>
        <div class="d-flex justify-space-between align-center mb-1">
            <p class="text-subtitle-1 mb-0 mr-10">
                A common task represent a task that can be done multiple times (e.g. take the dog
                out, buy some groceries). They can be easily added in the daily update.
            </p>
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
            <EmptyListDisplay :message="`You didn't create any common task yet`" class="mt-10">
                <template #img>
                    <img
                        src="../../../assets/no_common_task.svg"
                        width="330"
                        alt="No common task" />
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
.common-task-wrapper {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}
</style>
