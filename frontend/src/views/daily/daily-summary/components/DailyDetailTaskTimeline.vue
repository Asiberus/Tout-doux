<template>
    <div>
        <h4 class="text-h5 text-lg-h4">
            Tasks
            <v-chip small color="grey darken-3">
                {{ numberOfDailyTaskCompleted }}
                /
                {{ dailyTaskList.length }}
            </v-chip>
        </h4>
        <p class="text-subtitle-1 grey--text text--lighten-1">
            {{ taskText }}
        </p>

        <v-timeline dense>
            <v-timeline-item
                v-for="dailyTask in dailyTaskList"
                :key="`daily-task-${dailyTask.id}`"
                fill-dot
                :small="$vuetify.breakpoint.xsOnly"
                :color="dailyTask.completed ? 'green darken-2' : null">
                <template #icon>
                    <div v-ripple @click="toggleDailyTask(dailyTask)" class="icon-wrapper">
                        <v-icon v-if="dailyTask.completed" :small="$vuetify.breakpoint.xsOnly">
                            mdi-check
                        </v-icon>
                        <v-icon v-else :small="$vuetify.breakpoint.xsOnly">mdi-trophy</v-icon>
                    </div>
                </template>
                <DailyTaskCard :daily-task="dailyTask" @toggle="toggleDailyTask(dailyTask)">
                </DailyTaskCard>
            </v-timeline-item>
        </v-timeline>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import DailyTaskCard from '@/views/daily/components/DailyTaskCard.vue'
import { DailyTask } from '@/models/daily-task.model'
import moment from 'moment/moment'

@Component({ components: { DailyTaskCard } })
export default class DailyDetailTaskTimeline extends Vue {
    @Prop({ required: true }) date!: string
    @Prop({ required: true }) dailyTaskList!: DailyTask[]

    get isToday(): boolean {
        return moment().isSame(this.date, 'day')
    }

    get numberOfDailyTaskCompleted(): number {
        return this.dailyTaskList.filter(dailyTask => dailyTask.completed).length
    }

    get numberOfDailyTaskUncompleted(): number {
        return this.dailyTaskList.filter(dailyTask => !dailyTask.completed).length
    }

    get taskText(): string {
        if (this.isToday) {
            if (this.numberOfDailyTaskUncompleted > 0)
                return `You have ${this.numberOfDailyTaskUncompleted} ${
                    this.numberOfDailyTaskUncompleted > 1 ? 'tasks' : 'task'
                } left to do today!`
            else return 'All tasks done for today! :)'
        } else {
            if (this.numberOfDailyTaskCompleted === this.dailyTaskList.length)
                return 'All tasks completed for that day! :)'
            else if (this.numberOfDailyTaskCompleted > 0)
                return `${this.numberOfDailyTaskCompleted} on ${this.dailyTaskList.length} tasks were completed that day`
            else return 'No tasks completed that day :('
        }
    }

    toggleDailyTask(dailyTask: DailyTask): void {
        this.$emit('toggle-daily-task', dailyTask)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.v-timeline {
    padding-top: 0;

    --bar-left: 48px;
    --divider-width: 96px;
    --divider-justify-content: center;

    @media #{map-get($display-breakpoints, 'xs-only')} {
        --bar-left: 11px;
        --divider-width: 40px;
        --divider-justify-content: flex-start;
    }

    @media #{map-get($display-breakpoints, 'sm-only')} {
        --bar-left: 18px;
        --divider-width: 55px;
        --divider-justify-content: flex-start;
    }

    &::before {
        top: 36px;
        left: var(--bar-left) !important;
        height: calc(100% - 60px);
    }

    .v-timeline-item {
        @media #{map-get($display-breakpoints, 'xs-only')} {
            padding-bottom: 16px;
        }

        &:last-child {
            padding-bottom: 0;
        }

        &::v-deep .v-timeline-item__body {
            max-width: calc(100% - var(--divider-width));
        }

        &::v-deep .v-timeline-item__divider {
            min-width: var(--divider-width);
            justify-content: var(--divider-justify-content);
        }
    }

    .icon-wrapper {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
    }
}
</style>
