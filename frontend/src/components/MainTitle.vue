<template>
    <div class="d-flex align-center gap-2">
        <v-icon
            v-if="icon"
            :large="$vuetify.breakpoint.smOnly"
            :x-large="$vuetify.breakpoint.mdAndUp">
            {{ icon }}
        </v-icon>
        <h1 class="text-h4 text-md-h3">
            <slot></slot>
        </h1>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class MainTitle extends Vue {
    @Prop({ required: false }) icon?: string
}
</script>
