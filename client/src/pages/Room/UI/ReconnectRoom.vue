<template>
  <div class="container">
    <!-- Диалог с автоматическим закрытием -->
    <Dialog
      v-model:visible="visible"
      modal
      :closable="false"
      :style="{ width: '400px' }"
    >
      <div class="simple-dialog">
        <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
        <div class="dialog-message">
          <h3>Конференция уже активна</h3>
          <p>Эта конференция уже открыта в другом окне браузера.</p>
        </div>
      </div>
    </Dialog>

    <!-- Фоновый лоадер -->
    <div class="background-loader">
      <ProgressSpinner
        style="width: 60px; height: 60px"
        strokeWidth="4"
        animationDuration=".8s"
      />
      <p>Подождите...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Dialog from "primevue/dialog";
import ProgressSpinner from "primevue/progressspinner";

const visible = ref(false);

onMounted(() => {
  setTimeout(() => {
    visible.value = true;
  }, 1500);
});
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.background-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  p {
    color: #6c757d;
    font-size: 1rem;
  }
}

.simple-dialog {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.dialog-message {
  h3 {
    margin: 0 0 0.5rem 0;
    color: #495057;
  }

  p {
    margin: 0;
    color: #6c757d;
    line-height: 1.4;
  }
}

:deep(.p-dialog .p-dialog-content) {
  padding: 1.5rem;
}
</style>