<template>
  <div>
    <h1 class="text-center pa-3">Tout Doux</h1>
    <v-divider></v-divider>
    <v-list>
      <v-list-item v-for="(item, i) in menu" :key="i" :to="item.link">
        <v-list-item-content>
          <v-list-item-title>{{item.name}}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </div>

</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";

@Component
export default class TheNavbar extends Vue {

  private menu = [
    {name: 'Dashboard', link: '/'},
    {name: 'Project', link: '/project'},
    {name: 'ToDo', link: '/'},
    {name: 'Liste', link: '/'},
  ];

}
</script>

<style scoped lang="scss">

</style>