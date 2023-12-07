<template>
    <v-list>
        <v-list-item>
            <v-list-item-content>
                <v-list-item-title class="text-h4 font-weight-bold text-center">
                    Tout Doux
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>

        <v-btn
            v-if="$vuetify.breakpoint.mobile"
            @click="$emit('update:display-navbar', false)"
            icon
            small
            class="close-navbar">
            <v-icon>mdi-arrow-left</v-icon>
        </v-btn>

        <v-divider></v-divider>

        <v-list-item
            v-for="(item, i) in menu"
            :key="i"
            :to="item.link"
            :disabled="!item.link"
            class="py-3 py-sm-0">
            <v-list-item-icon class="mr-2">
                <v-icon
                    left
                    :small="$vuetify.breakpoint.smAndUp || true"
                    :class="{ disabled: !item.link }">
                    {{ item.icon }}
                </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
                <v-list-item-title class="text-body-1">
                    {{ item.name }}
                </v-list-item-title>
            </v-list-item-content>
        </v-list-item>
    </v-list>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class TheNavbar extends Vue {
    private menu = [
        { name: 'Dashboard', icon: 'mdi-view-dashboard' },
        { name: 'Daily', link: { name: 'daily-summary' }, icon: 'mdi-trophy' },
        { name: 'Projects', link: { name: 'project-list' }, icon: 'mdi-briefcase-variant' },
        { name: 'Collections', link: { name: 'collection-list' }, icon: 'mdi-list-box' },
        { name: 'Agenda', link: { name: 'agenda' }, icon: 'mdi-calendar-month' },
    ]
}
</script>

<style scoped lang="scss">
.close-navbar {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;
}

.disabled {
    color: inherit;
}
</style>
