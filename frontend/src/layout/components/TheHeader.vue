<template>
    <div class="flex-fill d-flex justify-end align-center">
        <span class="version mr-2" :title="`Tout Doux version : ${version}`">v{{ version }}</span>
        <v-hover v-slot="{ hover }">
            <router-link :to="{ name: 'settings-general' }" title="Settings">
                <v-icon :color="hover ? 'white' : 'grey lighten-1'">mdi-cog</v-icon>
            </router-link>
        </v-hover>
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
