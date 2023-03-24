<template>
    <div>
        <v-autocomplete
            :value="selectedTags"
            @input="updateSelectedTags($event)"
            :search-input.sync="search"
            :items="tagList"
            :loading="isLoading"
            :menu-props="{ contentClass: 'background-elevation' }"
            multiple
            return-object
            no-filter
            hide-no-data
            hide-details
            dense
            auto-select-first
            placeholder="Search tags">
            <template #item="{ item }">
                <TagChip :tag="item"></TagChip>
            </template>
            <template #selection="{ item }">
                <!-- Empty to remove search when a tag is selected -->
            </template>
        </v-autocomplete>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Tag } from '@/models/tag.model'
import { tagService } from '@/api'
import TagChip from '@/views/components/tag/TagChip.vue'

@Component({ components: { TagChip } })
export default class TagSearch extends Vue {
    @Prop({ required: true }) selectedTags!: Tag[]

    tagList: Tag[] = []
    search: string | null = null
    isLoading = false

    private searchTimer?: number

    @Watch('search')
    private onSearchChanges(value: string): void {
        clearTimeout(this.searchTimer)

        if (!value) {
            this.cleanTagList()
            return
        }

        this.isLoading = true
        this.searchTimer = setTimeout(() => this.searchTags(value), 200)
    }

    private searchTags(value: string): void {
        const excludedId = this.selectedTags.map(({ id }) => id).join(',')
        tagService
            .getTagList({
                type: 'task',
                search: value,
                size: 0,
                exclude_ids: excludedId || undefined,
            })
            .then((response: any) => (this.tagList = response.body.content))
            .catch((error: any) => console.error(error))
            .finally(() => (this.isLoading = false))
    }

    updateSelectedTags(selectedTags: Tag[]): void {
        this.$emit('update:selectedTags', [...selectedTags])
        this.cleanTagList()
    }

    cleanTagList(): void {
        this.tagList = []
        this.search = null
    }
}
</script>
