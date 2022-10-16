<template>
    <v-card>
        <v-toolbar>
            <v-toolbar-title>{{ event.name }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn @click="emitUpdateEvent" icon>
                <v-icon>mdi-pencil</v-icon>
            </v-btn>
        </v-toolbar>
        <v-card-text>
            <p>start : {{ dateFormat(event.start_date, ' HH:mm') }}</p>
            <p v-if="event.end_date">end : {{ dateFormat(event.end_date, 'HH:mm') }}</p>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { EventExtended } from '@/models/event.model'
import { dateFormat } from '@/pipes'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class EventTooltip extends Vue {
    @Prop({ required: true }) event!: EventExtended

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }

    emitUpdateEvent(): void {
        this.$emit('update')
    }
}
</script>

<style scoped lang="scss"></style>
