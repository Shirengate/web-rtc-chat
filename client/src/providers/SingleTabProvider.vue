<template>
  <div>
    <div>
      <slot />
    </div>
    <Dialog
      v-model:visible="visible"
      modal
      header="Оповещение"
      :style="{ width: '50vw' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <p class="m-0">
        У вас уже открыта конфереция на другой вкладке, закройте ее здесь.
      </p>
    </Dialog>
  </div>
</template>

<script setup>
import { useBroadcastChannel } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";
import { shallowRef, watch, watchEffect, ref, provide } from "vue";

import Dialog from "primevue/dialog";
const route = useRoute();
const msg = shallowRef("");

const visible = ref(false);
const { isSupported, data, post, error } = useBroadcastChannel({
  name: "single-tab",
});

watch(
  () => route.fullPath,
  (newPath) => {
    if (newPath.includes("room")) {
      msg.value = "single-tab";
      post(msg.value);
    }
  },
  { immediate: true }
);

watch(data, (newData) => {
  if (newData && newData === "single-tab") {
    visible.value = true;
    provide("single", "close-tab");
  }
});
</script>

<style lang="scss" scoped>
</style>