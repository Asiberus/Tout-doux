<template>
  <v-card class="mb-4" elevation="5">
    <v-card-title class="d-flex justify-space-between align-center">
      <p class="mb-0">Create task</p>
      <v-card-actions class="float-right">
        <v-btn color="success" small @click="$emit('submit')">
          <v-icon>mdi-check</v-icon>
        </v-btn>
        <v-btn color="error" small class="ml-1" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card-title>
    <v-card-text>
      <v-form>
        <v-row align-content="center">
          <v-col cols="10">
            <v-text-field label="Name" counter="50" maxlength="50"></v-text-field>
          </v-col>
          <v-col cols="2" class="d-flex justify-center align-center">
            <v-checkbox label="Important" hide-details class="mt-0"></v-checkbox>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";

@Component
export default class CreateTaskCard extends Vue {

}
</script>

<style lang="scss" scoped>

</style>