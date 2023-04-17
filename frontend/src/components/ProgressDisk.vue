<template>
    <v-progress-circular :value="percentage" :color="color" :rotate="-90" size="16" width="8">
    </v-progress-circular>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ProgressWheel extends Vue {
    @Prop({ default: 0 }) value!: number
    @Prop({ default: 100 }) max!: number
    @Prop({ default: 'white' }) color!: string

    get percentage(): number {
        if (this.max === 0) return 0
        return Math.round((this.value / this.max) * 100)
    }
}
</script>
