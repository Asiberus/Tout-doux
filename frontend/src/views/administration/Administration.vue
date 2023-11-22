<template>
    <div>
        <h1 class="text-h3 mb-5">Administration</h1>

        <v-row>
            <v-col cols="2">
                <v-tabs vertical color="accent" background-color="transparent">
                    <v-tab :to="{ name: 'administration-user-list' }" exact class="justify-start">
                        <v-icon left small>mdi-account-group</v-icon>
                        User List
                    </v-tab>
                    <v-tab :to="{ name: 'administration-feedback' }" exact class="justify-start">
                        <v-icon left small>mdi-comment-quote</v-icon>
                        Feedback
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
export default class Administration extends Vue {}
</script>
