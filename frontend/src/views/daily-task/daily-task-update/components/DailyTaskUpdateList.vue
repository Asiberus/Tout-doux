<template>
    <div>
        <div class="d-flex justify-space-between align-center mb-3">
            <h2>Tasks of the day</h2>
            <v-btn
                @click="createDailyTaskDisplayed = !createDailyTaskDisplayed"
                icon
                :color="createDailyTaskDisplayed ? 'accent' : null">
                <v-icon>mdi-plus</v-icon>
            </v-btn>
        </div>

        <template v-if="dailyTaskList.length">
            <template v-for="dailyTask in dailyTaskList">
                <v-hover v-slot="{ hover }" :key="'daily-task' + dailyTask.id + dailyTask.name">
                    <v-card class="daily-task-card mb-3">
                        <v-card-text>
                            <template v-if="!dailyTask.editMode">
                                <div class="d-flex align-center">
                                    <v-menu>
                                        <template #activator="{ on, attrs }">
                                            <v-chip
                                                v-bind="attrs"
                                                v-on="on"
                                                class="mr-3"
                                                :color="getActionChipColor(dailyTask.action)">
                                                <template v-if="dailyTask.action">
                                                    {{
                                                        getLiteralFormOfDailyActionEnum(
                                                            dailyTask.action
                                                        )
                                                    }}
                                                </template>
                                                <!--                    <template v-else><v-icon>mdi-playlist-check</v-icon></template>-->
                                                <template v-else>
                                                    <v-icon>mdi-nut</v-icon>
                                                    <!--                          <v-icon>mdi-checkbox-multiple-marked-circle</v-icon>-->
                                                    <!--                          <v-icon>mdi-notification-clear-all</v-icon>-->
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
                                                    }"
                                                    >{{ action.text }}</span
                                                >
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>

                                    <div class="flex-grow-1 d-flex align-center">
                                        <template v-if="dailyTask.taskId">
                                            <h4 class="white--text font-weight-regular">
                                                {{ dailyTask.task.name }}
                                            </h4>
                                        </template>
                                        <template v-else>
                                            <h4 class="white--text font-weight-regular">
                                                {{ dailyTask.name }}
                                            </h4>
                                        </template>
                                    </div>

                                    <v-slide-x-reverse-transition>
                                        <div v-if="hover" class="daily-task-card-actions">
                                            <v-btn
                                                v-if="!dailyTask.taskId"
                                                @click="toggleDailyTaskEditMode(dailyTask, true)"
                                                icon
                                                small
                                                color="accent">
                                                <v-icon>mdi-pencil</v-icon>
                                            </v-btn>

                                            <v-btn
                                                @click="deleteDailyTask(dailyTask.id)"
                                                icon
                                                color="error"
                                                small
                                                class="ml-3">
                                                <v-icon>mdi-trash-can</v-icon>
                                            </v-btn>
                                        </div>
                                    </v-slide-x-reverse-transition>
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
        </template>
        <template v-else>
            <EmptyListDisplay message="You didn't add any task yet!">
                <template #img>
                    <img src="../../../../assets/no_tasks.svg" alt="No tasks" height="300" />
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { DailyTaskActionEnum, DailyTaskDisplayModel } from '@/models/daily-task.model'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'

// todo : maybe change v-hover on daily task card
@Component({
    components: {
        EmptyListDisplay,
    },
})
export default class DailyTaskUpdateList extends Vue {
    @Prop() dailyTaskList: DailyTaskDisplayModel[] = []
    createDailyTaskDisplayed = false
    dailyTaskForm = {
        valid: false,
        data: {
            name: '',
        },
        rules: {
            name: [
                (value: string) => !!value || 'Daily task name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
        },
    }

    private dailyTaskActionEnum = DailyTaskActionEnum

    get dailyTaskActionItems(): { text: string | null; value: DailyTaskActionEnum | null }[] {
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
            const newDailyTask = {} as DailyTaskDisplayModel
            this.dailyTaskList.push(newDailyTask)
            this.toggleDailyTaskEditMode(newDailyTask, true)
        } else {
            if (!this.dailyTaskList[this.dailyTaskList.length - 1].id) {
                this.dailyTaskList.pop()
            }
        }
    }

    // Todo : move this function to a better place
    // Todo : define color for dailytask action chip
    private getLiteralFormOfDailyActionEnum(action: DailyTaskActionEnum): string | null {
        switch (action) {
            case DailyTaskActionEnum.THINK:
                return 'Réfléchir'
            case DailyTaskActionEnum.WORK:
                return 'Travailler'
            case DailyTaskActionEnum.FINISH:
                return 'Finir'
            default:
                return null
        }
    }

    getActionChipColor(action: DailyTaskActionEnum): string {
        switch (action) {
            case DailyTaskActionEnum.THINK:
                return 'teal'
            case DailyTaskActionEnum.WORK:
                return 'purple'
            case DailyTaskActionEnum.FINISH:
                return 'red'
        }
    }

    toggleDailyTaskEditMode(dailyTask: DailyTaskDisplayModel, value: boolean): void {
        if (!dailyTask.id) {
            if (value) {
                this.dailyTaskForm.data.name = ''
            } else {
                this.createDailyTaskDisplayed = false
            }
        } else {
            if (value) {
                this.dailyTaskList.forEach((d: DailyTaskDisplayModel) => (d.editMode = false))
                this.dailyTaskForm.data.name = dailyTask.name ?? ''
            }
        }

        dailyTask.editMode = value
    }

    handleDailyTaskFormSubmit(dailyTaskId: number): void {
        if (dailyTaskId) {
            this.$emit('updateDailyTask', dailyTaskId, this.dailyTaskForm.data)
        } else {
            this.createDailyTaskDisplayed = false
            this.$emit('createDailyTask', this.dailyTaskForm.data)
        }
    }

    updateDailyTaskAction(dailyTaskId: number, action: DailyTaskActionEnum | null): void {
        this.$emit('updateDailyTask', dailyTaskId, { action })
    }

    deleteDailyTask(dailyTaskId: number): void {
        this.$emit('deleteDailyTask', dailyTaskId)
    }
}
</script>

<style scoped lang="scss">
.daily-task-wrapper {
    max-height: 45rem;
    overflow: auto;

    .daily-task-card {
        //&:hover .daily-task-card-actions {
        //  opacity: 1;
        //  transform: translateX(0);
        //}

        //.daily-task-card-actions {
        //  opacity: 0;
        //  transform: translateX(10px);
        //  transition: all .15s ease-in;
        //}
    }
}
</style>
