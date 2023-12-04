<template>
    <div v-if="preferences">
        <h4 class="text-h4 mb-4">Preferences</h4>
        <p class="text-subtitle-1 mb-1">
            You can here personalize the layout and the behavior of some components.
        </p>

        <h5 class="text-h6 mb-2">Progress Wheel</h5>
        <div class="progress-wheel-wrapper">
            <template v-for="mode of [ProgressWheelMode.Number, ProgressWheelMode.Percent]">
                <v-sheet
                    @click="updatePreferences(mode)"
                    v-ripple
                    class="progress-wheel-card rounded-lg"
                    :class="{ selected: preferences.progressWheelMode === mode }">
                    <template v-if="preferences.progressWheelMode === mode">
                        <v-icon class="radio-button" color="accent">mdi-radiobox-marked</v-icon>
                    </template>
                    <template v-else>
                        <v-icon class="radio-button">mdi-radiobox-blank</v-icon>
                    </template>

                    <ProgressWheel
                        :mode="mode"
                        size="x-large"
                        value="14"
                        max="20"
                        color="green accent-2">
                    </ProgressWheel>
                </v-sheet>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ProgressWheel from '@/components/ProgressWheel.vue'
import { ProgressWheelMode, Preferences } from '@/models/preferences.model'
import { preferencesActions } from '@/store/modules/preferences.store'

@Component({ components: { ProgressWheel } })
export default class SettingsPreferences extends Vue {
    ProgressWheelMode = ProgressWheelMode

    get preferences(): Preferences | undefined {
        return this.$store.state.preferences.preferences
    }

    updatePreferences(progressWheelMode: ProgressWheelMode): void {
        this.$store.dispatch(preferencesActions.updatePreferences, { progressWheelMode })
    }
}
</script>

<style scoped lang="scss">
.progress-wheel-wrapper {
    display: grid;
    grid-template-columns: repeat(2, 50%);
    column-gap: 8px;

    .progress-wheel-card {
        position: relative;
        display: flex;
        justify-content: center;
        padding: 24px 0;
        background-color: transparent;
        border: 2px solid var(--v-secondary-base);
        cursor: pointer;

        &:hover {
            background-color: var(--v-secondary-darken1);
        }

        &.selected {
            border-color: var(--v-accent-base);
        }

        .radio-button {
            position: absolute;
            top: 16px;
            left: 16px;
        }
    }
}
</style>
