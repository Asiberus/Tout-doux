<template>
    <v-chip
        :color="tag.color"
        :small="small || xSmall"
        :close="clearable && !disabled"
        :disabled="disabled"
        :class="{ small, 'x-small': xSmall }"
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
    @Prop({ default: false }) disabled!: boolean

    emitClearEvent(): void {
        this.$emit('clear', this.tag.id)
    }
}
</script>

<style scoped lang="scss">
.v-chip {
    cursor: inherit;

    &:hover::before {
        opacity: 0 !important;
    }

    &.small {
        height: 20px !important;
    }

    &.x-small {
        height: 18px !important;
    }
}
</style>
