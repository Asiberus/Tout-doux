<template>
    <div>
        <div class="text-h4">Common task</div>
        <div class="d-flex justify-space-between align-center mb-3">
            <p class="text-subtitle-1 mb-0">
                A common task is a task that can be added easily to a daily.
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

        <v-row>
            <v-col v-for="commonTask of commonTaskList" :key="commonTask.id" cols="4">
                <CommonTaskCard
                    :common-task="commonTask"
                    @update="updateCommonTask($event)"
                    @delete="deleteCommonTask($event)" />
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { commonTaskService } from '@/api'
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import CommonTaskCard from '@/views/components/common-task/CommonTaskCard.vue'
import CommonTaskDialog from '@/views/components/common-task/CommonTaskDialog.vue'

@Component({ components: { CommonTaskCard, CommonTaskDialog } })
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
