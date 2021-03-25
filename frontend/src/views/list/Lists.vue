<template>
  <v-container>
    <h1 class="mb-6">Lists</h1>
    <div class="d-flex justify-end align-center">
      <v-dialog v-model="listDialog" width="60%">
        <template #activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on">
            <v-icon left>mdi-plus</v-icon>
            Add a list
          </v-btn>
        </template>
        <ListFormDialog :isDialogOpen="listDialog"
                        @submit="createList" @close="listDialog = false">
        </ListFormDialog>
      </v-dialog>
    </div>

    <template v-if="lists.length > 0">
      <v-row>
        <v-col v-for="list in lists" :key="list.id" cols="4">
          <ListItemCard :list="list"></ListItemCard>
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
            <span>You don't have any list yet !</span>
            <v-btn @click="listDialog = true" small class="ml-2">
              <v-icon left>mdi-plus</v-icon>
              add a list
            </v-btn>
          </div>
        </template>
      </EmptyListDisplay>
    </template>
  </v-container>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import ListModel from "@/models/list.model";
import {listService} from "@/api/list.api";
import ListFormDialog from "@/views/list/components/ListFormDialog.vue";
import ListItemCard from "@/views/list/components/ListItemCard.vue";
import EmptyListDisplay from "@/components/EmptyListDisplay.vue";

@Component({
  components: {
    ListFormDialog,
    ListItemCard,
    EmptyListDisplay
  }
})
export default class Lists extends Vue {
  private lists: ListModel[] = [];
  private listDialog = false;

  created(): void {
    this.retrieveListList();
  }

  private retrieveListList(): void {
    listService.getListList().then(
        (response: any) => {
          this.lists = response.body.content;
        }, (error: any) => {
          console.error(error);
        }
    )
  }

  private createList(listForm: Partial<ListModel>): void {
    this.listDialog = false;
    listService.createList(listForm).then(
        (response: any) => {
          // Add router push to list detail
          this.lists.push(response.body);
        }, (error: any) => {
          console.error(error);
        }
    )
  }
}
</script>

<style scoped lang="scss">

</style>