<template>
    <div class="d-flex" :class="{ 'pl-3': !isOverflowing && padding }">
        <v-icon
            v-if="isOverflowing"
            @click.stop="previous()"
            class="navigation-icon"
            :class="{ disabled: isScrolledToTheLeft }">
            mdi-menu-left
        </v-icon>
        <div
            class="tag-group-wrapper"
            :class="{
                'left-shadow': isOverflowing && !isScrolledToTheLeft,
                'right-shadow': isOverflowing && !isScrolledToTheRight,
            }">
            <div class="tag-group" ref="tagGroup" @scroll="renderArrows()">
                <template v-for="tag of tagList">
                    <TagChip
                        :tag="tag"
                        :key="tag.id"
                        :x-small="xSmall"
                        class="tag-group__chip"></TagChip>
                </template>
            </div>
        </div>
        <v-icon
            v-if="isOverflowing"
            @click.stop="next()"
            class="navigation-icon"
            :class="{ visible: isOverflowing, disabled: isScrolledToTheRight }">
            mdi-menu-right
        </v-icon>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Tag } from '@/models/tag.model'
import TagChip from '@/views/components/tag/TagChip.vue'

@Component({ components: { TagChip } })
export default class TagGroup extends Vue {
    @Prop({ required: true }) tagList!: Tag[]
    @Prop({ default: true }) padding!: boolean
    @Prop({ default: false }) xSmall!: boolean

    tagGroup!: HTMLElement
    isOverflowing = false
    isScrolledToTheLeft = true
    isScrolledToTheRight = false

    mounted(): void {
        this.tagGroup = this.$refs.tagGroup as HTMLElement
        this.isOverflowing = this.tagGroup.clientWidth < this.tagGroup.scrollWidth
    }

    @Watch('tagList')
    private onTagListChanges(): void {
        // Should wait next tick to render the tagGroup with the new tag list
        this.$nextTick(
            () => (this.isOverflowing = this.tagGroup.clientWidth < this.tagGroup.scrollWidth)
        )
    }

    previous(): void {
        if (!this.isOverflowing || this.isScrolledToTheLeft) return

        const children: HTMLCollection = this.tagGroup.children
        for (let i = children.length - 1; i >= 0; i--) {
            const child = children.item(i) as HTMLElement

            if (child.offsetLeft < this.tagGroup.scrollLeft) {
                this.tagGroup.scrollTo({
                    left: child.offsetLeft + child.offsetWidth - this.tagGroup.clientWidth,
                    behavior: 'smooth',
                })
                break
            }
        }
    }

    next(): void {
        if (!this.isOverflowing || this.isScrolledToTheRight) return

        const children: HTMLCollection = this.tagGroup.children
        for (let i = 0; i < children.length; i++) {
            const child = children.item(i) as HTMLElement

            if (
                child.offsetLeft + child.offsetWidth >
                this.tagGroup.scrollLeft + this.tagGroup.clientWidth
            ) {
                this.tagGroup.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
                break
            }
        }
    }

    renderArrows(): void {
        this.isScrolledToTheLeft = this.tagGroup.scrollLeft === 0
        const scrollPosition = this.tagGroup.scrollLeft + this.tagGroup.offsetWidth
        // We have to tet value +-1 because scrollLeft property can be minus 1 its original size
        this.isScrolledToTheRight =
            scrollPosition === this.tagGroup.scrollWidth ||
            scrollPosition + 1 === this.tagGroup.scrollWidth
    }
}
</script>

<style scoped lang="scss">
.tag-group-wrapper {
    overflow: hidden;
    position: relative;

    &::before {
        content: '';
        z-index: 10;
        position: absolute;
        top: 0;
        left: 0;
        width: 10px;
        height: 100%;
        background: linear-gradient(90deg, rgba(0, 0, 0, 0.25), transparent);
        opacity: 0;
    }

    &.left-shadow::before {
        opacity: 1;
    }

    &::after {
        content: '';
        z-index: 10;
        position: absolute;
        top: 0;
        right: 0;
        width: 10px;
        height: 100%;
        background: linear-gradient(270deg, rgba(0, 0, 0, 0.25), transparent);
        opacity: 0;
    }

    &.right-shadow::after {
        opacity: 1;
    }

    .tag-group {
        position: relative;
        overflow: hidden;
        scroll-behavior: smooth;
        display: flex;
        //column-gap: 8px;
        column-gap: 4px;

        &__chip {
            flex-shrink: 0;
        }
    }
}

.navigation-icon {
    opacity: 0.7;

    &:hover {
        opacity: 1;
    }

    &.disabled {
        opacity: 0.3;
        cursor: default !important;
    }

    &:focus::after {
        opacity: 0 !important;
    }
}
</style>
