<template>
    <v-dialog
        :value="dialogState"
        @input="setDialogStateTo($event)"
        :width="getConfirmDialogWidth()"
        :fullscreen="$vuetify.breakpoint.xsOnly">
        <template #activator="{ attrs, on }">
            <slot name="activator" :attrs="attrs" :on="on"></slot>
        </template>
        <v-card class="d-flex flex-column">
            <v-card-text class="flex-grow-1 d-flex flex-column justify-center align-stretch">
                <div class="icon-wrapper white--text">
                    <span class="icon-content">
                        <slot name="icon">!</slot>
                    </span>
                </div>

                <div class="dialog-message white--text">
                    <slot></slot>
                </div>

                <div class="d-flex justify-center gap-2">
                    <v-btn @click="confirm()" color="success" class="flex-grow-1 flex-md-grow-0">
                        Confirm
                    </v-btn>
                    <v-btn
                        @click="setDialogStateTo(false)"
                        color="error"
                        class="flex-grow-1 flex-md-grow-0">
                        Cancel
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { getConfirmDialogWidth } from '@/utils/dialog.utils'

@Component({ methods: { getConfirmDialogWidth } })
export default class ConfirmDialog extends Vue {
    @Prop({ default: false }) value!: boolean
    dialogState = false

    @Watch('value')
    private onDialogOpening(value: boolean): void {
        this.dialogState = value
    }

    setDialogStateTo(value: boolean): void {
        this.dialogState = value
        this.$emit('input', value)
    }

    confirm(): void {
        this.$emit('confirm')
        this.setDialogStateTo(false)
    }
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
        transform: translateY(10px) scale(0.7);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 10rem;
    width: 10rem;
    border-radius: 50%;
    border: 0.4rem solid;
    line-height: 7em;
    margin: 2rem auto 2rem;
    user-select: none;

    animation: animate-icon-circle 0.2s ease-in;

    .icon-content {
        display: flex;
        align-items: center;
        font-size: 3rem;

        animation: animate-icon-content 0.4s cubic-bezier(0.63, 0, 0.39, 1.78);
    }
}

.dialog-message {
    font-size: 1.8rem;
    line-height: 2rem;
    margin-bottom: 2rem;
    text-align: center;
}
</style>
