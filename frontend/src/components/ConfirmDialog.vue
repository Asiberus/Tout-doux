<script setup lang="ts">
import { getConfirmDialogWidth } from '@/utils/dialog.utils'
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const show = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  confirm: []
}>()

const dialogState = ref(false)

watch(
  () => show,
  value => {
    dialogState.value = value
  }
)

function setDialogStateTo(value: boolean): void {
  dialogState.value = value
  show.value = value
}

function confirm(): void {
  emit('confirm')
  setDialogStateTo(false)
}
</script>

<template>
  <v-dialog
    :model-value="dialogState"
    :width="getConfirmDialogWidth()"
    :fullscreen="display.xs"
    @update:model-value="setDialogStateTo($event)">
    <template #activator="{ props }">
      <slot name="activator" v-bind="props"></slot>
    </template>
    <v-card class="d-flex flex-column">
      <v-card-text class="flex-grow-1 d-flex flex-column justify-center align-stretch px-6 py-10">
        <div class="icon-wrapper text-white">
          <span class="icon-content">
            <slot name="icon">!</slot>
          </span>
        </div>

        <div class="dialog-message text-h6 text-md-h5 text-white">
          <slot></slot>
        </div>

        <div class="d-flex justify-center gap-2">
          <v-btn
            color="error"
            variant="outlined"
            class="flex-grow-1 flex-md-grow-0"
            @click="setDialogStateTo(false)">
            Cancel
          </v-btn>
          <v-btn color="success" class="flex-grow-1 flex-md-grow-0" @click="confirm()">
            Confirm
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

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
  margin: 0 auto 1rem;
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
  margin-bottom: 1rem;
  text-align: center;
}
</style>
