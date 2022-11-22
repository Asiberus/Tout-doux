<template>
    <v-dialog
        :value="value"
        fullscreen
        @input="$emit('input', $event)"
        content-class="half-dialog"
        transition="slide-x-reverse-transition">
        <slot></slot>
    </v-dialog>
</template>

<script lang="ts">
import { hideScroll } from '@/utils/document.utils'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class HalfDialog extends Vue {
    @Prop({ required: true }) value: boolean = false

    @Watch('value')
    private onValueChanges(value: boolean): void {
        if (value) hideScroll()
    }
}
</script>

<style scoped lang="scss"></style>
