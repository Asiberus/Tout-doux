<template>
    <h4 class="text-h5 text-md-h4 mb-2 mb-md-3">
        <slot></slot>
    </h4>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class TertiaryTitle extends Vue {}
</script>
