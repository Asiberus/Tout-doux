<template>
    <div>
        <div class="text-h4 mb-4">Feedback</div>

        <v-data-table
            :items="feedbackList"
            :headers="headers"
            show-expand
            single-expand
            :item-class="getItemClass"
            @item-expanded="feedbackExpanded($event)">
            <template #item.user="{ value }">{{ value.username }}</template>
            <template #item.date="{ value }">{{ dateFormat(value, 'DD/MM/YYYY') }}</template>
            <template #item.actions="{ item }">
                <div class="d-flex justify-end align-center">
                    <v-btn
                        @click="setFeedbackAsUnread(item.id)"
                        v-show="item.isRead"
                        icon
                        title="Mark as unread">
                        <v-icon>mdi-email-mark-as-unread</v-icon>
                    </v-btn>
                    <ConfirmDialog2 @confirm="deleteFeedback(item.id)">
                        <template #activator="{ attrs, on }">
                            <v-btn v-bind="attrs" v-on="on" icon title="Delete">
                                <v-icon>mdi-trash-can</v-icon>
                            </v-btn>
                        </template>
                        <template #icon>
                            <v-icon x-large>mdi-trash-can</v-icon>
                        </template>
                        <p>Are you sure to delete this feedback ?</p>
                    </ConfirmDialog2>
                </div>
            </template>

            <template #expanded-item="{ headers, item }">
                <td :colspan="headers.length" :class="getItemClass(item)" class="pa-5">
                    {{ item.message }}
                </td>
            </template>
        </v-data-table>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { feedbackApi } from '@/api'
import { Feedback } from '@/models/feedback.model'
import { DataTableHeader } from 'vuetify'
import { dateFormat } from '@/pipes'
import ConfirmDialog2 from '@/components/ConfirmDialog2.vue'

@Component({
    components: { ConfirmDialog2 },
})
export default class AdministrationFeedback extends Vue {
    feedbackList: Feedback[] = []
    headers: DataTableHeader[] = [
        { text: 'Title', value: 'title' },
        { text: 'User', value: 'user', width: 150, align: 'center' },
        { text: 'Date', value: 'date', width: 110, align: 'center' },
        { text: '', value: 'actions', width: 105, sortable: false },
    ]

    created(): void {
        feedbackApi
            .getFeedback()
            .then((response: any) => {
                this.feedbackList = response.body.content
            })
            .catch((error: any) => console.error(error))
    }

    feedbackExpanded(event: { item: Feedback; value: boolean }): void {
        const { item, value } = event
        if (item.isRead || !value) return

        // We set first the isRead to true, and then we call the api.
        // This prevents a blinking effect
        const feedback = this.feedbackList.find(({ id }) => item.id === id)
        if (feedback) feedback.isRead = true

        feedbackApi
            .setFeedbackReadProperty(item.id, true)
            .catch((error: any) => console.error(error))
    }

    setFeedbackAsUnread(id: number): void {
        feedbackApi
            .setFeedbackReadProperty(id, false)
            .then(() => {
                const feedback = this.feedbackList.find(item => item.id === id)
                if (feedback) feedback.isRead = false
            })
            .catch((error: any) => console.error(error))
    }

    deleteFeedback(id: number): void {
        feedbackApi.deleteFeedback(id).then(() => {
            const index = this.feedbackList.findIndex(feedback => feedback.id === id)
            if (index !== -1) this.feedbackList.splice(index, 1)
        })
    }

    getItemClass(item: Feedback): string {
        return item.isRead
            ? 'grey--text text--lighten-2 font-weight-thin'
            : 'white--text font-weight-bold'
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }
}
</script>
