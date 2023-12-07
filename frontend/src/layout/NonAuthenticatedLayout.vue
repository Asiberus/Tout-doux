<template>
    <v-app>
        <div style="position: absolute; top: 1rem; right: 1rem">
            {{ $vuetify.breakpoint.width }}
            {{ $vuetify.breakpoint.height }}
        </div>
        <div class="non-authenticated-layout">
            <router-link :to="{ name: 'login' }" class="non-authenticated-layout__title green--text"
                >Tout Doux</router-link
            >

            <div class="non-authenticated-layout__content">
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
@import '~vuetify/src/styles/styles.sass';

.non-authenticated-layout {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 48px 12px 0;

    &__title {
        text-decoration: none;
        text-align: center;
        font-size: 4rem;
        line-height: 4rem;
        font-weight: 300;
        font-family: Roboto, sans-serif;
        letter-spacing: -0.015625em; // from vuetify text-h1 class
    }

    &__content {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding-bottom: 4rem; // use to center the content
    }
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
    .non-authenticated-layout {
        align-items: center;
        padding: 48px 48px 0;

        &__title {
            font-size: 6rem;
            line-height: 6rem;
        }

        &__content {
            padding-bottom: 6rem; // use to center the content
            width: 400px;
        }
    }
}
</style>
