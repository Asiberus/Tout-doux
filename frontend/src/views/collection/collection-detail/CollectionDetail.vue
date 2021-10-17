<template>
    <v-container v-if="collection">
        <h1>Collection : {{ collection.name }}</h1>

        <v-divider class="my-3"/>

        <v-tabs v-model="collectionTab" background-color="transparent" color="accent">
            <v-tab :to="{ name: 'collection-detail-description' }">Description</v-tab>
            <v-tab :to="{ name: 'collection-detail-completed-tasks' }">Completed Task</v-tab>
            <v-tab :to="{ name: 'collection-detail-configuration' }">Configuration</v-tab>
        </v-tabs>

        <router-view/>
    </v-container>
</template>

<script lang="ts">
    import {CollectionModel} from '@/models/collection.model';
    import {collectionActions} from '@/store/modules/collection.store';
    import {Component, Prop, Vue} from 'vue-property-decorator';

    //Todo : remove v-container
    @Component
    export default class CollectionDetail extends Vue {
        @Prop() collectionId!: number;

        collectionTab = 'description';

        get collection(): CollectionModel | undefined {
            return this.$store.state.collection.currentCollection;
        }

        mounted(): void {
            this.$store.dispatch(collectionActions.retrieveCollection, this.collectionId);
        }
    }
</script>

<style scoped lang="scss">

</style>
