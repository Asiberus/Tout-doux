<template>
  <div class="img-wrapper">
    <slot name="img"></slot>
    <div class="img-description">
      <slot name="message">{{message}}</slot>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator";

@Component
export default class EmptyListDisplay extends Vue {
  @Prop() private message!: string;
}
</script>

<style scoped lang="scss">
.img-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;

  img {
    max-width: 350px;
  }

  .img-description {
    margin-top: 1rem;
  }

}
</style>