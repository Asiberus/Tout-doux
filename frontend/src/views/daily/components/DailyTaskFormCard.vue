<template>
    <v-hover v-slot="{ hover }">
        <v-card class="daily-task-form-card rounded-lg">
            <template v-if="!editMode && dailyTask">
                <div class="daily-task-form-card__content">
                    <div class="daily-task-form-card__content__header">
                        <DailyTaskActionChip
                            :action="dailyTask.action"
                            :editable="true"
                            @update="updateDailyTaskAction($event)"
                            class="flex-shrink-0">
                        </DailyTaskActionChip>

                        <h4
                            class="text-body-1 font-weight-medium text-truncate"
                            :title="dailyTaskName">
                            {{ dailyTaskName }}
                        </h4>
                    </div>
                    <template
                        v-if="dailyTask.task || dailyTask.commonTask || dailyTask.tags.length > 0">
                        <div class="daily-task-form-card__content__footer">
                            <template v-if="dailyTask.task">
                                <ProjectChip
                                    v-if="dailyTask.task.project"
                                    :project="dailyTask.task.project"
                                    :small="true"
                                    :navigate-to-detail="false"
                                    @click.native="
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
                                    @click.native="
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
                                    @click.native="
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
                        @click="selectDailyTask()"
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
                <v-form
                    ref="form"
                    v-model="dailyTaskForm.valid"
                    @submit.prevent="handleFormSubmit()"
                    class="flex-grow-1">
                    <v-text-field
                        v-model="dailyTaskForm.data.name"
                        :rules="dailyTaskForm.rules.name"
                        label="Name"
                        counter="50"
                        maxlength="50"
                        required
                        autofocus
                        class="mb-2">
                    </v-text-field>

                    <TagSearch :selected-tags.sync="tagList" type="task" class="mb-5"></TagSearch>
                    <div class="tag-wrapper mb-2">
                        <TagChip
                            v-for="tag of tagList"
                            :key="tag.id"
                            :tag="tag"
                            clearable
                            @clear="removeTag($event)">
                        </TagChip>
                    </div>

                    <v-card-actions class="justify-end">
                        <v-btn
                            color="success"
                            text
                            small
                            :disabled="!dailyTaskForm.valid"
                            @click="handleFormSubmit()">
                            {{ dailyTask ? 'update' : 'create' }}
                        </v-btn>
                        <v-btn plain small @click="unselectDailyTask()">cancel</v-btn>
                    </v-card-actions>
                </v-form>
            </template>
        </v-card>
    </v-hover>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import {
    DailyTask,
    DailyTaskAction,
    DailyTaskPatch,
    DailyUpdateTaskTab,
} from '@/models/daily-task.model'
import CollectionChip from '@/components/CollectionChip.vue'
import SectionChip from '@/components/SectionChip.vue'
import ProjectChip from '@/components/ProjectChip.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import { Form } from '@/models/common.model'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import { Tag } from '@/models/tag.model'
import DailyTaskActionChip from '@/views/daily/components/DailyTaskActionChip.vue'

@Component({
    components: {
        DailyTaskActionChip,
        ProjectChip,
        SectionChip,
        CollectionChip,
        TagGroup,
        TagSearch,
        TagChip,
    },
})
export default class DailyTaskFormCard extends Vue {
    @Prop({ default: null }) dailyTask!: DailyTask | null
    @Prop({ required: true }) editMode!: boolean

    tagList: Tag[] = []
    dailyTaskForm: Form<DailyTaskPatch> = {
        valid: false,
        data: {
            name: '',
            tagIds: [],
        },
        rules: {
            name: [
                (value: string) => !!value || 'Daily task name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
        },
    }

    dailyTaskUpdateTabEnum = DailyUpdateTaskTab

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get dailyTaskName(): string | undefined {
        if (!this.dailyTask) return

        if (this.dailyTask.task) return this.dailyTask.task.name
        else if (this.dailyTask.commonTask) return this.dailyTask.commonTask.name
        else return this.dailyTask.name
    }

    @Watch('editMode')
    private onEditModeChanges(value: boolean): void {
        if (!value || !this.dailyTask) return

        this.dailyTaskForm.data = {
            name: this.dailyTask.name,
            tagIds: this.dailyTask.tags.map(({ id }) => id),
        }
        this.tagList = this.dailyTask.tags

        // We need to render the form to use resetValidation
        this.$nextTick(() => {
            this.form.resetValidation()
        })
    }

    @Watch('tagList')
    private onTagListChanges(value: Tag[]): void {
        this.dailyTaskForm.data.tagIds = value.map(({ id }) => id)
    }

    selectDailyTask(): void {
        this.$emit('show-edit-mode')
    }

    unselectDailyTask(): void {
        this.$emit('hide-edit-mode')
    }

    handleFormSubmit(): void {
        if (this.dailyTask) {
            this.$emit('update', this.dailyTaskForm.data)
        } else {
            this.$emit('create', this.dailyTaskForm.data)
        }
    }

    updateDailyTaskAction(action: DailyTaskAction | null): void {
        this.$emit('update', { action })
    }

    deleteDailyTask(): void {
        this.$emit('delete')
    }

    removeTag(id: number): void {
        this.tagList = this.tagList.filter(tag => tag.id !== id)
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

.tag-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
</style>
