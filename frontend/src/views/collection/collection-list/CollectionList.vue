<template>
    <div class="d-flex flex-column h-100">
        <div class="d-flex flex-column flex-sm-row align-center gap-2 mb-3 mb-md-6">
            <MainTitle icon="mdi-list-box" class="flex-grow-1">Collections</MainTitle>

            <div class="d-flex align-center gap-2">
                <FilterChip
                    :value="archived"
                    @input="toggleArchivedProject()"
                    color="accent"
                    icon="mdi-archive">
                    Archived
                </FilterChip>

                <v-dialog
                    v-model="collectionDialog"
                    :width="getDialogWidth()"
                    :fullscreen="$vuetify.breakpoint.smAndDown">
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
            <EmptyListDisplay class="empty-list-display">
                <template #img>
                    <img
                        v-if="!archived"
                        src="../../../assets/collection-empty.svg"
                        alt="No collection"
                        class="empty-list-display__img" />
                    <img
                        v-else
                        src="../../../assets/collection-archived-empty.svg"
                        alt="No collection"
                        class="empty-list-display__img" />
                </template>
                <template #message>
                    <div class="d-flex flex-column align-center gap-2" v-if="!archived">
                        <span>You don't have any collection yet!</span>
                        <v-btn @click="collectionDialog = true">
                            <v-icon left>mdi-plus</v-icon>
                            collection
                        </v-btn>
                    </div>
                    <div v-else>You don't have any archived collection.</div>
                </template>
            </EmptyListDisplay>
        </template>
    </div>
</template>

<script lang="ts">
import { collectionService } from '@/api/collection.api'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { CollectionList, CollectionPost } from '@/models/collection.model'
import CollectionFormDialog from '@/views/collection/components/CollectionFormDialog.vue'
import CollectionCard from '@/views/collection/components/CollectionCard.vue'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import MainTitle from '@/components/MainTitle.vue'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: {
        MainTitle,
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

    createCollection(collectionForm: CollectionPost): void {
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
@import '~vuetify/src/styles/styles.sass';

.collection-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(max(288px, calc((100% - 2 * 12px) / 3)), 1fr));
    gap: 12px;

    @media #{map-get($display-breakpoints, 'md-and-up')} {
        grid-template-columns: repeat(
            auto-fill,
            minmax(max(420px, calc((100% - 2 * 12px) / 3)), 1fr)
        );
    }

    @media #{map-get($display-breakpoints, 'xl-only')} {
        grid-template-columns: repeat(
            auto-fill,
            minmax(max(500px, calc((100% - 2 * 12px) / 3)), 1fr)
        );
    }

    & > * {
        min-width: 0;
    }
}

.empty-list-display {
    flex-grow: 1;

    &__img {
        width: clamp(250px, 50%, 450px);
    }
}
</style>
