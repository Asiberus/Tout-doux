<template>
    <div>
        <template v-if="editable">
            <v-menu offset-y offset-overflow>
                <template #activator="{ on, attrs }">
                    <v-chip v-bind="attrs" v-on="on" small class="rounded-lg" :color="color">
                        <template v-if="action">
                            <span class="font-weight-bold" :class="textColor">{{ text }}</span>
                        </template>
                        <template v-else>
                            <v-icon small>mdi-bullseye-arrow</v-icon>
                        </template>
                    </v-chip>
                </template>
                <v-list>
                    <v-list-item
                        v-for="action in dailyTaskActionItems"
                        :key="action.value"
                        @click="updateAction(action.value)"
                        dense>
                        <span :class="{ 'font-italic grey--text': !action.value }">
                            {{ action.text }}
                        </span>
                    </v-list-item>
                </v-list>
            </v-menu>
        </template>
        <template v-else>
            <v-chip :color="color" small class="rounded-lg">
                <span class="font-weight-bold" :class="textColor">{{ text }}</span>
            </v-chip>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { DailyTaskAction } from '@/models/daily-task.model'
import {
    actionOptions,
    getActionChipColor,
    getActionChipTextColor,
    getLiteralFormOfDailyActionEnum,
} from '@/utils/daily-task.utils'

@Component
export default class DailyTaskActionChip extends Vue {
    @Prop({ required: true }) action!: DailyTaskAction | null
    @Prop({ default: false }) editable!: boolean

    dailyTaskActionItems = actionOptions

    get text(): string {
        return this.action ? getLiteralFormOfDailyActionEnum(this.action) : ''
    }

    get color(): string {
        return this.action ? getActionChipColor(this.action) : ''
    }

    get textColor(): string {
        return this.action ? getActionChipTextColor(this.action) : ''
    }

    updateAction(action: DailyTaskAction | null): void {
        this.$emit('update', action)
        this.$emit('update:action', action) // We send both event to meet all possibilities
    }
}
</script>
