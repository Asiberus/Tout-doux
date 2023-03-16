<template>
    <div>
        <div class="text-h4">General</div>
        <p class="text-subtitle-1">Some preferences and general settings.</p>

        <div class="d-flex flex-wrap">
            <div
                v-for="color of colors"
                :key="color"
                :style="{ backgroundColor: color }"
                class="color"></div>
        </div>
        <v-divider class="my-3"></v-divider>
        <v-chip v-for="color of colors" :key="'color' + color" :color="color" class="ma-1">
            Nom Tag
        </v-chip>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { TAG_COLOR_OPTIONS } from '@/utils/constants'

@Component
export default class SettingsGeneral extends Vue {
    colors = TAG_COLOR_OPTIONS
}
</script>

<style scoped lang="scss">
.color {
    width: 100px;
    height: 75px;
    margin: 4px;
}
</style>
