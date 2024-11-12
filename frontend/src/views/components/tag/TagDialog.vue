<script setup lang="ts">
import { Tag, TagForm, TagType } from '@/models/tag.model'
import { Form } from '@/models/common.model'
import { TAG_COLOR_OPTIONS } from '@/utils/constants'
import { IsTagNameUniqueParams } from '@/api/tag.api'
import { tagApi } from '@/api'
import { computed, onBeforeMount, ref, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  tag?: Tag
  isDialogOpen: boolean
  type: TagType
}>()

const emit = defineEmits<{
  create: [data: TagForm]
  update: [id: number, data: TagForm]
  delete: [id: number]
  close: []
}>()

const formRef = useTemplateRef('form')
const inputNameRef = useTemplateRef('name')

onBeforeMount(() => populateForm())

const confirmDelete = ref(false)
const colorPicker = ref(false)

const nameUniqueError = ref<string | null>(null)
const inputNameLoading = ref(false)
let validationTimer: number | undefined = undefined

const tagForm: Form<TagForm> = ref({
  valid: false,
  pending: false,
  data: {
    type: props.type, // Todo : test if this work
    name: '',
    color: TAG_COLOR_OPTIONS[0],
  },
  rules: {
    name: [
      (value: string): boolean | string => !!value || 'Tag name is required',
      (value: string): boolean | string => value.length <= 20 || 'Max 20 characters',
    ],
  },
})

const title = computed<string>(() => `${props.tag ? 'Update' : 'Create'} ${props.type} tag`)

watch(
  () => props.isDialogOpen,
  (value: boolean) => {
    if (value) {
      confirmDelete.value = false
      nameUniqueError.value = null
      formRef.value.resetValidation()
      populateForm()
      if (!props.tag) inputNameRef.value.focus()
    }
  }
)

function populateForm(): void {
  if (props.tag) {
    const { type, name, color } = props.tag
    tagForm.value.data.type = type
    tagForm.value.data.name = name
    tagForm.value.data.color = color
  } else {
    tagForm.value.data.type = props.type
    tagForm.value.data.name = ''
    tagForm.value.data.color = TAG_COLOR_OPTIONS[0]
  }
}

function validateName(value: string): void {
  clearTimeout(validationTimer)

  if (value === '') {
    nameUniqueError.value = null
    return
  }

  tagForm.value.pending = true
  validationTimer = setTimeout(() => isNameUnique(value), 300)
}

function isNameUnique(name: string): void {
  const params: IsTagNameUniqueParams = {
    type: props.type,
    name,
    exclude_id: props.tag?.id,
  }

  inputNameLoading.value = true
  tagApi
    .isNameUnique(params)
    .then(({ unique }) => {
      nameUniqueError.value = !unique ? 'A tag with that name already exist' : null
    })
    .catch(error => console.error(error))
    .finally(() => {
      inputNameLoading.value = false
      tagForm.value.pending = false
    })
}

function selectColor(color: string): void {
  tagForm.value.data.color = color
  colorPicker.value = false
}

function emitSubmitEvent(): void {
  if (!tagForm.value.valid || tagForm.value.pending) return

  if (props.tag) emit('update', props.tag.id, tagForm.value.data)
  else emit('create', tagForm.value.data)
}

function emitDeleteTag(): void {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }

  if (props.tag) emit('delete', props.tag.id)
}

function emitCloseEvent(): void {
  emit('close')
}
</script>

<template>
  <v-card class="d-flex flex-column">
    <div class="d-flex justify-space-between align-center px-6 pt-4 pb-2">
      <h4 class="text-h5 text-sm-h4 text-capitalize">{{ title }}</h4>
      <div v-if="tag">
        <v-hover v-slot="{ hover }">
          <v-btn :color="hover || confirmDelete ? 'error' : null" @click="emitDeleteTag()">
            {{ confirmDelete ? 'Are you sure ?' : 'Delete Tag' }}
          </v-btn>
        </v-hover>
      </div>
    </div>
    <v-card-text class="flex-grow-1 d-flex flex-column">
      <v-form
        ref="form"
        v-model="tagForm.valid"
        class="flex-grow-1 d-flex flex-column"
        @submit.prevent="emitSubmitEvent()">
        <div class="d-flex flex-column flex-md-row align-stretch align-md-center">
          <v-text-field
            ref="name"
            v-model="tagForm.data.name"
            label="Name"
            counter="20"
            requried
            :loading="inputNameLoading"
            :rules="tagForm.rules.name"
            :error-messages="nameUniqueError"
            :autofocus="!tag"
            class="flex-grow-1 mb-3 mb-md-0"
            @update:model-value="validateName">
          </v-text-field>
          <div class="ml-md-6 mr-md-3 pt-md-3 d-flex align-center">
            <div class="text-body-1">Color :</div>
            <v-menu
              ref="colorPickerMenu"
              v-model="colorPicker"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              nudge-bottom="5"
              min-width="0"
              max-width="fit-content">
              <template #activator="{ props: menuProps }">
                <v-chip :color="tagForm.data.color" class="color-chip" v-bind="menuProps" />
              </template>
              <div class="color-picker">
                <div
                  v-for="color of TAG_COLOR_OPTIONS"
                  class="color-picker__item"
                  @click="selectColor(color)">
                  <div
                    class="color-picker__item__color"
                    :style="{ backgroundColor: color }"
                    :class="{ selected: tagForm.data.color === color }"></div>
                </div>
              </div>
            </v-menu>
          </div>
        </div>

        <v-spacer />

        <div class="d-flex justify-end gap-2">
          <v-btn variant="plain" class="flex-grow-1 flex-md-grow-0" @click="emitCloseEvent()">
            cancel
          </v-btn>
          <v-btn
            color="success"
            variant="text"
            type="submit"
            :disabled="!tagForm.valid || tagForm.pending"
            class="flex-grow-1 flex-md-grow-0">
            {{ tag ? 'update' : 'create' }}
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.color-chip {
  min-width: 12.5rem;
  margin-left: 0.5rem;
  flex-grow: 1;
}

.color-picker {
  --square-length: 3.5rem;
  display: grid;
  grid-template-columns: repeat(4, var(--square-length));
  grid-auto-rows: var(--square-length);
  background-color: #212121;
  padding: 0.5rem;

  &__item {
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 25%;

    &:hover {
      background-color: #3f3f3f;
    }

    &__color {
      width: 100%;
      height: 100%;
      border-radius: 50%;

      &.selected {
        border: 2px solid #f5f5f5;
      }
    }
  }
}
</style>
