<script setup lang="ts">
import { feedbackApi } from '@/api'
import { Feedback } from '@/models/feedback.model'
import { dateFormat } from '@/pipes'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { onBeforeMount, ref } from 'vue'

onBeforeMount(() => {
  feedbackApi
    .getFeedback()
    .then(response => {
      feedbackList.value = response.content
    })
    .catch(error => console.error(error))
})

const feedbackList = ref<Feedback[]>([])
const headerDefinition = [
  // Déclarée explicitement pour la placer à gauche : sinon V4 l'ajoute en fin de tableau
  { key: 'data-table-expand' },
  { title: 'Title', value: 'title' },
  { title: 'User', value: 'user.username', width: 150, align: 'center' },
  { title: 'Date', value: 'date', width: 110, align: 'center' },
  { title: '', value: 'actions', width: 105, sortable: false },
] as const

function feedbackExpanded(expanded: number[]): void {
  const id = expanded[0]
  if (id === undefined) return

  const feedback = feedbackList.value.find(item => item.id === id)
  if (!feedback || feedback.isRead) return

  // We set first the isRead to true, and then we call the api.
  // This prevents a blinking effect
  feedback.isRead = true

  feedbackApi.setFeedbackReadProperty(feedback.id, true).catch(error => console.error(error))
}

function setFeedbackAsUnread(id: number): void {
  feedbackApi
    .setFeedbackReadProperty(id, false)
    .then(() => {
      const feedback = feedbackList.value.find(item => item.id === id)
      if (feedback) feedback.isRead = false
    })
    .catch(error => console.error(error))
}

function deleteFeedback(id: number): void {
  feedbackApi.deleteFeedback(id).then(() => {
    const index = feedbackList.value.findIndex(feedback => feedback.id === id)
    if (index !== -1) feedbackList.value.splice(index, 1)
  })
}

function getItemClass({ item }: { item: Feedback }): { class: string } {
  if (item.isRead) return { class: 'text-grey-lighten-2 font-weight-light' }
  else return { class: 'text-white font-weight-bold' }
}
</script>

<template>
  <div>
    <TertiaryTitle>Feedback</TertiaryTitle>

    <v-data-table
      :items="feedbackList"
      :headers="headerDefinition"
      show-expand
      expand-strategy="single"
      :cell-props="getItemClass"
      @update:expanded="feedbackExpanded($event)">
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-5">
            {{ item.message }}
          </td>
        </tr>
      </template>
      <template #item.date="{ value }">{{ dateFormat(value, 'DD/MM/YYYY') }}</template>
      <template #item.actions="{ item }">
        <div class="d-flex justify-end align-center">
          <v-btn
            v-show="item.isRead"
            icon
            variant="text"
            density="comfortable"
            title="Mark as unread"
            @click="setFeedbackAsUnread(item.id)">
            <v-icon icon="mdi-email-mark-as-unread" />
          </v-btn>
          <ConfirmDialog @confirm="deleteFeedback(item.id)">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" density="comfortable" title="Delete">
                <v-icon icon="mdi-trash-can" />
              </v-btn>
            </template>
            <template #icon>
              <v-icon icon="mdi-trash-can" size="x-large" />
            </template>
            <p>Are you sure to delete this feedback ?</p>
          </ConfirmDialog>
        </div>
      </template>
    </v-data-table>
  </div>
</template>
