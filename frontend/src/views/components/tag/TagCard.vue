<template>
    <div>
        <v-card @click="tagDialog = true" :color="tag.color" class="rounded-pill px-3">
            <v-card-text class="d-flex align-center px-3 py-3">
                <v-icon>mdi-tag</v-icon>
                <h3 class="white--text pl-3 text-truncate">{{ tag.name }}</h3>
            </v-card-text>
        </v-card>

        <v-dialog v-model="tagDialog" width="60%">
            <TagDialog
                :tag="tag"
                :type="tag.type"
                :is-dialog-open="tagDialog"
                @update="updateTag"
                @delete="deleteTag"
                @close="tagDialog = false" />
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Tag, TagForm } from '@/models/tag.model'
import TagDialog from '@/views/components/tag/TagDialog.vue'

@Component({ components: { TagDialog } })
export default class TagCard extends Vue {
    @Prop({ required: true }) tag!: Tag

    tagDialog = false

    updateTag(id: number, data: TagForm): void {
        this.tagDialog = false
        this.$emit('update', { id, data })
    }

    deleteTag(id: number): void {
        this.tagDialog = false
        this.$emit('delete', id)
    }
}
</script>
