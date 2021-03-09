<template>
  <div id="app">
    <v-app>
      <v-navigation-drawer app><TheNavbar></TheNavbar></v-navigation-drawer>
      <v-app-bar app dense></v-app-bar>
      <v-main>
        <v-container fluid>APP</v-container>
      </v-main>
    </v-app>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import TheNavbar from "@/core/components/the-navbar.vue";

export default Vue.extend({
  name: 'App',
  components: {
    TheNavbar
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
