<template>
    <div class="d-flex flex-column h-100">
        <template v-if="commonTaskList.length">
            <div class="common-task-list">
                <CommonTaskCard
                    v-for="commonTask of commonTaskList"
                    :key="commonTask.id"
                    :common-task="commonTask"
                    @click.native="selectCommonTask(commonTask.id)"
                    :selected="isCommonTaskSelected(commonTask.id)"
                    :class="{ 'cursor-pointer': !isCommonTaskSelected(commonTask.id) }"
                    :editable="false">
                </CommonTaskCard>
            </div>
        </template>
        <template v-else>
            <EmptyListDisplay
                message="You didn't create any common task yet."
                class="empty-list-display">
                <template #img>
                    <img
                        src="../../../../../../assets/no_common_task.svg"
                        alt="No common task"
                        class="empty-list-display__img" />
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
@import '~vuetify/src/styles/styles.sass';

.common-task-list {
    display: grid;
    // Max 2 column
    grid-template-columns: repeat(auto-fit, minmax(max(300px, calc((100% - 8px) / 2)), 1fr));
    gap: 8px;

    @media #{map-get($display-breakpoints, 'xs-only')} {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
