<script setup lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import FilterChip from '@/components/FilterChip.vue'
import { CollectionList, CollectionPost } from '@/models/collection.model'
import CollectionFormDialog from '@/views/collection/components/CollectionFormDialog.vue'
import CollectionCard from '@/views/collection/components/CollectionCard.vue'
import MainTitle from '@/components/MainTitle.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { onBeforeMount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { collectionApi } from '@/api'
import { useDisplay } from 'vuetify'

const router = useRouter()
const display = useDisplay()

const { archived } = defineProps<{
  archived: boolean
}>()

onBeforeMount(() => retrieveCollectionList({ archived }))
const collectionList = ref<CollectionList[]>([])
const collectionDialog = ref(false)

watch(
  () => archived,
  (value: boolean) => retrieveCollectionList({ archived: value })
)

function retrieveCollectionList(params = {}): void {
  collectionApi
    .getCollectionList(params)
    .then(response => (collectionList.value = response.content))
    .catch(error => console.error(error))
}

function createCollection(collectionForm: CollectionPost): void {
  collectionDialog.value = false
  collectionApi
    .createCollection(collectionForm)
    .then(({ id }) => router.push({ name: 'collection-detail', params: { id } }))
    .catch(error => console.error(error))
}

function toggleArchivedProject(): void {
  router.replace({ query: { archived: (!archived).toString() } })
}
</script>

<template>
  <div class="d-flex flex-column h-100">
    <div class="d-flex flex-column flex-sm-row align-center gap-2 mb-3 mb-md-6">
      <MainTitle icon="mdi-list-box" class="flex-grow-1">Collections</MainTitle>

      <div class="d-flex align-center gap-2">
        <FilterChip
          :value="archived"
          color="accent"
          icon="mdi-archive"
          @input="toggleArchivedProject()">
          Archived
        </FilterChip>

        <v-dialog
          v-model="collectionDialog"
          :width="getDialogWidth()"
          :fullscreen="display.smAndDown">
          <template #activator="{ props }">
            <v-btn v-bind="props">
              <v-icon start>mdi-plus</v-icon>
              collection
            </v-btn>
          </template>
          <CollectionFormDialog
            :is-dialog-open="collectionDialog"
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
          <div v-if="!archived" class="d-flex flex-column align-center gap-2">
            <span>You don't have any collection yet!</span>
            <v-btn @click="collectionDialog = true">
              <v-icon start>mdi-plus</v-icon>
              collection
            </v-btn>
          </div>
          <div v-else>You don't have any archived collection.</div>
        </template>
      </EmptyListDisplay>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.collection-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(max(288px, calc((100% - 2 * 12px) / 3)), 1fr));
  gap: 12px;

  @media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
    grid-template-columns: repeat(auto-fill, minmax(max(420px, calc((100% - 2 * 12px) / 3)), 1fr));
  }

  @media #{map.get(variables.$display-breakpoints, 'xl')} {
    grid-template-columns: repeat(auto-fill, minmax(max(500px, calc((100% - 2 * 12px) / 3)), 1fr));
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
