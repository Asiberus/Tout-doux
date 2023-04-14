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
            <div class="collection-wrapper">
                <CollectionCard
                    v-for="collection in collectionList"
                    :key="collection.id"
                    :collection="collection" />
            </div>
        </template>
        <template v-else>
            <EmptyListDisplay>
                <template #img>
                    <img
                        src="../../../assets/project.svg"
                        alt="No collection"
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
import { CollectionList, CollectionPostOrPatch } from '@/models/collection.model'
import CollectionFormDialog from '@/views/collection/components/CollectionFormDialog.vue'
import CollectionCard from '@/views/collection/components/CollectionCard.vue'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({
    components: {
        CollectionFormDialog,
        CollectionCard,
        EmptyListDisplay,
        FilterChip,
    },
})
export default class CollectionListComponent extends Vue {
    @Prop({ default: false }) archived!: boolean

    collectionList: CollectionList[] = []
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

    createCollection(collectionForm: CollectionPostOrPatch): void {
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

<style scoped lang="scss">
.collection-wrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    & > * {
        min-width: 0;
    }
}
</style>
