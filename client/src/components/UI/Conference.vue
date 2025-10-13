<template>
  <div class="video-grid" :class="`participants-${participantCount}`">
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  participantCount: {
    type: Number,
    required: true,
  },
});
</script>

<style scoped>
.video-grid {
  display: grid;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
}

/* 1 участник */
.participants-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

/* 2 участника */
.participants-2 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: 1fr;
}

/* 3-4 участника */
.participants-3,
.participants-4 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

/* 5-6 участников */
.participants-5,
.participants-6 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

/* 7-9 участников */
.participants-7,
.participants-8,
.participants-9 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

/* 10+ участников */
.participants-10,
.participants-11,
.participants-12 {
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

/* Мобильная версия - все видео друг под другом */
@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
    gap: 12px;
    overflow-y: auto;
  }
}

/* Планшеты - 2 колонки */
@media (min-width: 769px) and (max-width: 1024px) {
  .participants-5,
  .participants-6,
  .participants-7,
  .participants-8,
  .participants-9,
  .participants-10,
  .participants-11,
  .participants-12 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto;
  }
}
</style>