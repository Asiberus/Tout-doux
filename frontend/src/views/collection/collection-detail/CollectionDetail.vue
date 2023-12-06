<template>
    <div v-if="collection" class="d-flex flex-column h-100">
        <div class="d-flex flex-column flex-sm-row align-center colum-gap-2 row-gap-1">
            <v-icon v-if="$vuetify.breakpoint.xsOnly">mdi-list-box</v-icon>

            <SecondaryTitle class="text-center text-sm-start">
                <span v-if="$vuetify.breakpoint.smAndUp" class="grey--text">Collection : </span>
                {{ collection.name }}
            </SecondaryTitle>

            <v-chip v-if="collection.archived" color="accent" class="flex-shrink-0">
                <v-icon small class="mr-1"> mdi-archive </v-icon>
                Archived
            </v-chip>
        </div>

        <v-divider class="my-2 my-sm-4" />

        <v-tabs background-color="transparent" color="accent" class="flex-grow-0 mb-3" show-arrows>
            <v-tab :to="{ name: 'collection-detail' }" exact>General</v-tab>
            <v-tab :to="{ name: 'collection-detail-settings' }" exact>Settings</v-tab>
        </v-tabs>

        <router-view />
    </div>
</template>

<script lang="ts">
import { CollectionDetail } from '@/models/collection.model'
import { collectionActions } from '@/store/modules/collection.store'
import { Component, Prop, Vue } from 'vue-property-decorator'
import SecondaryTitle from '@/components/SecondaryTitle.vue'

@Component({
    components: { SecondaryTitle },
})
export default class CollectionDetailComponent extends Vue {
    @Prop() collectionId!: number

    get collection(): CollectionDetail | undefined {
        return this.$store.state.collection.currentCollection
    }

    mounted(): void {
        this.$store.dispatch(collectionActions.retrieveCollection, this.collectionId)
    }

    destroyed(): void {
        this.$store.dispatch(collectionActions.removeCurrentCollection)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.v-tabs::v-deep {
    .v-slide-group__prev,
    .v-slide-group__next {
        min-width: initial;
        flex-basis: auto;
    }
}

@media #{map-get($display-breakpoints, 'xs-only')} {
    .v-tabs::v-deep .v-tab {
        font-size: 0.7rem;
        padding: 0 8px;
    }
}
</style>
