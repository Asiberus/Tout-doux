<template>
    <v-list>
        <v-list-item>
            <v-list-item-content>
                <v-list-item-title class="text-h4 font-weight-bold text-center"
                    >Tout Doux</v-list-item-title
                >
            </v-list-item-content>
        </v-list-item>

        <v-btn
            v-if="$vuetify.breakpoint.smAndDown"
            @click="$emit('update:display-navbar', false)"
            icon
            small
            class="close-navbar">
            <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-divider></v-divider>

        <v-list-item v-for="(item, i) in menu" :key="i" :to="item.link" :disabled="!item.link">
            <v-list-item-content>
                <v-list-item-title class="text-body-1">{{ item.name }}</v-list-item-title>
            </v-list-item-content>
        </v-list-item>
    </v-list>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class TheNavbar extends Vue {
    @Prop({ required: true }) displayNavbar!: boolean

    private menu = [
        { name: 'Dashboard' },
        { name: 'Daily', link: { name: 'daily-summary' } },
        { name: 'Projects', link: { name: 'project-list' } },
        { name: 'Collections', link: { name: 'collection-list' } },
        { name: 'Agenda', link: { name: 'agenda' } },
    ]
}
</script>

<style scoped lang="scss">
.close-navbar {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
}
</style>
