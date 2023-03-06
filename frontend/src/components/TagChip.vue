<template>
    <v-chip :color="tag.color">{{ tag.name }}</v-chip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Tag } from '@/models/tag.model'

@Component
export default class TagChip extends Vue {
    @Prop({ required: true }) tag!: Tag
}
</script>
