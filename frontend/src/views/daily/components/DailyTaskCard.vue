<template>
    <v-card
        @click="emitDailyTaskToggle()"
        :color="dailyTask.completed ? 'green darken-2' : null"
        class="daily-task-card rounded-lg">
        <div class="daily-task-card__header">
            <DailyTaskActionChip
                v-if="dailyTask.action"
                :action="dailyTask.action"
                class="flex-shrink-0">
            </DailyTaskActionChip>

            <h4 class="text-body-1 font-weight-medium text-truncate">
                {{ name }}
            </h4>

            <v-spacer></v-spacer>

            <template v-if="dailyTask.task">
                <template v-if="dailyTask.task.project">
                    <ProjectChip
                        v-if="dailyTask.task.project"
                        :project="dailyTask.task.project"
                        @click.native.stop
                        :small="true"
                        class="daily-task-card__header__link">
                    </ProjectChip>
                </template>
                <template v-if="dailyTask.task.section">
                    <SectionChip
                        v-if="dailyTask.task.section"
                        :section="dailyTask.task.section"
                        @click.native.stop
                        :small="true"
                        class="daily-task-card__header__link">
                    </SectionChip>
                </template>
                <template v-if="dailyTask.task.collection">
                    <CollectionChip
                        v-if="dailyTask.task.collection"
                        :collection="dailyTask.task.collection"
                        @click.native.stop
                        :small="true"
                        class="daily-task-card__header__link">
                    </CollectionChip>
                </template>
            </template>
        </div>

        <template v-if="dailyTask.task && dailyTask.task.tags.length > 0">
            <TagGroup :tag-list="dailyTask.task.tags" max-tag="3" z-index="300"></TagGroup>
        </template>

        <template v-if="dailyTask.commonTask && dailyTask.commonTask.tags.length > 0">
            <TagGroup :tag-list="dailyTask.commonTask.tags" max-tag="3" z-index="300"></TagGroup>
        </template>

        <template v-if="dailyTask.tags.length > 0">
            <TagGroup :tag-list="dailyTask.tags" max-tag="3" z-index="300"></TagGroup>
        </template>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { DailyTask } from '@/models/daily-task.model'
import CollectionChip from '@/components/CollectionChip.vue'
import SectionChip from '@/components/SectionChip.vue'
import ProjectChip from '@/components/ProjectChip.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import DailyTaskActionChip from '@/views/daily/components/DailyTaskActionChip.vue'

@Component({
    components: { DailyTaskActionChip, TagGroup, ProjectChip, SectionChip, CollectionChip },
})
export default class DailyTaskCard extends Vue {
    @Prop({ required: true }) dailyTask!: DailyTask

    get name(): string {
        if (this.dailyTask.task) return this.dailyTask.task.name
        else if (this.dailyTask.commonTask) return this.dailyTask.commonTask.name
        else return this.dailyTask.name as string // We know name is defined
    }

    emitDailyTaskToggle(): void {
        this.$emit('toggle')
    }
}
</script>

<style scoped lang="scss">
.daily-task-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    row-gap: 8px;

    &__header {
        display: flex;
        align-items: center;
        column-gap: 8px;

        &__action {
            flex-shrink: 0;
        }

        &__link {
            max-width: 15rem;
        }
    }
}
</style>
