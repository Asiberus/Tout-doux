<template>
    <v-card
        rounded
        :to="{ name: 'collection-detail', params: { id: collection.id } }"
        :color="collection.archived ? 'collectionArchived' : null"
        :ripple="false">
        <v-progress-linear :value="percentageOfCompletedTask" color="green accent-2" height="6">
        </v-progress-linear>
        <v-card-text class="d-flex justify-space-between align-center">
            <div class="flex-shrink-1 overflow-hidden">
                <p
                    class="text-h5 white--text font-weight-bold text-ellipsis mb-1"
                    :title="collection.name">
                    {{ collection.name }}
                </p>
                <p class="mb-0 ml-2 text-ellipsis" :title="collection.description">
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
import { Task } from '@/models/task.model'
import { CollectionListModel, CollectionDetail } from '@/models/collection.model'

@Component
export default class CollectionItemCard extends Vue {
    @Prop() private collection!: CollectionListModel

    get percentageOfCompletedTask(): number {
        return (this.collection.completedTaskCount / this.collection.taskCount) * 100
    }
}
</script>

<style scoped lang="scss"></style>
