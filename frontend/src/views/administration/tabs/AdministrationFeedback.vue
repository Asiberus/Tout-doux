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
  { title: 'Title', value: 'title' },
  { title: 'User', value: 'user.username', width: 150, align: 'center' },
  { title: 'Date', value: 'date', width: 110, align: 'center' },
  { title: '', value: 'actions', width: 105, sortable: false },
]

function feedbackExpanded(event: { item: Feedback; value: boolean }): void {
  const { item, value } = event
  if (item.isRead || !value) return

  // We set first the isRead to true, and then we call the api.
  // This prevents a blinking effect
  const feedback = feedbackList.value.find(({ id }) => item.id === id)
  if (feedback) feedback.isRead = true

  feedbackApi.setFeedbackReadProperty(item.id, true).catch(error => console.error(error))
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

function getItemClass(item: Feedback): string {
  if (item.isRead) return { class: 'grey--text text--lighten-2 font-weight-light' }
  else return { class: 'white--text font-weight-bold' }
}
</script>

<template>
  <div>
    <TertiaryTitle>Feedback</TertiaryTitle>

    <v-data-table
      :items="feedbackList"
      :headers="headerDefinition"
      show-expand
      single-expand
      :cell-props="getItemClass"
      @item-expanded="feedbackExpanded($event)">
      <template #item.date="{ value }">{{ dateFormat(value, 'DD/MM/YYYY') }}</template>
      <template #item.actions="{ item }">
        <div class="d-flex justify-end align-center">
          <v-btn
            v-show="item.isRead"
            icon
            title="Mark as unread"
            @click="setFeedbackAsUnread(item.id)">
            <v-icon>mdi-email-mark-as-unread</v-icon>
          </v-btn>
          <ConfirmDialog @confirm="deleteFeedback(item.id)">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon title="Delete">
                <v-icon>mdi-trash-can</v-icon>
              </v-btn>
            </template>
            <template #icon>
              <v-icon size="x-large">mdi-trash-can</v-icon>
            </template>
            <p>Are you sure to delete this feedback ?</p>
          </ConfirmDialog>
        </div>
      </template>

      <template #expanded-row="{ headers, item }">
        <td :colspan="headers.length" class="pa-5">
          {{ item.message }}
        </td>
      </template>
    </v-data-table>
  </div>
</template>
