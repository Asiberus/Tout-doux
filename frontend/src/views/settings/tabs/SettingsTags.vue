<script setup lang="ts">
import { TagType } from '@/models/tag.model'
import SettingsTagList from '@/views/settings/components/SettingsTagList.vue'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

const settingsTagListComponent = useTemplateRef<InstanceType<typeof SettingsTagList>>('tagList')

defineProps<{
  type: TagType
}>()

const router = useRouter()

const tagTypes: TagType[] = ['project', 'task']

function changeType(type: TagType): void {
  router.replace({ query: { type } })
}

function openTagDialog(): void {
  settingsTagListComponent.value?.openTagDialog()
}
</script>

<template>
  <div class="fill-height d-flex flex-column">
    <TertiaryTitle>Tags</TertiaryTitle>
    <p class="text-title-small text-sm-body-large mb-1">
      Tags are useful to group or filter items. Two types of tag are available : project tag and
      task tag (used for Task, Common Task and Daily Task).
    </p>

    <div class="d-flex justify-space-between align-center mb-1">
      <v-chip-group
        :model-value="type"
        mandatory
        selected-class="active"
        @update:model-value="changeType($event)">
        <v-chip
          v-for="tagType of tagTypes"
          :key="tagType"
          :value="tagType"
          :ripple="false"
          class="text-label-medium outlined px-2 px-sm-6 py-3">
          {{ tagType }}
        </v-chip>
      </v-chip-group>

      <v-btn @click="openTagDialog()">
        <v-icon icon="mdi-plus" start />
        tag
      </v-btn>
    </div>

    <SettingsTagList ref="tagList" :type="type" />
  </div>
</template>

<style scoped lang="scss">
.v-chip {
  text-transform: capitalize;
}

.outlined {
  background-color: transparent !important;
  border-width: thin;
  border-style: solid;
}

.active {
  background-color: white !important;
  color: #212121 !important;

  &::before {
    opacity: 0 !important;
  }
}
</style>
