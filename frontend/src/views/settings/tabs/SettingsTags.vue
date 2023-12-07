<template>
    <div class="fill-height d-flex flex-column">
        <TertiaryTitle>Tags</TertiaryTitle>
        <p class="text-subtitle-2 text-sm-subtitle-1 mb-1">
            Tags are useful to group or filter items. Two types of tag are available : project tag
            and task tag (used for Task, Common Task and Daily Task).
        </p>

        <div class="d-flex justify-space-between align-center mb-1">
            <v-chip-group v-model="tab" mandatory active-class="active">
                <v-chip
                    v-for="type of tagTypes"
                    :key="type"
                    :value="type"
                    :ripple="false"
                    class="text-overline outlined px-3 px-sm-6 py-3">
                    {{ type }}
                </v-chip>
            </v-chip-group>

            <v-btn @click="openTagDialog()">
                <v-icon left>mdi-plus</v-icon>
                tag
            </v-btn>
        </div>

        <SettingsTagList :type="tab" ref="tagList"></SettingsTagList>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { TagType } from '@/models/tag.model'
import TagCard from '@/views/components/tag/TagCard.vue'
import TagDialog from '@/views/components/tag/TagDialog.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import SettingsTagList from '@/views/settings/components/SettingsTagList.vue'
import TertiaryTitle from '@/components/TertiaryTitle.vue'

@Component({
    components: { TertiaryTitle, TagCard, TagDialog, EmptyListDisplay, SettingsTagList },
})
export default class SettingsTags extends Vue {
    tagTypes: TagType[] = ['project', 'task']
    tab: TagType = 'project'

    get tagList(): SettingsTagList {
        return this.$refs.tagList as SettingsTagList
    }

    openTagDialog(): void {
        this.tagList.openTagDialog()
    }
}
</script>

<style scoped lang="scss">
.v-chip {
    text-transform: capitalize;
}

.outlined {
    background-color: transparent !important;
    border-width: thin;
    border-style: solid;
}

.active {
    background-color: white !important;
    color: #212121 !important;

    &::before {
        opacity: 0 !important;
    }
}
</style>
