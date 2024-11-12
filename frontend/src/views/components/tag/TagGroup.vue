<script setup lang="ts">
import { Tag } from '@/models/tag.model'
import TagChip from '@/views/components/tag/TagChip.vue'
import { computed, nextTick, onMounted, onUpdated, ref, useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    tagList: Tag[]
    maxTag?: number
    small?: boolean
    large?: boolean
    iconTransparent?: boolean
    zIndex?: number
    autoShrink?: boolean
    multiRow?: boolean
  }>(),
  { maxTag: undefined, iconTransparent: true, zIndex: 4, autoShrink: true }
)

const tagGroupRef = useTemplateRef('tagGroup')

onMounted(() => {
  // TODO : test if we still need nextTick
  if (props.autoShrink) nextTick(() => shrinkTagGroup()) // We need to use nextTick so the tagGroup render
})

onUpdated(() => {
  if (props.autoShrink) shrinkTagGroup()
})

const smallMenuChip = ref(false)
const internalMaxTag = ref<number | null>(null)

const displayedTags = computed<Tag[]>(() =>
  props.tagList.slice(0, internalMaxTag.value ?? props.tagList.length)
)
const hiddenTags = computed<Tag[]>(() =>
  internalMaxTag.value !== null ? props.tagList.slice(internalMaxTag.value) : []
)
const tagIconSize = computed<'small' | 'x-small' | 'default'>(() => {
  if (!props.small && !props.large) return 'small'
  else if (props.small) return 'x-small'
  else return 'default'
})

watch(
  () => props.maxTag,
  (value: number | undefined) => {
    internalMaxTag.value = value ?? props.tagList.length
  },
  { immediate: true }
)

function shrinkTagGroup(): void {
  const isOverflowing = tagGroupRef.value.clientWidth < tagGroupRef.value.scrollWidth
  if (!isOverflowing) return

  if (internalMaxTag.value && internalMaxTag.value > 0) {
    internalMaxTag.value = internalMaxTag.value - 1
  } else if (!smallMenuChip.value) {
    smallMenuChip.value = true
  }
}
</script>

<template>
  <div ref="tagGroup" class="tag-group" :class="{ small, large, 'multi-row': multiRow }">
    <v-icon
      v-if="displayedTags.length > 0"
      :size="tagIconSize"
      :class="{ transparent: iconTransparent }">
      mdi-tag
    </v-icon>

    <template v-for="tag of displayedTags" :key="tag.id">
      <TagChip :tag :small="!small && !large" :x-small="small" class="flex-shrink-0" />
    </template>
    <template v-if="hiddenTags.length > 0">
      <v-menu open-on-hover offset-y offset-overflow :close-on-content-click="false" :z-index>
        <template #activator="{ props: menuProps }">
          <v-chip
            :size="!large ? 'small' : 'default'"
            class="flex-shrink-0"
            v-bind="menuProps"
            @click.prevent.stop>
            <template v-if="smallMenuChip">
              <template v-if="displayedTags.length > 0">+</template>
              <span>{{ hiddenTags.length }}</span>
              <v-icon size="x-small" class="ml-1">mdi-tag</v-icon>
            </template>
            <template v-else>
              <v-icon size="x-small" class="mr-1">mdi-tag</v-icon>
              {{ hiddenTags.length }}
              <template v-if="displayedTags.length > 0">more</template>
              {{ hiddenTags.length > 1 ? 'tags' : 'tag' }}
            </template>
          </v-chip>
        </template>
        <div class="d-flex flex-column align-start gap-1 py-1">
          <template v-for="tag of hiddenTags" :key="tag.id">
            <TagChip :tag :small="!small && !large" :x-small="small" />
          </template>
        </div>
      </v-menu>
    </template>
  </div>
</template>

<style scoped lang="scss">
.tag-group {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  overflow-y: hidden;

  &.multi-row {
    flex-wrap: wrap;
  }

  &:not(.small):not(.large) {
    .v-chip {
      height: 20px;
    }
  }

  &.small {
    .v-chip {
      height: 18px;
    }
  }

  .v-chip {
    cursor: inherit;

    &:hover::before {
      opacity: 0 !important;
    }
  }

  .transparent {
    opacity: 0.62;
  }
}

.v-menu__content {
  box-shadow: none;
}
</style>
