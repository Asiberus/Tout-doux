<template>
    <v-app>
        <div class="non-authenticated-layout">
            <div class="router-view-wrapper">
                <router-link :to="{ name: 'login' }">
                    <h1 class="text-h1 green--text mb-6 text-center">Tout Doux</h1>
                </router-link>

                <router-view />
            </div>
        </div>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class NonAuthenticatedLayout extends Vue {}
</script>

<style scoped lang="scss">
.non-authenticated-layout {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .router-view-wrapper {
        min-width: 400px;

        a {
            text-decoration: none;
            color: inherit;
        }
    }
}
</style>
