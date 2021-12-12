<template>
    <div>
        <div class="d-flex justify-end align-end mb-4">
            <h1 class="flex-grow-1 text-h3 mb-3">Collections</h1>

            <v-chip class="mr-3" :color="archived ? 'accent' : null" @click="toggleArchivedProject">
                <v-icon v-if="archived" small class="mr-1"> mdi-archive </v-icon>
                <v-icon v-else small class="mr-1"> mdi-checkbox-blank-outline </v-icon>
                Archived
            </v-chip>
            <v-dialog v-model="collectionDialog" width="60%">
                <template #activator="{ on, attrs }">
                    <v-btn v-bind="attrs" v-on="on">
                        <v-icon left>mdi-plus</v-icon>
                        Add a collection
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
                            add a collection
                        </v-btn>
                    </div>
                    <div v-else>You don't have any archived collection</div>
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { collectionService } from '@/api/collection.api'
import CollectionFormDialog from '@/views/collection/components/CollectionFormDialog.vue'
import CollectionItemCard from '@/views/collection/components/CollectionItemCard.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { Collection, CollectionTask } from '@/models/collection.model'

@Component({
    components: {
        CollectionFormDialog,
        CollectionItemCard,
        EmptyListDisplay,
    },
})
export default class CollectionList extends Vue {
    @Prop() archived: boolean = false
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
                // Add router push to collection detail
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

<style scoped lang="scss"></style>
