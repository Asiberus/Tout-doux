<template>
    <div
        ref="tagGroup"
        class="tag-group d-flex align-center gap-1 overflow-auto"
        :class="{ small, large }">
        <v-icon
            v-if="displayedTags.length > 0"
            :small="!small && !large"
            :x-small="small"
            :class="{ transparent: iconTransparent }">
            mdi-tag
        </v-icon>

        <template v-for="tag of displayedTags">
            <TagChip
                :tag="tag"
                :key="tag.id"
                :small="!small && !large"
                :x-small="small"
                class="flex-shrink-0">
            </TagChip>
        </template>
        <template v-if="hiddenTags.length > 0">
            <v-menu
                open-on-hover
                offset-y
                offset-overflow
                :close-on-content-click="false"
                :z-index="zIndex">
                <template #activator="{ attrs, on }">
                    <v-chip v-bind="attrs" v-on="on" :small="!large" class="flex-shrink-0">
                        <template v-if="smallMenuChip">
                            <template v-if="displayedTags.length > 0">+</template>
                            <span>{{ hiddenTags.length }}</span>
                            <v-icon x-small class="ml-1">mdi-tag</v-icon>
                        </template>
                        <template v-else>
                            <v-icon x-small class="mr-1">mdi-tag</v-icon>
                            {{ hiddenTags.length }}
                            <template v-if="displayedTags.length > 0">more</template>
                            {{ hiddenTags.length > 1 ? 'tags' : 'tag' }}
                        </template>
                    </v-chip>
                </template>
                <div class="d-flex flex-column align-start gap-1 py-1">
                    <template v-for="tag of hiddenTags">
                        <TagChip
                            :tag="tag"
                            :key="tag.id"
                            :small="!small && !large"
                            :x-small="small">
                        </TagChip>
                    </template>
                </div>
            </v-menu>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Tag } from '@/models/tag.model'
import TagChip from '@/views/components/tag/TagChip.vue'

@Component({ components: { TagChip } })
export default class TagGroup extends Vue {
    @Prop({ required: true }) tagList!: Tag[]
    @Prop({ default: null }) maxTag!: number | null
    @Prop({ default: false }) small!: boolean
    @Prop({ default: false }) large!: boolean
    @Prop({ default: true }) iconTransparent!: boolean
    @Prop({ default: 4 }) zIndex!: number
    @Prop({ default: true }) autoShrink!: boolean

    smallMenuChip = false
    internalMaxTag: number | null = null
    tagGroup!: HTMLElement

    get displayedTags(): Tag[] {
        return this.tagList.slice(0, this.internalMaxTag ?? this.tagList.length)
    }

    get hiddenTags(): Tag[] {
        return this.internalMaxTag !== null ? this.tagList.slice(this.internalMaxTag) : []
    }

    mounted(): void {
        this.tagGroup = this.$refs.tagGroup as HTMLElement
        if (this.autoShrink) this.$nextTick(() => this.shrinkTagGroup()) // We need to use nextTick so the tagGroup render
    }

    updated(): void {
        if (this.autoShrink) this.shrinkTagGroup()
    }

    @Watch('maxTag', { immediate: true })
    private onMaxTagChanges(value: number | null): void {
        this.internalMaxTag = value ?? this.tagList.length
    }

    private shrinkTagGroup(): void {
        const isOverflowing = this.tagGroup.clientWidth < this.tagGroup.scrollWidth
        if (!isOverflowing) return

        if (this.internalMaxTag && this.internalMaxTag > 0) {
            this.internalMaxTag = this.internalMaxTag - 1
        } else if (!this.smallMenuChip) {
            this.smallMenuChip = true
        }
    }
}
</script>

<style scoped lang="scss">
.tag-group {
    display: flex;
    align-items: center;
    column-gap: 4px;
    overflow: auto;

    &:not(.small):not(.large) {
        .v-chip {
            height: 20px;
        }
    }

    &.small {
        .v-chip {
            height: 18px;
        }
    }

    .v-chip {
        cursor: inherit;

        &:hover::before {
            opacity: 0 !important;
        }
    }

    .transparent {
        opacity: 0.62;
    }
}

.v-menu__content {
    box-shadow: none;
}
</style>
