<template>
    <h2 class="text-h5 text-sm-h4">
        <slot></slot>
    </h2>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class SecondaryTitle extends Vue {}
</script>
