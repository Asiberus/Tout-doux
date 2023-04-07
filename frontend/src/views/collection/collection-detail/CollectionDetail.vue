<template>
    <div v-if="collection">
        <div class="d-flex align-center">
            <h3 class="text-h3">
                <span class="grey--text">Collection : </span>{{ collection.name }}
            </h3>
            <v-chip v-if="collection.archived" color="accent" class="ml-4">
                <v-icon small class="mr-1"> mdi-archive </v-icon>
                Archived
            </v-chip>
        </div>

        <v-divider class="my-4" />

        <v-tabs v-model="collectionTab" background-color="transparent" color="accent">
            <v-tab :to="{ name: 'collection-detail' }" exact>General</v-tab>
            <v-tab :to="{ name: 'collection-detail-settings' }" exact>Settings</v-tab>
        </v-tabs>

        <div class="pa-5">
            <router-view />
        </div>
    </div>
</template>

<script lang="ts">
import { CollectionDetail } from '@/models/collection.model'
import { collectionActions } from '@/store/modules/collection.store'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class CollectionDetailComponent extends Vue {
    @Prop() collectionId!: number

    collectionTab = 'description'

    get collection(): CollectionDetail | undefined {
        return this.$store.state.collection.currentCollection
    }

    mounted(): void {
        this.$store.dispatch(collectionActions.retrieveCollection, this.collectionId)
    }
}
</script>
