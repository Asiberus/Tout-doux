<template>
    <div v-if="collection">
        <h1>
            Collection : {{ collection.name }}
            <v-chip v-if="collection.archived" color="accent" class="ml-3">
                <v-icon small class="mr-1"> mdi-archive </v-icon>
                Archived
            </v-chip>
        </h1>

        <v-divider class="my-3" />

        <v-tabs v-model="collectionTab" background-color="transparent" color="accent">
            <v-tab :to="{ name: 'collection-detail' }" exact>General</v-tab>
            <v-tab :to="{ name: 'collection-detail-configuration' }" exact>Configuration</v-tab>
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

<style scoped lang="scss"></style>
