<template>
    <div>
        <h1 class="text-h3 mb-5">Settings</h1>

        <v-row>
            <v-col cols="2">
                <v-tabs
                    v-model="settingsTab"
                    vertical
                    color="accent"
                    background-color="transparent">
                    <v-tab :to="{ name: 'settings-general' }" exact class="justify-start">
                        <v-icon left small>mdi-cog</v-icon>
                        General
                    </v-tab>
                    <v-tab :to="{ name: 'settings-common-tasks' }" exact class="justify-start">
                        <v-icon left small>mdi-timeline</v-icon>
                        Common Tasks
                    </v-tab>
                    <v-tab :to="{ name: 'settings-tags' }" exact class="justify-start">
                        <v-icon left small>mdi-tag</v-icon>
                        Tags
                    </v-tab>
                </v-tabs>
            </v-col>
            <v-col>
                <router-view />
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class SettingsComponent extends Vue {
    settingsTab = 'general'
}
</script>
