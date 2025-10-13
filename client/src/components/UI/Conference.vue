<template>
  <div :class="[`grid-container layout-${len}`]">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  len: {
    type: Number,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
.grid-container {
  height: calc(100vh - 53px);
  background-color: rgba(0, 0, 0, 0.1);
  display: grid;
  grid-gap: 3px;
  margin-top: 15px;
  div {
    background-color: rgba(0, 0, 0, 0.5);
  }

  &.layout-1 {
    grid-template-areas: "v1";
    .layout-inner-1 {
      grid-area: v1;
    }
  }

  &.layout-2 {
    grid-template: auto / auto auto;
  }

  &.layout-3 {
    grid-template-areas: "v2 v1" "v2 v3";
    @for $i from 1 through 3 {
      .layout-inner-#{$i} {
        grid-area: v#{$i};
      }
    }
  }

  &.layout-4 {
    grid-template: auto auto / auto auto;
  }

  &.layout-5 {
    grid-template-areas: "v1 v1 v2 v2 v3 v3" "v4 v4 v4 v5 v5 v5";
    @for $i from 1 through 5 {
      .layout-inner-#{$i} {
        grid-area: v#{$i};
      }
    }
  }

  &.layout-6 {
    grid-template: auto auto / auto auto auto;
  }

  &.layout-7 {
    grid-template-areas: "v1 v2 v3" "v4 v5 v6" ". v7 .";
    @for $i from 1 through 7 {
      .layout-inner-#{$i} {
        grid-area: v#{$i};
      }
    }
  }

  &.layout-8 {
    grid-template-areas: "v1 v1 v2 v2 v3 v3" "v4 v4 v5 v5 v6 v6" ". v7 v7 v8 v8 .";
    @for $i from 1 through 8 {
      .layout-inner-#{$i} {
        grid-area: v#{$i};
      }
    }
  }

  &.layout-9 {
    grid-template: auto auto auto / auto auto auto;
  }

  &.layout-10 {
    grid-template-areas: "v1 v2 v3" "v4 v5 v6" "v7 v8 v9" ". v10 .";
    @for $i from 1 through 10 {
      .layout-inner-#{$i} {
        grid-area: v#{$i};
      }
    }
  }
  &.layout-11 {
    grid-template-areas: "v1 v1 v2 v2 v3 v3" "v4 v4 v5 v5 v6 v6" "v7 v7 v8 v8 v9 v9" ". v10 v10 v11 v11 .";
    @for $i from 1 through 11 {
      .layout-inner-#{$i} {
        grid-area: v#{$i};
      }
    }
  }
  &.layout-12 {
    grid-template: auto auto auto auto / auto auto auto;
  }
}
</style>