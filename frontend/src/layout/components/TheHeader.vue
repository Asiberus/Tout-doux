<template>
    <div class="d-flex justify-end flex-fill">
        <span class="version" :title="`Tout Doux version : ${version}`">v{{ version }}</span>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { config } from '@/config'

@Component
export default class TheHeader extends Vue {
    version = config.VERSION
}
</script>

<style scoped lang="scss">
.version {
    font-size: 0.95rem;
    color: #bdbdbd;
}
</style>
