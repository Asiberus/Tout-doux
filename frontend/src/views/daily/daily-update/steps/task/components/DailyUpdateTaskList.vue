<template>
    <div class="d-flex flex-column">
        <div class="d-flex align-center mb-3">
            <h2 class="text-h5 mr-2">Tasks of the day</h2>
            <v-chip v-if="dailyTaskList.length > 0" small>
                {{ dailyTaskList.length }}
            </v-chip>
            <v-spacer></v-spacer>
            <v-btn
                @click="createDailyTaskDisplayed = !createDailyTaskDisplayed"
                icon
                small
                :color="createDailyTaskDisplayed ? 'accent' : null">
                <v-icon>mdi-plus</v-icon>
            </v-btn>
        </div>

        <template v-if="dailyTaskList.length">
            <div class="daily-task-wrapper">
                <template v-for="dailyTask of dailyTaskList">
                    <DailyTaskFormCard
                        :key="dailyTask.id"
                        :daily-task="dailyTask"
                        :edit-mode="selectedDailyTask === dailyTask.id"
                        @show-edit-mode="selectedDailyTask = dailyTask.id"
                        @hide-edit-mode="selectedDailyTask = null"
                        @update="updateDailyTask(dailyTask.id, $event)"
                        @delete="deleteDailyTask(dailyTask.id)"
                        @select="select($event)">
                    </DailyTaskFormCard>
                </template>
                <template v-if="createDailyTaskDisplayed">
                    <v-card class="rounded-lg pa-4">
                        <DailyTaskForm
                            @submit="createDailyTask($event)"
                            @close="createDailyTaskDisplayed = false">
                        </DailyTaskForm>
                    </v-card>
                </template>
            </div>
        </template>
        <template v-else>
            <EmptyListDisplay message="You didn't add any task yet!">
                <template #img>
                    <img src="../../../../../../assets/no_tasks.svg" alt="No tasks" height="300" />
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { DailyTask, DailyTaskPost, DailyUpdateTaskTab } from '@/models/daily-task.model'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import DailyTaskFormCard from '@/views/daily/components/DailyTaskFormCard.vue'
import DailyTaskForm from '@/views/daily/components/DailyTaskForm.vue'

// todo : maybe change v-hover on daily task card
@Component({
    components: { DailyTaskForm, DailyTaskFormCard, EmptyListDisplay },
})
export default class DailyUpdateTaskList extends Vue {
    @Prop() dailyTaskList!: DailyTask[]

    selectedDailyTask: number | null = null
    createDailyTaskDisplayed = false

    @Watch('createDailyTaskDisplayed')
    private onCreateDailyTaskDisplayedChanges(value: boolean): void {
        if (value) this.selectedDailyTask = null
    }

    @Watch('selectedDailyTask')
    private onSelectedDailyTaskChanges(value: number | null): void {
        if (value !== null) this.createDailyTaskDisplayed = false
    }

    createDailyTask(data: DailyTaskPost): void {
        this.createDailyTaskDisplayed = false
        this.$emit('create', data)
    }

    updateDailyTask(id: number, data: DailyTaskPost): void {
        this.selectedDailyTask = null
        this.$emit('update', { id, data })
    }

    deleteDailyTask(id: number): void {
        this.$emit('delete', id)
    }

    select(event: { tab: DailyUpdateTaskTab; id: number; sectionId?: number }): void {
        this.$emit('select', event)
    }
}
</script>

<style scoped lang="scss">
.daily-task-wrapper {
    flex: 1 0 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>
