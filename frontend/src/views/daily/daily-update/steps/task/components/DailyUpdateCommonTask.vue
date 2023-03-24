<template>
    <div>
        <template v-if="commonTaskList.length">
            <div class="common-task-list">
                <CommonTaskCard
                    v-for="commonTask of commonTaskList"
                    :key="commonTask.id"
                    :common-task="commonTask"
                    :editable="false"
                    :selected="isCommonTaskSelected(commonTask.id)"
                    @click.native="selectCommonTask(commonTask.id)">
                </CommonTaskCard>
            </div>
        </template>
        <template v-else>
            <EmptyListDisplay :message="`You didn't create any common task yet`">
                <template #img>
                    <img
                        src="../../../../../../assets/no_common_task.svg"
                        width="250"
                        alt="No common task" />
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { CommonTask } from '@/models/common-task.model'
import CommonTaskCard from '@/views/components/common-task/CommonTaskCard.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { DailyTask } from '@/models/daily-task.model'

@Component({ components: { CommonTaskCard, EmptyListDisplay } })
export default class DailyUpdateCommonTask extends Vue {
    @Prop({ required: true, default: [] }) commonTaskList!: CommonTask[]
    @Prop({ required: true, default: [] }) dailyTaskList!: DailyTask[]

    selectCommonTask(id: number): void {
        if (this.isCommonTaskSelected(id)) return

        this.$emit('select-common-task', { commonTaskId: id })
    }

    isCommonTaskSelected(id: number): boolean {
        return this.dailyTaskList.some(({ commonTask }) => commonTask?.id === id)
    }
}
</script>

<style lang="scss" scoped>
.common-task-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    gap: 8px;

    & > * {
        min-width: 0;
    }
}
</style>
