<template>
    <v-chip
        :to="detailLocation"
        label
        :color="collection.archived ? 'projectArchived' : 'collection'"
        :ripple="ripple"
        :small="small"
        :title="title">
        <v-icon v-if="collection.archived" small left>mdi-archive</v-icon>

        <div class="text-ellipsis">
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
}
</script>
