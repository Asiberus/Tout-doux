<template>
  <v-container>
    <h1 class="mb-6">Collections</h1>
    <div class="d-flex justify-end align-center">
      <v-dialog v-model="collectionDialog" width="60%">
        <template #activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on">
            <v-icon left>mdi-plus</v-icon>
            Add a collection
          </v-btn>
        </template>
        <CollectionFormDialog :isDialogOpen="collectionDialog"
                        @submit="createCollection" @close="collectionDialog = false">
        </CollectionFormDialog>
      </v-dialog>
    </div>

    <template v-if="collectionList.length > 0">
      <v-row>
        <v-col v-for="collection in collectionList" :key="collection.id" cols="4">
          <CollectionItemCard :collection="collection"></CollectionItemCard>
        </v-col>
      </v-row>
    </template>
    <template v-else>
      <EmptyListDisplay>
        <template #img>
          <img src="../../assets/project.svg" alt="No project" style="max-width: 450px;">
        </template>
        <template #message>
          <div class="d-flex align-center">
            <span>You don't have any collection yet !</span>
            <v-btn @click="collectionDialog = true" small class="ml-2">
              <v-icon left>mdi-plus</v-icon>
              add a collection
            </v-btn>
          </div>
        </template>
      </EmptyListDisplay>
    </template>
  </v-container>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import CollectionModel from "@/models/collection.model";
import {collectionService} from "@/api/collection.api";
import CollectionFormDialog from "@/views/list/components/CollectionFormDialog.vue";
import CollectionItemCard from "@/views/list/components/CollectionItemCard.vue";
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";

@Component({
  components: {
    CollectionFormDialog,
    CollectionItemCard,
    EmptyListDisplay
  }
})
export default class CollectionList extends Vue {
  private collectionList: CollectionModel[] = [];
  private collectionDialog = false;

  created(): void {
    this.retrieveCollectionList();
  }

  private retrieveCollectionList(): void {
    collectionService.getCollectionList().then(
        (response: any) => {
          this.collectionList = response.body.content;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private createCollection(collectionForm: Partial<CollectionModel>): void {
    this.collectionDialog = false;
    collectionService.createCollection(collectionForm).then(
        (response: any) => {
          // Add router push to list detail
          this.$router.push({name: 'collection-detail', params: {id: response.body.id}});
        }, (error: any) => {
          console.error(error);
        }
    )
  }
}
</script>

<style scoped lang="scss">

</style>