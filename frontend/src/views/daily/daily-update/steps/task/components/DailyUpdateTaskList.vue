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
                <template v-for="dailyTask in dailyTaskList">
                    <v-hover
                        v-slot="{ hover }"
                        :key="'daily-task-' + dailyTask.id + dailyTask.name">
                        <v-card>
                            <v-card-text>
                                <template v-if="!dailyTask.editMode">
                                    <div class="d-flex align-center">
                                        <v-menu>
                                            <template #activator="{ on, attrs }">
                                                <v-chip
                                                    v-bind="attrs"
                                                    v-on="on"
                                                    class="mr-3 flex-shrink-0"
                                                    :color="getActionChipColor(dailyTask.action)">
                                                    <template v-if="dailyTask.action">
                                                        {{
                                                            getLiteralFormOfDailyActionEnum(
                                                                dailyTask.action
                                                            )
                                                        }}
                                                    </template>
                                                    <template v-else>
                                                        <v-icon>mdi-nut</v-icon>
                                                    </template>
                                                </v-chip>
                                            </template>
                                            <v-list>
                                                <v-list-item
                                                    v-for="action in dailyTaskActionItems"
                                                    :key="action.value"
                                                    @click="
                                                        updateDailyTaskAction(
                                                            dailyTask.id,
                                                            action.value
                                                        )
                                                    "
                                                    dense>
                                                    <span
                                                        :class="{
                                                            'font-italic grey--text': !action.value,
                                                        }">
                                                        {{ action.text }}
                                                    </span>
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>

                                        <h4
                                            class="
                                                white--text
                                                font-weight-regular
                                                text-ellipsis
                                                mr-3
                                            "
                                            :title="getDailyTaskName(dailyTask)">
                                            {{ getDailyTaskName(dailyTask) }}
                                        </h4>

                                        <template v-if="dailyTask.task">
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
                                                    class="daily-task-chip">
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
                                                    class="daily-task-chip">
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
                                                    class="daily-task-chip">
                                                </CollectionChip>
                                            </template>
                                        </template>

                                        <v-spacer></v-spacer>

                                        <div
                                            class="daily-actions flex-shrink-0"
                                            :class="{ 'is-hover': hover }">
                                            <v-btn
                                                v-if="!dailyTask.task && !dailyTask.commonTask"
                                                @click="toggleDailyTaskEditMode(dailyTask, true)"
                                                icon
                                                small
                                                color="accent">
                                                <v-icon>mdi-pencil</v-icon>
                                            </v-btn>

                                            <v-btn
                                                @click="deleteDailyTask(dailyTask.id)"
                                                icon
                                                small
                                                color="error"
                                                class="ml-3">
                                                <v-icon>mdi-trash-can</v-icon>
                                            </v-btn>
                                        </div>
                                    </div>
                                </template>

                                <template v-else>
                                    <v-form
                                        v-model="dailyTaskForm.valid"
                                        @submit.prevent="handleDailyTaskFormSubmit(dailyTask.id)">
                                        <v-row align-content="center">
                                            <v-col>
                                                <v-text-field
                                                    v-model="dailyTaskForm.data.name"
                                                    :rules="dailyTaskForm.rules.name"
                                                    label="Name"
                                                    counter="50"
                                                    maxlength="50"
                                                    required
                                                    autofocus>
                                                </v-text-field>
                                            </v-col>
                                        </v-row>
                                        <v-card-actions class="d-flex justify-end">
                                            <v-btn
                                                color="success"
                                                text
                                                small
                                                :disabled="!dailyTaskForm.valid"
                                                @click="handleDailyTaskFormSubmit(dailyTask.id)">
                                                {{ dailyTask.id ? 'update' : 'create' }}
                                            </v-btn>
                                            <v-btn
                                                plain
                                                small
                                                class="ml-2"
                                                @click="toggleDailyTaskEditMode(dailyTask, false)">
                                                cancel
                                            </v-btn>
                                        </v-card-actions>
                                    </v-form>
                                </template>
                            </v-card-text>
                        </v-card>
                    </v-hover>
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
import CollectionChip from '@/components/CollectionChip.vue'
import ProjectChip from '@/components/ProjectChip.vue'
import SectionChip from '@/components/SectionChip.vue'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import {
    DailyTask,
    DailyTaskActionEnum,
    DailyTaskDisplay,
    DailyUpdateTaskTab,
} from '@/models/daily-task.model'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { getActionChipColor, getLiteralFormOfDailyActionEnum } from '@/utils/daily-task.utils'

