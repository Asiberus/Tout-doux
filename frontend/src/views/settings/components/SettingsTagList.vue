<template>
    <div>
        <div class="tag-wrapper">
            <template v-if="tagList.length > 0">
                <v-row class="tag-wrapper__rows" no-gutters>
                    <v-col v-for="tag of tagList" :key="'tag-' + tag.id" cols="3" class="px-1 py-2">
                        <TagCard :tag="tag" @update="updateTag" @delete="deleteTag" />
                    </v-col>
                </v-row>
            </template>
            <template v-else>
                <EmptyListDisplay
                    :message="`You didn't configure any ${type} tag yet`"
                    class="mt-10">
                    <template #img>
                        <img src="../../../assets/settings.svg" width="330" alt="No tag" />
                    </template>
                </EmptyListDisplay>
            </template>
        </div>

        <v-dialog v-model="tagDialog" width="60%">
            <TagDialog
                :type="type"
                :is-dialog-open="tagDialog"
                @create="createTag"
                @close="tagDialog = false" />
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Tag, TagForm, TagType } from '@/models/tag.model'
import TagDialog from '@/views/components/tag/TagDialog.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import TagCard from '@/views/components/tag/TagCard.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import { tagService } from '@/api'

@Component({ components: { TagDialog, TagCard, EmptyListDisplay, TagChip } })
export default class SettingsTagList extends Vue {
    @Prop({ required: true }) type!: TagType

    tagList: Tag[] = []
    tagDialog = false

    created() {
        this.fetchTagList()
    }

    private fetchTagList(): void {
        tagService
            .getTagList({ size: 0, type: this.type })
            .then((response: any) => {
                this.tagList = response.body.content
            })
            .catch((error: any) => console.error(error))
    }

    openTagDialog(): void {
        this.tagDialog = true
    }

    createTag(data: TagForm): void {
        tagService
            .createTag(data)
            .then((response: any) => {
                this.tagList.push(response.body)
                this.tagDialog = false
            })
            .catch((error: any) => console.error(error))
    }

    updateTag({ id, data }: { id: number; data: TagForm }): void {
        tagService
            .updateTag(id, data)
            .then((response: any) => {
                const index = this.tagList.findIndex(tag => tag.id === id)
                if (index !== -1) this.tagList.splice(index, 1, response.body)
            })
            .catch((error: any) => console.error(error))
    }

    deleteTag(id: number): void {
        tagService
            .deleteTag(id)
            .then(() => {
                const index = this.tagList.findIndex(tag => tag.id === id)
                if (index !== -1) this.tagList.splice(index, 1)
            })
            .catch((error: any) => console.error(error))
    }
}
</script>
