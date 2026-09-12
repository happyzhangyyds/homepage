<template>
  <div class="cover" :class="`theme-${theme}`" aria-hidden="true">
    <img class="image" :src="imageUrl" alt="" />
    <div class="shade" />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  theme: { type: String, default: "day" },
});

const backgrounds = {
  day: ["/images/background2.png", "/images/background5.png"],
  night: ["/images/background1.png"],
};
const imageUrl = ref("");

watch(
  () => props.theme,
  (theme) => {
    const options = backgrounds[theme] || backgrounds.day;
    imageUrl.value = options[Math.floor(Math.random() * options.length)];
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.cover,
.image,
.shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.cover {
  z-index: 0;
}

.image {
  object-fit: cover;
  transform: scale(1.015);
  transition: opacity 0.6s ease;
}

.shade {
  background:
    radial-gradient(ellipse at center, transparent 18%, rgb(5 10 15 / 18%) 100%),
    linear-gradient(115deg, rgb(5 10 15 / 36%), rgb(5 10 15 / 8%) 52%, rgb(5 10 15 / 28%));
  transition: background 0.6s ease;
}

.theme-day .shade {
  background:
    radial-gradient(ellipse at center, rgb(255 255 255 / 2%) 18%, rgb(40 59 48 / 17%) 100%),
    linear-gradient(115deg, rgb(35 51 40 / 20%), rgb(255 255 255 / 2%) 52%, rgb(35 51 40 / 14%));
}
</style>
