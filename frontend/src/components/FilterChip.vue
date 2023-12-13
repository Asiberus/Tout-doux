<template>
    <v-chip @click="active = !active" :color="active ? color : 'grey darken-4'">
        <v-icon v-if="active" small class="mr-1">{{ icon }}</v-icon>
        <v-icon v-else small class="mr-1">mdi-checkbox-blank-outline</v-icon>
        <slot></slot>
    </v-chip>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue } from 'vue-property-decorator'

@Component
export default class FilterChip extends Vue {
    @VModel() active!: boolean
    @Prop({ required: true }) color!: string
    @Prop({ required: true }) icon!: string
}
</script>
