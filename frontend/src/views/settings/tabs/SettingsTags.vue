<script setup lang="ts">
import { TagType } from '@/models/tag.model'
import SettingsTagList from '@/views/settings/components/SettingsTagList.vue'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { ref, useTemplateRef } from 'vue'

const settingsTagListComponent = useTemplateRef<SettingsTagList>('tagList')

const tab = ref<TagType>('project')
const tagTypes: TagType[] = ['project', 'task']

function openTagDialog(): void {
  settingsTagListComponent.value.openTagDialog()
}
</script>

<template>
  <div class="fill-height d-flex flex-column">
    <TertiaryTitle>Tags</TertiaryTitle>
    <p class="text-subtitle-2 text-sm-subtitle-1 mb-1">
      Tags are useful to group or filter items. Two types of tag are available : project tag and
      task tag (used for Task, Common Task and Daily Task).
    </p>

    <div class="d-flex justify-space-between align-center mb-1">
      <v-chip-group v-model="tab" mandatory selected-class="active">
        <v-chip
          v-for="type of tagTypes"
          :key="type"
          :value="type"
          :ripple="false"
          class="text-overline outlined px-3 px-sm-6 py-3">
          {{ type }}
        </v-chip>
      </v-chip-group>

      <v-btn @click="openTagDialog()">
        <v-icon start>mdi-plus</v-icon>
        tag
      </v-btn>
    </div>

    <SettingsTagList ref="tagList" :type="tab" />
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
