<template>
    <h1 class="text-h4 text-md-h3">
        <slot></slot>
    </h1>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class MainTitle extends Vue {}
</script>
