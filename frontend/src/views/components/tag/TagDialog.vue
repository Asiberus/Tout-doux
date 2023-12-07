<template>
    <v-card class="d-flex flex-column">
        <div class="d-flex justify-space-between align-center px-6 pt-4 pb-2">
            <h4 class="text-h5 text-sm-h4 text-capitalize">{{ title }}</h4>
            <div v-if="tag">
                <v-hover v-slot="{ hover }">
                    <v-btn
                        @click="emitDeleteTag()"
                        :color="hover || confirmDelete ? 'error' : null">
                        {{ confirmDelete ? 'Are you sure ?' : 'Delete Tag' }}
                    </v-btn>
                </v-hover>
            </div>
        </div>
        <v-card-text class="flex-grow-1 d-flex flex-column">
            <v-form
                ref="form"
                v-model="tagForm.valid"
                @submit.prevent="emitSubmitEvent()"
                class="flex-grow-1 d-flex flex-column">
                <div class="d-flex flex-column flex-md-row align-stretch align-md-center">
                    <v-text-field
                        ref="name"
                        v-model="tagForm.data.name"
                        @input="validateName"
                        label="Name"
                        counter="20"
                        requried
                        :loading="inputNameLoading"
                        :rules="tagForm.rules.name"
                        :error-messages="nameUniqueError"
                        autofocus
                        class="flex-grow-1 mb-3 mb-md-0">
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
                            <template #activator="{ attrs, on }">
                                <v-chip
                                    v-bind="attrs"
                                    v-on="on"
                                    :color="tagForm.data.color"
                                    class="color-chip">
                                </v-chip>
                            </template>
                            <div class="color-picker">
                                <div
                                    v-for="color of colorOptions"
                                    @click="selectColor(color)"
                                    class="color-picker__item">
                                    <div
                                        class="color-picker__item__color"
                                        :style="{ backgroundColor: color }"
                                        :class="{ selected: tagForm.data.color === color }"></div>
                                </div>
                            </div>
                        </v-menu>
                    </div>
                </div>

                <v-spacer></v-spacer>

                <div class="d-flex justify-end gap-2">
                    <v-btn
                        color="success"
                        text
                        type="submit"
                        :disabled="!tagForm.valid || tagForm.pending"
                        class="flex-grow-1 flex-md-grow-0">
                        {{ tag ? 'update' : 'create' }}
                    </v-btn>
                    <v-btn @click="emitCloseEvent()" plain class="flex-grow-1 flex-md-grow-0">
                        cancel
                    </v-btn>
                </div>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Tag, TagForm } from '@/models/tag.model'
import { Form } from '@/models/common.model'
import { TAG_COLOR_OPTIONS } from '@/utils/constants'
import { IsTagNameUniqueParams } from '@/api/tag.api'
import { tagService } from '@/api'

@Component
export default class TagDialog extends Vue {
    @Prop({ required: false }) tag?: Tag
    @Prop({ required: true }) isDialogOpen!: boolean
    @Prop({ required: true, validator: value => value === 'project' || value === 'task' })
    type!: 'project' | 'task'

    colorOptions = TAG_COLOR_OPTIONS

    confirmDelete = false
    colorPicker = false

    nameUniqueError: string | null = null
    inputNameLoading = false
    validationTimer?: number = undefined

    tagForm: Form<TagForm> = {
        valid: false,
        pending: false,
        data: {
            type: this.type,
            name: '',
            color: TAG_COLOR_OPTIONS[0],
        },
        rules: {
            name: [
                (value: string) => !!value || 'Tag name is required',
                (value: string) => value.length <= 20 || 'Max 20 characters',
            ],
        },
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get inputName(): Vue & { focus: () => void } {
        return this.$refs.name as Vue & { focus: () => void }
    }

    get title(): string {
        return `${this.tag ? 'Update' : 'Create'} ${this.type} tag`
    }

    beforeMount(): void {
        this.populateForm()
    }

    @Watch('isDialogOpen')
    private onIsDialogOpenChanges(value: boolean): void {
        if (value) {
            this.confirmDelete = false
            this.nameUniqueError = null
            this.form.resetValidation()
            this.populateForm()
            this.inputName.focus()
        }
    }

    private populateForm(): void {
        if (this.tag) {
            const { type, name, color } = this.tag
            this.tagForm.data.type = type
            this.tagForm.data.name = name
            this.tagForm.data.color = color
        } else {
            this.tagForm.data.type = this.type
            this.tagForm.data.name = ''
            this.tagForm.data.color = TAG_COLOR_OPTIONS[0]
        }
    }

    validateName(value: string): void {
        clearTimeout(this.validationTimer)

        if (value === '') {
            this.nameUniqueError = null
            return
        }

        this.tagForm.pending = true
        this.validationTimer = setTimeout(() => this.isNameUnique(value), 300)
    }

    private isNameUnique(name: string): void {
        const params: IsTagNameUniqueParams = {
            type: this.type,
            name,
            exclude_id: this.tag?.id,
        }

        this.inputNameLoading = true
        tagService
            .isNameUnique(params)
            .then((response: any) => {
                this.nameUniqueError = !response.body.unique
                    ? 'A tag with that name already exist'
                    : null
            })
            .catch((error: any) => console.error(error))
            .finally(() => {
                this.inputNameLoading = false
                this.tagForm.pending = false
            })
    }

    selectColor(color: string): void {
        this.tagForm.data.color = color
        this.colorPicker = false
    }

    emitSubmitEvent(): void {
        if (!this.tagForm.valid || this.tagForm.pending) return

        if (this.tag) this.$emit('update', this.tag.id, this.tagForm.data)
        else this.$emit('create', this.tagForm.data)
    }

    emitDeleteTag(): void {
        if (!this.confirmDelete) {
            this.confirmDelete = true
            return
        }

        if (this.tag) this.$emit('delete', this.tag.id)
    }

    emitCloseEvent(): void {
        this.$emit('close')
    }
}
</script>

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
