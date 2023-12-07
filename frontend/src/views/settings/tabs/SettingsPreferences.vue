<template>
    <div v-if="preferences">
        <TertiaryTitle>Preferences</TertiaryTitle>

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
                        :size="progressWheelSize"
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
import TertiaryTitle from '@/components/TertiaryTitle.vue'

@Component({ components: { TertiaryTitle, ProgressWheel } })
export default class SettingsPreferences extends Vue {
    ProgressWheelMode = ProgressWheelMode

    get preferences(): Preferences | undefined {
        return this.$store.state.preferences.preferences
    }

    get progressWheelSize(): 'x-small' | 'small' | 'medium' | 'large' | 'x-large' {
        if (this.$vuetify.breakpoint.xsOnly) return 'x-small'
        if (this.$vuetify.breakpoint.smAndDown) return 'small'
        else if (this.$vuetify.breakpoint.width < 1600) return 'medium'
        else return 'x-large'
    }

    updatePreferences(progressWheelMode: ProgressWheelMode): void {
        this.$store.dispatch(preferencesActions.updatePreferences, { progressWheelMode })
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.progress-wheel-wrapper {
    display: flex;
    gap: 8px;

    @media #{map-get($display-breakpoints, 'xs-only')} {
        flex-direction: column;
    }

    .progress-wheel-card {
        flex-grow: 1;
        position: relative;
        display: flex;
        justify-content: center;
        padding: 24px 0;
        background-color: transparent;
        border: 2px solid var(--v-secondary-base);
        cursor: pointer;

        @media #{map-get($display-breakpoints, 'md-and-up')} {
            // We don't display hover for mobile
            &:hover {
                background-color: var(--v-secondary-darken1);
            }
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
