<template>
    <div id="app">
        <AppMain />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import AppMain from '@/layout/AppMain.vue'

export default Vue.extend({
    name: 'App',
    components: {
        AppMain,
    },
})
</script>

<style lang="scss">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

// Todo : move to a generic scss file
.cursor-pointer {
    cursor: pointer;
}

.cursor-default {
    cursor: default !important;
}

.text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.opacity-60 {
    opacity: 0.6;
}

* {
    scrollbar-width: thin;
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
    width: 40% !important;
    left: 60% !important;
    border-radius: 0 !important;
    margin: 0 !important;
}

.gap-1 {
    gap: 4px;
}

.hide-scroll {
    overflow-y: hidden !important;
}

.two-row-error.v-input {
    .v-messages {
        min-height: 26px;
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
