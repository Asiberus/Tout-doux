<template>
    <v-chip
        :color="tag.color"
        :small="small || xSmall"
        :close="clearable"
        :class="{ 'x-small': xSmall }"
        @click:close="emitClearEvent()">
        {{ tag.name }}
    </v-chip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Tag } from '@/models/tag.model'

@Component
export default class TagChip extends Vue {
    @Prop({ required: true }) tag!: Tag
    @Prop({ default: false }) small!: boolean
    @Prop({ default: false }) xSmall!: boolean
    @Prop({ default: false }) clearable!: boolean

    emitClearEvent(): void {
        this.$emit('clear', this.tag.id)
    }
}
</script>

<style scoped lang="scss">
.v-chip.x-small {
    height: 20px !important;
}
</style>
