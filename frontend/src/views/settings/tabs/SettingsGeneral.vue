<template>
    <div v-if="settings">
        <h4 class="text-h4">General</h4>
        <p class="text-subtitle-1">Some preferences and general settings.</p>

        <h5 class="text-h5 mb-3">Progress Wheel</h5>
        <div class="progress-wheel-wrapper">
            <template v-for="mode of [ProgressWheelMode.Number, ProgressWheelMode.Percent]">
                <v-sheet
                    @click="updateSettings(mode)"
                    v-ripple
                    class="progress-wheel-card rounded-lg"
                    :class="{ selected: settings.progressWheelMode === mode }">
                    <template v-if="settings.progressWheelMode === mode">
                        <v-icon class="radio-button" color="accent">mdi-radiobox-marked</v-icon>
                    </template>
                    <template v-else>
                        <v-icon class="radio-button">mdi-radiobox-blank</v-icon>
                    </template>

                    <ProgressWheel
                        :mode="mode"
                        size="large"
                        value="14"
                        max="20"
                        color="green accent-2">
                    </ProgressWheel>
                </v-sheet>
            </template>
        </div>

        <div class="d-flex flex-wrap mt-16">
            <div
                v-for="color of colors"
                :key="color"
                :style="{ backgroundColor: color }"
                class="color"></div>
        </div>
        <v-divider class="my-3"></v-divider>
        <v-chip v-for="color of colors" :key="'color' + color" :color="color" class="ma-1">
            Nom Tags
        </v-chip>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { TAG_COLOR_OPTIONS } from '@/utils/constants'

import ProgressWheel from '@/components/ProgressWheel.vue'
import { ProgressWheelMode, Settings } from '@/models/settings.model'
import { settingsService } from '@/api'
import { settingsActions } from '@/store/modules/settings.store'

@Component({ components: { ProgressWheel } })
export default class SettingsGeneral extends Vue {
    colors = TAG_COLOR_OPTIONS

    ProgressWheelMode = ProgressWheelMode

    get settings(): Settings | undefined {
        return this.$store.state.settings.settings
    }

    updateSettings(progressWheelMode: ProgressWheelMode): void {
        this.$store.dispatch(settingsActions.updateSettings, { progressWheelMode })
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

.color {
    width: 100px;
    height: 75px;
    margin: 4px;
}
</style>
