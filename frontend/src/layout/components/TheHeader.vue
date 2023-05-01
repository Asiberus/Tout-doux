<template>
    <div class="flex-fill d-flex justify-end align-center">
        <span class="version mr-2" :title="`Tout Doux version : ${version}`">v{{ version }}</span>
        <v-hover v-slot="{ hover }">
            <v-btn
                :to="{ name: 'settings-preferences' }"
                title="Settings"
                plain
                class="header-button">
                <v-icon :color="hover ? 'white' : 'grey lighten-1'">mdi-cog</v-icon>
            </v-btn>
        </v-hover>

        <v-hover v-slot="{ hover }">
            <v-btn @click="logout()" title="Logout" plain class="header-button">
                <v-icon :color="hover ? 'white' : 'grey lighten-1'">mdi-logout</v-icon>
            </v-btn>
        </v-hover>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { config } from '@/config'
import { authService } from '@/services'

@Component
export default class TheHeader extends Vue {
    version = config.VERSION

    logout(): void {
        authService.logout().then(() => this.$router.push({ name: 'login' }))
    }
}
</script>

<style scoped lang="scss">
.version {
    font-size: 0.95rem;
    color: #bdbdbd;
}

.header-button {
    padding: 0 8px !important;
    min-width: 0 !important;
}
</style>
