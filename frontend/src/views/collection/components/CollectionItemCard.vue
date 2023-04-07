<template>
    <v-card
        rounded
        :to="{ name: 'collection-detail', params: { id: collection.id } }"
        :color="collection.archived ? 'collectionArchived' : null"
        :ripple="false">
        <v-progress-linear
            :value="percentageOfCompletedTask"
            color="collection lighten-2"
            height="6">
        </v-progress-linear>
        <v-card-text class="d-flex justify-space-between align-center">
            <div class="flex-shrink-1 overflow-hidden">
                <h5
                    class="text-h5 white--text font-weight-bold text-truncate"
                    :title="collection.name">
                    {{ collection.name }}
                </h5>
                <p class="text-subtitle-1 text-truncate mb-0" :title="collection.description">
                    {{ collection.description }}
                </p>
            </div>

            <div class="px-3 flex-shrink-0">
                <span style="font-size: 2.5em" class="white--text">{{
                    collection.completedTaskCount
                }}</span>
                /
                <span style="font-size: 1.5em; transform: translateY(0.3em); display: inline-block">
                    {{ collection.taskCount }}
                </span>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { CollectionList } from '@/models/collection.model'

@Component
export default class CollectionItemCard extends Vue {
    @Prop() private collection!: CollectionList

    get percentageOfCompletedTask(): number {
        return (this.collection.completedTaskCount / this.collection.taskCount) * 100
    }
}
</script>
