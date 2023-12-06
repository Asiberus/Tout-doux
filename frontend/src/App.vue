<template>
    <router-view />
</template>

<script lang="ts">
import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component
export default class App extends Vue {}
</script>

<style lang="scss">
@import '~vuetify/src/styles/styles.sass';

#app {
    font-family: Roboto, Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

// Todo : move to a generic scss file

body {
    background: #121212; // Background color of vuetify dark theme
}

.h-100 {
    height: 100%;
}

input:autofill {
    background: none;
}

.cursor-pointer {
    cursor: pointer;
}

.cursor-default {
    cursor: default !important;
}

.opacity-60 {
    opacity: 0.6;
}

.text-link {
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

* {
    scrollbar-width: thin;
}

.v-card--link:focus::before {
    opacity: 0 !important;
}

.v-calendar-weekly {
    &__head-weekday {
        margin-right: 0 !important;
    }

    &__day {
        margin-right: 0 !important;

        &.v-present {
            background-color: #424242;

            .v-event-more {
                background-color: #424242 !important;
            }
        }
    }

    &__day-label {
        cursor: default !important;
    }
}

.half-dialog {
    position: fixed;
    top: 0;
    right: 0;
    height: 100% !important;
    max-height: 100% !important;
    width: 100% !important;
    left: 0 !important;
    border-radius: 0 !important;
    margin: 0 !important;

    @media only screen and (400px < width < 600px) {
        width: 90% !important;
        left: 10% !important;
    }

    @media #{map-get($display-breakpoints, 'sm-only')} {
        width: 80% !important;
        left: 20% !important;
    }

    @media #{map-get($display-breakpoints, 'md-only')} {
        width: 60% !important;
        left: 40% !important;
    }

    @media #{map-get($display-breakpoints, 'lg-and-up')} {
        width: 40% !important;
        left: 60% !important;
    }
}

.gap-1 {
    gap: 4px;
}

.gap-2 {
    gap: 8px;
}

.gap-3 {
    gap: 12px;
}

.gap-4 {
    gap: 16px;
}

.row-gap-1 {
    row-gap: 4px;
}

.column-gap-2 {
    column-gap: 8px;
}

.column-gap-6 {
    column-gap: 24px;
}

.hide-scroll {
    overflow-y: hidden !important;
}

.background-black {
    background-color: #0a0a0a;
}

.two-row-error.v-input {
    .v-messages {
        min-height: 26px;
    }
}

.v-autocomplete__content.background-elevation {
    // Correspond to vuetify elevation-8
    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14),
        0 3px 14px 2px rgba(0, 0, 0, 0.12) !important;
    background-color: #212121;
}

.daily-update-stepper {
    flex: 1;
    display: flex;
    flex-direction: column;
    box-shadow: none !important;
    background: transparent !important;
    border: none !important;

    .v-stepper__header {
        box-shadow: none !important;
        margin-bottom: 4px;
    }

    .v-stepper__items {
        flex-grow: 1;
    }

    .v-stepper__content {
        height: 100%;
        padding: 0 !important;
    }

    .v-stepper__wrapper,
    .v-window__container {
        height: 100%;
    }

    .v-window-item {
        height: 100%;
        display: flex;
        flex-direction: column;
    }
}

// TODO : fix scroll bar design
//::-webkit-scrollbar {
//  height: 0.4rem;
//  width: 0.4rem;
//}
//
//::-webkit-scrollbar-track {
//  border-radius: 1rem;
//}
//
//::-webkit-scrollbar-thumb {
//  background: #d4d4d4;
//  border-radius: 1.5rem;
//}
//
//::-webkit-scrollbar-thumb:hover {
//  background: #c4c4c4;
//}
</style>
