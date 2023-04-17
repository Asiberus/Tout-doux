<template>
    <v-progress-circular
        :value="percentage"
        :color="color"
        :rotate="-90"
        :size="computedSize"
        :width="computedWidth">
        <div class="progress-wheel-content" :class="[size]">
            <template v-if="mode === ProgressWheelMode.Number">
                <div>
                    <span class="value">{{ value }}</span>
                    /
                    <span class="max"> {{ max }} </span>
                </div>
                <div class="text-caption">{{ percentage }}%</div>
            </template>
            <template v-if="mode === ProgressWheelMode.Percent">
                <div>
                    <span class="value">{{ percentage }}</span>
                    <span> %</span>
                </div>
                <div class="text-caption">{{ value }} / {{ max }}</div>
            </template>
        </div>
    </v-progress-circular>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { ProgressWheelMode } from '@/models/settings.model'

@Component
export default class ProgressWheel extends Vue {
    @Prop({ default: ProgressWheelMode.Number }) mode!: ProgressWheelMode
    @Prop({ default: 0 }) value!: number
    @Prop({ default: 100 }) max!: number
    @Prop({ default: 'white' }) color!: string
    @Prop({ default: 'medium' }) size!: 'small' | 'medium' | 'large'

    ProgressWheelMode = ProgressWheelMode

    get percentage(): number {
        if (this.max === 0) return 0
        return Math.round((this.value / this.max) * 100)
    }

    get computedSize(): number {
        if (this.size === 'large') return 250
        else if (this.size === 'medium') return 200
        else return 180 // for size === 'small'
    }

    get computedWidth(): number {
        if (this.size === 'large') return 20
        else if (this.size === 'medium') return 18
        else return 15 // for size === 'small'
    }
}
</script>

<style scoped lang="scss">
.progress-wheel-content {
    display: flex;
    align-items: center;
    flex-direction: column;

    &.small {
        .value {
            font-size: 2.5rem;
        }
    }

    &.medium {
        .value {
            font-size: 3rem;
        }
    }

    &.large {
        .value {
            font-size: 3.5rem;
        }
    }

    .max {
        display: inline-block;
        transform: translateY(0.3rem);
    }
}
</style>
