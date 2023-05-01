<template>
    <v-chip
        :to="detailLocation"
        label
        :color="collection.archived ? 'projectArchived' : 'collection'"
        :ripple="ripple"
        :small="small"
        :title="title"
        :class="{ 'cursor-default': this.collection.archived && !this.detailLocation }"
        @click="click($event)">
        <v-icon small left>mdi-list-box</v-icon>
        <div class="text-truncate">
            {{ collection.name }}
        </div>
    </v-chip>
</template>

<script lang="ts">
import { Collection } from '@/models/collection.model'
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Location } from 'vue-router'

@Component
export default class CollectionChip extends Vue {
    @Prop({ required: true }) collection!: Collection
    @Prop({ default: false }) ripple!: boolean
    @Prop({ default: false }) small!: boolean
    @Prop({ default: true }) navigateToDetail!: boolean

    get title(): string {
        let title = `Go to : ${this.collection.name}`
        if (this.collection.archived) title += ' (Archived)'
        return title
    }

    get detailLocation(): Location | undefined {
        if (!this.navigateToDetail) return
        return { name: 'collection-detail', params: { id: `${this.collection.id}` } }
    }

    click(event: Event): void {
        if (this.collection.archived) return

        this.$emit('click', event)
    }
}
</script>
