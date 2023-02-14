<template>
    <v-card>
        <div class="d-flex justify-space-between align-center pa-4">
            <h2>
                {{ task ? 'Update Task' : 'New Task' }}
            </h2>
            <div v-if="task">
                <v-hover v-slot="{ hover }">
                    <v-btn
                        @click="emitDeleteTask()"
                        :color="hover || confirmDelete ? 'error' : null">
                        {{ confirmDelete ? 'Are you sure ?' : 'Delete Task' }}
                    </v-btn>
                </v-hover>
            </div>
        </div>
        <v-card-text>
            <v-form ref="form" v-model="taskForm.valid" @submit.prevent="emitSubmitEvent()">
                <v-row>
                    <v-col>
                        <v-text-field
                            ref="name"
                            v-model="taskForm.data.name"
                            label="Name"
                            counter="50"
                            maxlength="50"
                            requried
                            :rules="taskForm.rules.name"
                            autofocus>
                        </v-text-field>
                    </v-col>
                </v-row>
                <v-card-actions class="d-flex justify-end mt-3">
                    <v-btn color="success" text type="submit" :disabled="!taskForm.valid">
                        {{ task ? 'update' : 'create' }}
                    </v-btn>
                    <v-btn plain class="ml-2" @click="emitCloseEvent()"> cancel </v-btn>
                </v-card-actions>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Task } from '@/models/task.model'

@Component
export default class TaskDialog extends Vue {
    @Prop() private task?: Task
    @Prop() private isDialogOpen!: boolean

    confirmDelete = false
    taskForm = {
        valid: false,
        data: {
            name: '',
        },
        rules: {
            name: [
                (value: string) => !!value || 'Task name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
        },
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get inputName(): Vue & { focus: () => void } {
        return this.$refs.name as Vue & { focus: () => void }
    }

    beforeMount(): void {
        if (this.task) this.populateForm(this.task)
    }

    @Watch('isDialogOpen')
    private onIsDialogOpenChanges(value: boolean): void {
        if (value) {
            this.confirmDelete = false
            this.form.resetValidation()
            if (this.task) this.populateForm(this.task)
            else this.populateForm({ name: '' } as Task)
            this.inputName.focus()
        }
    }

    private populateForm({ name }: Task): void {
        this.taskForm.data.name = name
    }

    emitSubmitEvent(): void {
        if (!this.taskForm.valid) return

        if (this.task) this.$emit('update', this.taskForm.data)
        else this.$emit('create', this.taskForm.data)
        // Todo : to delete
        this.$emit('submit', this.taskForm.data)
    }

    emitDeleteTask(): void {
        if (!this.confirmDelete) {
            this.confirmDelete = true
            return
        }

        this.$emit('delete')
    }

    emitCloseEvent(): void {
        this.$emit('close')
    }
}
</script>

<style scoped lang="scss"></style>
