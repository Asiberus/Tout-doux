<template>
    <v-dialog
        :value="value"
        @input="$emit('input', $event)"
        content-class="half-dialog"
        transition="slide-x-reverse-transition">
        <slot></slot>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class HalfDialog extends Vue {
    @Prop({ required: true }) value: boolean = false
}
</script>

<style scoped lang="scss"></style>
