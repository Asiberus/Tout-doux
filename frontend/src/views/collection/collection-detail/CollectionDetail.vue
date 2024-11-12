<script setup lang="ts">
import SecondaryTitle from '@/components/SecondaryTitle.vue'
import { useDisplay } from 'vuetify'
import { onBeforeMount, onUnmounted } from 'vue'
import { useCollectionStore } from '@/store'

const display = useDisplay()
const collectionStore = useCollectionStore()

const props = defineProps<{
  collectionId: number
}>()

onBeforeMount(() => collectionStore.retrieveCollection(props.collectionId))
onUnmounted(() => collectionStore.removeCurrentCollection())
</script>

<template>
  <div v-if="collectionStore.currentCollection" class="d-flex flex-column h-100">
    <div class="d-flex flex-column flex-sm-row align-center column-gap-2 row-gap-1">
      <v-icon v-if="display.xs">mdi-list-box</v-icon>

      <SecondaryTitle class="text-center text-sm-start">
        <span v-if="display.smAndUp" class="text-grey">Collection : </span>
        {{ collectionStore.currentCollection.name }}
      </SecondaryTitle>

      <v-chip
        v-if="collectionStore.currentCollection.archived"
        color="accent"
        class="flex-shrink-0">
        <v-icon size="small" class="mr-1">mdi-archive</v-icon>
        Archived
      </v-chip>
    </div>

    <v-divider class="my-2 my-sm-4" />

    <v-tabs bg-color="transparent" color="accent" class="flex-grow-0 mb-3" show-arrows>
      <v-tab :to="{ name: 'collection-detail' }" exact>General</v-tab>
      <v-tab :to="{ name: 'collection-detail-settings' }" exact>Settings</v-tab>
    </v-tabs>

    <router-view />
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

.v-tabs :deep(.v-slide-group__prev, .v-slide-group__next) {
  min-width: initial;
  flex-basis: auto;
}

@media #{map-get($display-breakpoints, 'xs')} {
  .v-tabs :deep(.v-tab) {
    font-size: 0.7rem;
    padding: 0 8px;
  }
}
</style>
