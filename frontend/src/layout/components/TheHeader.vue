<template>
    <div class="d-flex justify-end flex-fill">
        <span class="version" :title="`Tout version ${version}`">v{{ version }}</span>
    </div>
</template>

<script lang="ts">
import { version } from '@/environments/environment.dev'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class TheHeader extends Vue {
    version = version
}
</script>

<style scoped lang="scss">
.version {
    font-size: 0.95rem;
    color: #bdbdbd;
}
</style>
