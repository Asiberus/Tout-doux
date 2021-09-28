<template>
    <v-progress-circular :value="percentage" :color="color" :rotate="-90"
                         :size="size" :width="width">
        <div>
            <span style="font-size: 2.5em;">{{ value }}</span>
            /
            <span style="font-size: 1em; transform: translateY(0.3em); display: inline-block">
                {{ max }}
              </span>
        </div>
    </v-progress-circular>
</template>

<script lang="ts">
  import {Vue, Component, Prop} from 'vue-property-decorator';

  const colorArray = ['green lighten-4', 'green lighten-3', 'green lighten-2', 'green lighten-1', 'green'];



  @Component
  export default class ProgressCircular extends Vue {
    @Prop({ default: 0 }) value!: number;
    @Prop({ default: 100 }) max!: number;
    @Prop({ default: 200 }) size?: number;
    @Prop({ default: 20 }) width?: number;
    @Prop({ default: () => colorArray }) colorArray?: string[];

    get percentage(): number {
      return (this.value / this.max) * 100;
    }

    get color(): string {
      if (!this.colorArray) return '';
      const index = Math.trunc(this.percentage * this.colorArray.length / 100) - 1;
      return colorArray[index];
    }
  }
</script>

<style scoped>

</style>