// todo : maybe change v-hover on daily task card
@Component({ components: { EmptyListDisplay, ProjectChip, SectionChip, CollectionChip } })
export default class DailyUpdateTaskList extends Vue {
    @Prop() dailyTaskList!: DailyTaskDisplay[]

    createDailyTaskDisplayed = false
    dailyTaskForm = {
        valid: false,
        data: { name: '' },
        rules: {
            name: [
                (value: string) => !!value || 'Daily task name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
        },
    }

    private dailyTaskActionEnum = DailyTaskActionEnum
    dailyTaskUpdateTabEnum = DailyUpdateTaskTab

    get dailyTaskActionItems(): { value: DailyTaskActionEnum | null; text: string }[] {
        return [
            { value: null, text: 'No action' },
            {
                value: this.dailyTaskActionEnum.THINK,
                text: this.getLiteralFormOfDailyActionEnum(DailyTaskActionEnum.THINK),
            },
            {
                value: this.dailyTaskActionEnum.WORK,
                text: this.getLiteralFormOfDailyActionEnum(DailyTaskActionEnum.WORK),
            },
            {
                value: this.dailyTaskActionEnum.FINISH,
                text: this.getLiteralFormOfDailyActionEnum(DailyTaskActionEnum.FINISH),
            },
        ]
    }

    @Watch('createDailyTaskDisplayed')
    private onCreateDailyTaskDisplayedChanges(value: boolean): void {
        if (value) {
            const newDailyTask = {} as DailyTaskDisplay
            this.dailyTaskList.push(newDailyTask)
            this.toggleDailyTaskEditMode(newDailyTask, true)
        } else {
            // TODO : We should handle create daily task card differently : as a whole different object, and not a item at the end the dailyTaskList.
            this.$emit(
                'update:dailyTaskList',
                this.dailyTaskList.filter(({ id }) => id != undefined)
            )
        }
    }

    getLiteralFormOfDailyActionEnum(action: DailyTaskActionEnum): string {
        return getLiteralFormOfDailyActionEnum(action)
    }

    getActionChipColor(action: DailyTaskActionEnum): string {
        return getActionChipColor(action)
    }

    toggleDailyTaskEditMode(dailyTask: DailyTaskDisplay, value: boolean): void {
        this.dailyTaskList.forEach((d: DailyTaskDisplay) => (d.editMode = false))
        if (!dailyTask.id) {
            if (value) {
                this.dailyTaskForm.data.name = ''
            } else {
                this.createDailyTaskDisplayed = false
            }
        } else {
            if (value) {
                this.createDailyTaskDisplayed = false
                this.dailyTaskForm.data.name = dailyTask.name ?? ''
            }
        }

        dailyTask.editMode = value
    }

    handleDailyTaskFormSubmit(dailyTaskId: number): void {
        if (dailyTaskId) {
            this.$emit('update-daily-task', dailyTaskId, this.dailyTaskForm.data)
        } else {
            this.createDailyTaskDisplayed = false
            this.$emit('create-daily-task', this.dailyTaskForm.data)
        }
    }

    updateDailyTaskAction(dailyTaskId: number, action: DailyTaskActionEnum | null): void {
        this.$emit('update-daily-task', dailyTaskId, { action })
    }

    deleteDailyTask(dailyTaskId: number): void {
        this.$emit('delete-daily-task', dailyTaskId)
    }

    select(type: DailyUpdateTaskTab, id: number, sectionId?: number): void {
        this.$emit('select', type, id, sectionId)
    }

    getDailyTaskName(dailyTask: DailyTask): string {
        if (dailyTask.task) return dailyTask.task.name
        else if (dailyTask.commonTask) return dailyTask.commonTask.name
        else return dailyTask.name as string // We know name is defined
    }
}
</script>

<style scoped lang="scss">
.daily-task-wrapper {
    flex: 1 0 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.daily-task-chip {
    max-width: 15rem;
    flex-shrink: 2;
    cursor: pointer;
}

.daily-actions {
    opacity: 0;
    transform: translateX(15px);
    transition: all 0.2s ease-in-out;

    &.is-hover {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
