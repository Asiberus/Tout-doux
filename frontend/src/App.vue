<template>
  <div id="app">
    <AppMain></AppMain>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import AppMain from "@/layout/AppMain.vue";


export default Vue.extend({
  name: 'App',
  components: {
    AppMain
  }
});
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: white;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
