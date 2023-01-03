<template>
    <div>
        <div class="d-flex justify-end align-end mb-4">
            <h1 class="flex-grow-1 text-h3 mb-3">Collections</h1>

            <FilterChip
                :value="archived"
                @input="toggleArchivedProject()"
                color="accent"
                icon="mdi-archive"
                class="mr-3">
                Archived
            </FilterChip>

            <v-dialog v-model="collectionDialog" width="60%">
                <template #activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on">
                        <v-icon left>mdi-plus</v-icon>
                        collection
                    </v-btn>
                </template>
                <CollectionFormDialog
                    :isDialogOpen="collectionDialog"
                    @submit="createCollection"
                    @close="collectionDialog = false">
                </CollectionFormDialog>
            </v-dialog>
        </div>

        <template v-if="collectionList.length > 0">
            <v-row>
                <v-col v-for="collection in collectionList" :key="collection.id" cols="4">
                    <CollectionItemCard :collection="collection" />
                </v-col>
            </v-row>
        </template>
        <template v-else>
            <EmptyListDisplay>
                <template #img>
                    <img
                        src="../../../assets/project.svg"
                        alt="No project"
                        style="max-width: 450px" />
                </template>
                <template #message>
                    <div class="d-flex align-center" v-if="!archived">
                        <span>You don't have any collection yet !</span>
                        <v-btn @click="collectionDialog = true" small class="ml-2">
                            <v-icon left>mdi-plus</v-icon>
                            collection
                        </v-btn>
                    </div>
                    <div v-else>You don't have any archived collection</div>
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { collectionService } from '@/api/collection.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { Collection, CollectionTask } from '@/models/collection.model'
import CollectionFormDialog from '@/views/collection/components/CollectionFormDialog.vue'
import CollectionItemCard from '@/views/collection/components/CollectionItemCard.vue'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({
    components: {
        CollectionFormDialog,
        CollectionItemCard,
        EmptyListDisplay,
        FilterChip,
    },
})
export default class CollectionList extends Vue {
    @Prop({ default: false }) archived!: boolean

    collectionList: CollectionTask[] = []
    collectionDialog = false

    created(): void {
        this.retrieveCollectionList({ archived: this.archived })
    }

    @Watch('archived')
    private onArchivedProjectsChanges(value: boolean): void {
        this.retrieveCollectionList({ archived: value })
    }

    private retrieveCollectionList(params = {}): void {
        collectionService.getCollectionList(params).then(
            (response: any) => {
                this.collectionList = response.body.content
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    createCollection(collectionForm: Partial<Collection>): void {
        this.collectionDialog = false
        collectionService.createCollection(collectionForm).then(
            (response: any) => {
                this.$router.push({ name: 'collection-detail', params: { id: response.body.id } })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }

    toggleArchivedProject(): void {
        this.$router.replace({ query: { archived: (!this.archived).toString() } })
    }
}
</script>
