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
