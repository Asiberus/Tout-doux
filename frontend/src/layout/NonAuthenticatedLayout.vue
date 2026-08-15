<template>
  <v-app>
    <div class="non-authenticated-layout">
      <router-link :to="{ name: 'login' }" class="non-authenticated-layout__title text-green">
        Tout Doux
      </router-link>

      <div class="non-authenticated-layout__content">
        <router-view />
      </div>
    </div>
  </v-app>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.non-authenticated-layout {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 48px 12px 0;

  &__title {
    text-decoration: none;
    text-align: center;
    font-size: 4rem;
    line-height: 4rem;
    font-weight: 300;
    font-family: Roboto, sans-serif;
    letter-spacing: -0.015625em; // from vuetify text-h1 class
  }

  &__content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-bottom: 4rem; // use to center the content
  }
}

@media #{map.get(variables.$display-breakpoints, 'sm-and-up')} {
  .non-authenticated-layout {
    align-items: center;
    padding: 48px 48px 0;

    &__title {
      font-size: 6rem;
      line-height: 6rem;
    }

    &__content {
      padding-bottom: 6rem; // use to center the content
      width: 400px;
    }
  }
}

@media #{map.get(variables.$display-breakpoints, 'lg-and-up')} {
  .non-authenticated-layout {
    &__title {
      font-size: 8rem;
      line-height: 8rem;
    }

    &__content {
      padding-bottom: 8rem; // use to center the content
    }
  }
}
</style>
