<template>
    <v-hover v-slot="{ hover }">
        <v-card class="daily-task-form-card rounded-lg">
            <template v-if="!editMode && dailyTask">
                <div class="daily-task-form-card__content">
                    <div class="daily-task-form-card__content__header">
                        <DailyTaskActionChip
                            :action="dailyTask.action"
                            :editable="true"
                            @update="updateDailyTask({ action: $event })"
                            class="flex-shrink-0">
                        </DailyTaskActionChip>

                        <h4 class="text-body-1 font-weight-medium text-truncate" :title="name">
                            {{ name }}
                        </h4>
                    </div>
                    <template
                        v-if="
                            dailyTask.task ||
                            (dailyTask.commonTask && dailyTask.commonTask.tags.length > 0) ||
                            dailyTask.tags.length > 0
                        ">
                        <div class="daily-task-form-card__content__footer">
                            <template v-if="dailyTask.task">
                                <ProjectChip
                                    v-if="dailyTask.task.project"
                                    :project="dailyTask.task.project"
                                    :small="true"
                                    :navigate-to-detail="false"
                                    @click="
                                        select(
                                            dailyTaskUpdateTabEnum.Project,
                                            dailyTask.task.project.id
                                        )
                                    "
                                    class="daily-task-form-card__content__footer__chip">
                                </ProjectChip>
                                <SectionChip
                                    v-if="dailyTask.task.section"
                                    :section="dailyTask.task.section"
                                    :small="true"
                                    :navigate-to-detail="false"
                                    @click="
                                        select(
                                            dailyTaskUpdateTabEnum.Project,
                                            dailyTask.task.section.project.id,
                                            dailyTask.task.section.id
                                        )
                                    "
                                    class="daily-task-form-card__content__footer__chip">
                                </SectionChip>
                                <CollectionChip
                                    v-if="dailyTask.task.collection"
                                    :collection="dailyTask.task.collection"
                                    :small="true"
                                    :navigate-to-detail="false"
                                    @click="
                                        select(
                                            dailyTaskUpdateTabEnum.Collection,
                                            dailyTask.task.collection.id
                                        )
                                    "
                                    class="daily-task-form-card__content__footer__chip">
                                </CollectionChip>
                            </template>

                            <template v-if="dailyTask.tags.length > 0">
                                <TagGroup :tag-list="dailyTask.tags" :max-tag="2"></TagGroup>
                            </template>
                            <template v-if="dailyTask.task && dailyTask.task.tags.length > 0">
                                <TagGroup :tag-list="dailyTask.task.tags" :max-tag="2"></TagGroup>
                            </template>
                            <template
                                v-if="dailyTask.commonTask && dailyTask.commonTask.tags.length > 0">
                                <TagGroup :tag-list="dailyTask.commonTask.tags" :max-tag="2">
                                </TagGroup>
                            </template>
                        </div>
                    </template>
                </div>

                <div class="daily-task-form-card__actions" :class="{ 'is-hover': hover }">
                    <v-btn
                        v-if="!dailyTask.task && !dailyTask.commonTask"
                        @click="showEditMode()"
                        color="accent"
                        icon
                        small>
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>

                    <v-btn @click="deleteDailyTask()" color="error" icon small>
                        <v-icon>mdi-trash-can</v-icon>
                    </v-btn>
                </div>
            </template>

            <template v-else>
                <DailyTaskForm
                    :daily-task="dailyTask"
                    @submit="updateDailyTask($event)"
                    @close="hideEditMode()"
                    class="flex-grow-1">
                </DailyTaskForm>
            </template>
        </v-card>
    </v-hover>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { DailyTask, DailyTaskPatch, DailyUpdateTaskTab } from '@/models/daily-task.model'
import CollectionChip from '@/components/CollectionChip.vue'
import SectionChip from '@/components/SectionChip.vue'
import ProjectChip from '@/components/ProjectChip.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import DailyTaskActionChip from '@/views/daily/components/DailyTaskActionChip.vue'
import DailyTaskForm from '@/views/daily/components/DailyTaskForm.vue'

@Component({
    components: {
        DailyTaskForm,
        DailyTaskActionChip,
        ProjectChip,
        SectionChip,
        CollectionChip,
        TagGroup,
    },
})
export default class DailyTaskFormCard extends Vue {
    @Prop({ required: true }) dailyTask!: DailyTask
    @Prop({ required: true }) editMode!: boolean

    dailyTaskUpdateTabEnum = DailyUpdateTaskTab

    get name(): string {
        if (this.dailyTask.task) return this.dailyTask.task.name
        else if (this.dailyTask.commonTask) return this.dailyTask.commonTask.name
        else return this.dailyTask.name as string // We know name is defined
    }

    showEditMode(): void {
        this.$emit('show-edit-mode')
    }

    hideEditMode(): void {
        this.$emit('hide-edit-mode')
    }

    updateDailyTask(data: DailyTaskPatch): void {
        this.$emit('update', data)
    }

    deleteDailyTask(): void {
        this.$emit('delete')
    }

    select(tab: DailyUpdateTaskTab, id: number, sectionId?: number): void {
        this.$emit('select', { tab, id, sectionId })
    }
}
</script>

<style scoped lang="scss">
.daily-task-form-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;

    &__content {
        flex-grow: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        row-gap: 8px;

        &__header {
            display: flex;
            align-items: center;
            column-gap: 8px;
        }

        &__footer {
            display: flex;
            align-items: center;
            column-gap: 8px;

            &__chip {
                max-width: 10rem;
                cursor: pointer;
            }
        }
    }

    &__actions {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        column-gap: 8px;

        opacity: 0;
        transform: translateX(15px);
        transition: all 0.2s ease-in-out;

        &.is-hover {
            transform: translateX(0);
            opacity: 1;
        }
    }
}
</style>
