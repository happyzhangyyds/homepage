<template>
  <div class="cover" :class="`theme-${theme}`" aria-hidden="true">
    <picture>
      <source media="(max-width: 767px)" :srcset="mobileImageUrl" type="image/webp" />
      <img class="image" :src="imageUrl" alt="" />
    </picture>
    <div class="shade" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { getSixLightsPhase } from "@/utils/solarSchedule";

const props = defineProps({
  theme: { type: String, default: "day" },
});

const phase = ref(getSixLightsPhase());
const imageUrl = computed(() => `/images/six-lights/wanxi-${phase.value}.webp`);
const mobileImageUrl = computed(() => `/images/six-lights/wanxi-${phase.value}-sm.webp`);
let timer;

const updatePhase = () => {
  phase.value = getSixLightsPhase();
};

const preloadNextImage = () => {
  const next = phase.value === 6 ? 1 : phase.value + 1;
  const image = new Image();
  image.src = `/images/six-lights/wanxi-${next}.webp`;
};

onMounted(() => {
  updatePhase();
  preloadNextImage();
  timer = window.setInterval(() => {
    const previous = phase.value;
    updatePhase();
    if (phase.value !== previous) preloadNextImage();
  }, 60_000);
});

onBeforeUnmount(() => window.clearInterval(timer));
</script>

<style lang="scss" scoped>
.cover,
.image,
.cover picture,
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
  display: block;
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
