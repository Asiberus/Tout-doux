<template>
    <v-card class="daily-task-form-card rounded-lg">
        <template v-if="!editMode && dailyTask">
            <div class="daily-task-form-card__content">
                <div class="daily-task-form-card__actions">
                    <v-menu offset-y>
                        <template #activator="{ attrs, on }">
                            <v-btn
                                v-bind="attrs"
                                v-on="on"
                                small
                                plain
                                color="white"
                                class="daily-task-form-card__actions__btn">
                                <v-icon small>mdi-dots-vertical</v-icon>
                            </v-btn>
                        </template>
                        <v-list dense>
                            <v-list-item
                                v-if="!dailyTask.task && !dailyTask.commonTask"
                                @click="showEditMode()">
                                <v-icon small left color="accent">mdi-pencil</v-icon>
                                <v-list-item-title>Edit</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="deleteDailyTask()">
                                <v-icon small left color="error">mdi-trash-can</v-icon>
                                <v-list-item-title>Delete</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </div>

                <div class="daily-task-form-card__content__header">
                    <DailyTaskActionChip
                        :action="dailyTask.action"
                        :editable="true"
                        @update="updateDailyTask({ action: $event })"
                        class="flex-shrink-0">
                    </DailyTaskActionChip>

                    <h4 class="text-body-2 text-sm-body-1 font-weight-medium" :title="name">
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
@import '~vuetify/src/styles/styles.sass';

.daily-task-form-card {
    display: flex;
    align-items: center;
    gap: 8px;

    padding: 12px 20px 12px 12px;

    &__actions {
        position: absolute;
        top: 4px;
        right: 4px;
        display: flex;
        align-items: center;
        column-gap: 8px;

        &__btn {
            min-width: 0 !important;
            padding: 0 !important;
        }
    }

    &__content {
        flex-grow: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        row-gap: 8px;

        &__header {
            display: flex;
            align-items: baseline;
            column-gap: 8px;
        }

        &__footer {
            display: flex;
            align-items: center;
            column-gap: 8px;

            &__chip {
                flex-shrink: 1;
                max-width: 10rem;
                cursor: pointer;
            }
        }
    }
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
    .daily-task-form-card {
        padding: 16px 24px 16px 16px;

        &__actions {
            right: 8px;
        }
    }
}
</style>
