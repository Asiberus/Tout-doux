<template>
    <v-chip :color="tag.color" :small="small" :close="clearable" @click:close="emitClearEvent()">{{
        tag.name
    }}</v-chip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Tag } from '@/models/tag.model'

@Component
export default class TagChip extends Vue {
    @Prop({ required: true }) readonly tag!: Tag
    @Prop({ default: false }) readonly small!: boolean
    @Prop({ default: false }) readonly clearable!: boolean

    emitClearEvent(): void {
        this.$emit('clear', this.tag.id)
    }
}
</script>
