<template>
    <div class="fill-height d-flex flex-column">
        <template v-if="tagList.length > 0">
            <div class="tag-wrapper">
                <TagCard
                    v-for="tag of tagList"
                    :key="tag.id"
                    :tag="tag"
                    @update="updateTag"
                    @delete="deleteTag" />
            </div>
        </template>
        <template v-else>
            <EmptyListDisplay
                :message="`You didn't configure any ${type} tag yet.`"
                class="empty-list-display">
                <template #img>
                    <img
                        src="../../../assets/settings.svg"
                        alt="No tag"
                        class="empty-list-display__img" />
                </template>
            </EmptyListDisplay>
        </template>

        <v-dialog
            v-model="tagDialog"
            :width="getDialogWidth()"
            :fullscreen="$vuetify.breakpoint.smAndDown">
            <TagDialog
                :type="type"
                :is-dialog-open="tagDialog"
                @create="createTag"
                @close="tagDialog = false" />
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Tag, TagForm, TagType } from '@/models/tag.model'
import TagDialog from '@/views/components/tag/TagDialog.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import TagCard from '@/views/components/tag/TagCard.vue'
import { tagService } from '@/api'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: { TagDialog, TagCard, EmptyListDisplay },
})
export default class SettingsTagList extends Vue {
    @Prop({ required: true }) type!: TagType

    tagList: Tag[] = []
    tagDialog = false

    created(): void {
        this.fetchTagList()
    }

    @Watch('type')
    private onTypeChange(): void {
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

<style scoped lang="scss">
.tag-wrapper {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(max(calc((100% / 4) - 3 * 4px), 200px), 1fr));
    row-gap: 8px;
    column-gap: 4px;
}

.empty-list-display {
    flex-grow: 1;

    &__img {
        width: clamp(200px, 50%, 300px);
    }
}
</style>
