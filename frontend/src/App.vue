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
</style>
