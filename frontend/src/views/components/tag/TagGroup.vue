<template>
    <div class="tag-group d-flex align-center gap-1 overflow-auto" :class="{ small, large }">
        <v-icon
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
                z-index="4">
                <template #activator="{ attrs, on }">
                    <v-chip v-bind="attrs" v-on="on" small class="flex-shrink-0">
                        <v-icon x-small class="mr-1">mdi-tag</v-icon>
                        {{ hiddenTags.length }} more {{ hiddenTags.length > 1 ? 'tags' : 'tag' }}
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
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Tag } from '@/models/tag.model'
import TagChip from '@/views/components/tag/TagChip.vue'

@Component({ components: { TagChip } })
export default class TagGroup extends Vue {
    @Prop({ required: true }) tagList!: Tag[]
    @Prop({ default: false }) small!: boolean
    @Prop({ default: false }) large!: boolean
    @Prop({ default: true }) iconTransparent!: boolean
    @Prop() maxTag?: number | undefined

    get displayedTags(): Tag[] {
        return this.tagList.slice(0, this.maxTag)
    }

    get hiddenTags(): Tag[] {
        if (!this.maxTag) return []

        return this.tagList.slice(this.maxTag)
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

    .transparent {
        opacity: 0.62;
    }
}

.v-menu__content {
    box-shadow: none;
}
</style>
