<template>
    <div class="wrapper">
        <span class="value">{{ value }}</span>
        <span class="separator">/</span>
        <span class="max">{{ max }}</span>
        <v-icon v-if="showIcon">mdi-trophy</v-icon>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class TaskCounter extends Vue {
    @Prop({ required: true }) value!: number
    @Prop({ required: true }) max!: number
    @Prop({ required: false, default: true }) showIcon!: boolean
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.wrapper {
    display: flex;
    align-items: baseline;
    column-gap: 4px;
}

.value {
    font-size: 2rem;
    line-height: 2rem;
    color: white;
}

.separator {
    font-size: 1.25rem;
    color: #{map-get($grey, 'lighten-2')};
}

.max {
    font-size: 1.5rem;
    line-height: 1.5rem;
    color: #{map-get($grey, 'lighten-2')};
    transform: translateY(1px);
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
    .value {
        font-size: 1.75rem;
    }

    .separator {
        font-size: 1rem;
    }

    .max {
        font-size: 1.25rem;
    }
}
</style>
