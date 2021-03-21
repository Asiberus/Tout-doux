<template>
  <v-dialog v-model="dialog">
    <template #activator="{ on, attrs }">
      <slot name="activator" v-bind="attrs" v-on="on"></slot>
    </template>
    <template #default>
      <v-card>
        <v-card-text>
          <div class="d-flex flex-column align-center">
            <div class="icon-wrapper">
              <span class="icon-content">!</span>
            </div>
            <div class="dialog-message">
              <slot></slot>
            </div>
            <div class="d-flex justify-center">
              <v-btn color="success" large class="mr-2">Confirm</v-btn>
              <v-btn color="error" large>Cancel</v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </v-dialog>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";

@Component
export default class ConfirmDialog extends Vue {
  @Prop() private dialog!: boolean;
  @Prop() private color!: string;
}
</script>

<style scoped lang="scss">
@keyframes animate-icon-circle {
  from {
    opacity: 0;
    transform: scale(1, 0);
  }
  to {
    opacity: 1;
    transform: scale(1, 1);
  }
}

@keyframes animate-icon-content {
  from {
    opacity: 0;
    transform: translateY(10px) scale(.7);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-message {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10rem;
  width: 10rem;
  border-radius: 50%;
  border: .5rem solid red;
  line-height: 7em;
  margin: 2rem auto 2rem;
  user-select: none;

  animation: animate-icon-circle .2s ease-in;

  .icon-content {
    display: flex;
    align-items: center;
    font-size: 3rem;

    animation: animate-icon-content .4s cubic-bezier(.63, 0, .39, 1.78);
  }
}
</style>