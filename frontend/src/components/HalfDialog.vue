<template>
    <v-dialog
        :value="value"
        @input="$emit('input', $event)"
        content-class="half-dialog"
        :transition="
            $vuetify.breakpoint.width < 400
                ? 'dialog-bottom-transition'
                : 'slide-x-reverse-transition'
        ">
        <slot></slot>
    </v-dialog>
</template>

<script lang="ts">
import { hideScroll, showScroll } from '@/utils/document.utils'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class HalfDialog extends Vue {
    @Prop({ required: true }) value!: boolean

    @Watch('value')
    private onValueChanges(value: boolean): void {
        if (value) hideScroll()
        else showScroll()
    }
}
</script>
