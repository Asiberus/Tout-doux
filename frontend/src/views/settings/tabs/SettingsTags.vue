<template>
    <div>
        <h4 class="text-h4 mb-4">Tags</h4>
        <p class="text-body-1 mb-3">
            Tags are useful to group or filter items. Two types of tag are available : project tag
            or task tag. task tag can be used in Task, Daily Task or Common Task.
        </p>

        <div class="d-flex justify-space-between align-center mb-2">
            <v-chip-group v-model="tab" mandatory active-class="accent--text">
                <v-chip
                    v-for="type of tagTypes"
                    :key="type"
                    :value="type"
                    outlined
                    class="px-6 py-3 text-overline">
                    {{ type }}
                </v-chip>
            </v-chip-group>

            <v-btn @click="openTagDialog()">
                <v-icon left>mdi-plus</v-icon>
                tag
            </v-btn>
        </div>

        <SettingsTagList v-show="tab === 'project'" type="project" ref="projectTag">
        </SettingsTagList>
        <SettingsTagList v-show="tab === 'task'" type="task" ref="taskTag"></SettingsTagList>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { TagType } from '@/models/tag.model'
import TagCard from '@/views/settings/components/TagCard.vue'
import TagDialog from '@/views/settings/components/TagDialog.vue'
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import TagChip from '@/components/TagChip.vue'
import SettingsTagList from '@/views/settings/components/SettingsTagList.vue'

@Component({
    components: { TagCard, TagDialog, EmptyListDisplay, TagChip, SettingsTagList },
})
export default class SettingsTags extends Vue {
    tagTypes: TagType[] = ['project', 'task']
    tab: TagType = 'project'

    get projectTag(): SettingsTagList {
        return this.$refs.projectTag as SettingsTagList
    }

    get taskTag(): SettingsTagList {
        return this.$refs.taskTag as SettingsTagList
    }

    openTagDialog(): void {
        if (this.tab === 'project') this.projectTag.openTagDialog()
        else if (this.tab === 'task') this.taskTag.openTagDialog()
    }
}
</script>

<style scoped lang="scss">
.v-chip {
    text-transform: capitalize;
}
</style>
