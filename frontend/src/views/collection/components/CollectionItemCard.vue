<template>
    <v-card
        rounded
        :to="{ name: 'collection-detail', params: { id: collection.id } }"
        :color="collection.archived ? 'collectionArchived' : null">
        <v-progress-linear :value="percentageOfTaskCompleted" color="green accent-2" height="6">
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
                <span style="font-size: 2.5em" class="white--text">{{ tasksCompleted }}</span>
                /
                <span style="font-size: 1.5em; transform: translateY(0.3em); display: inline-block">
                    {{ collection.tasks.length }}
                </span>
            </div>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Task } from '@/models/task.model'
import ellipsisFilter from '@/filters/ellipsis.filter'
import { CollectionTask } from '@/models/collection.model'

@Component
export default class CollectionItemCard extends Vue {
    @Prop() private collection!: CollectionTask

    get tasksCompleted(): number {
        return this.collection.tasks.filter((task: Task) => task.completed).length
    }

    get percentageOfTaskCompleted(): number {
        return (this.tasksCompleted / this.collection.tasks.length) * 100
    }
}
</script>

<style scoped lang="scss"></style>
