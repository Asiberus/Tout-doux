<template>
    <v-app class="non-authenticated-layout">
        <header class="non-authenticated-layout__header">
            <router-link
                :to="{ name: 'login' }"
                class="non-authenticated-layout__header__title green--text text-center">
                Tout Doux
            </router-link>
        </header>
        <div class="non-authenticated-layout__content">
            <div class="non-authenticated-layout__content__wrapper">
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
    &__header {
        display: flex;
        justify-content: center;

        &__title {
            margin-top: 4rem;
            text-decoration: none;
            font-size: 8rem;
            line-height: 8rem;
            font-weight: 300;
            font-family: Roboto, sans-serif;
            letter-spacing: -0.015625em; // from vuetify text-h1 class
        }
    }

    &__content {
        margin-top: -4rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        &__wrapper {
            min-width: 400px;
        }
    }
}
</style>
