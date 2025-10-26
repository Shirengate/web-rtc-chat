<template>
  <SingleTabProvider>
    <Header />
    <router-view />
  </SingleTabProvider>
</template>

<script setup>
import Header from "./components/UX/Header.vue";
import SingleTabProvider from "./providers/SingleTabProvider.vue";
</script>

<style lang="scss" scoped>
</style>