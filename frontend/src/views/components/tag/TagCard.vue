<script setup lang="ts">
import { Tag, TagForm } from '@/models/tag.model'
import TagDialog from '@/views/components/tag/TagDialog.vue'
import { getDialogWidth } from '@/utils/dialog.utils'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const display = useDisplay()

defineProps<{
  tag: Tag
}>()

const emit = defineEmits<{
  update: [event: { id: number; data: TagForm }]
  delete: [id: number]
}>()

const tagDialog = ref(false)

function updateTag(id: number, data: TagForm): void {
  tagDialog.value = false
  emit('update', { id, data })
}

function deleteTag(id: number): void {
  tagDialog.value = false
  emit('delete', id)
}
</script>

<template>
  <div>
    <v-card :color="tag.color" class="rounded-pill" @click="tagDialog = true">
      <v-card-text class="d-flex align-center px-6 py-3">
        <v-icon class="mr-2">mdi-tag</v-icon>
        <h3 class="text-white text-truncate">{{ tag.name }}</h3>
      </v-card-text>
    </v-card>

    <v-dialog v-model="tagDialog" :width="getDialogWidth()" :fullscreen="display.smAndDown">
      <TagDialog
        :tag
        :type="tag.type"
        :is-dialog-open="tagDialog"
        @update="updateTag"
        @delete="deleteTag"
        @close="tagDialog = false" />
    </v-dialog>
  </div>
</template>
