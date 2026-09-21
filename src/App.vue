<template>
  <main :class="`theme-${currentTime.theme}`">
    <Background :theme="currentTime.theme" />
    <section class="workspace">
      <WorkdayPanel :current-time="currentTime" :theme="currentTime.theme" />
    </section>
    <section class="content">
      <Func :current-time="currentTime" />
      <Link />
    </section>
  </main>
</template>

<script setup>
import Func from "@/views/Func/index.vue";
import Link from "@/components/Links/index.vue";
import Background from "@/components/Background/index.vue";
import WorkdayPanel from "@/components/WorkdayPanel/index.vue";
import { useSharedClock } from "@/utils/timeTicker";

const { currentTime } = useSharedClock();
</script>

<style lang="scss" scoped>
main {
  position: relative;
  display: grid;
  grid-template-columns: minmax(720px, 900px) minmax(320px, 440px);
  align-items: stretch;
  justify-content: space-between;
  gap: clamp(1rem, 4vw, 5rem);
  height: 100vh;
  height: 100dvh;
  padding: clamp(1rem, 3.5vh, 3rem) clamp(1.25rem, 4vw, 4rem);
  background: var(--page-background);
  color: var(--text-color);
  overflow: hidden;
  transition: background-color 0.6s ease, color 0.6s ease;

  &.theme-day {
    --page-background: #d9e2df;
    --text-color: #25352f;
    --muted-text: rgb(37 53 47 / 78%);
    --card-background: linear-gradient(135deg, rgb(255 255 255 / 45%), rgb(241 248 242 / 21%));
    --card-highlight: rgb(255 255 255 / 54%);
    --card-shadow: rgb(69 91 79 / 15%);
    --surface-background: rgb(255 255 255 / 33%);
    --surface-hover: rgb(255 255 255 / 58%);
    --surface-border: rgb(70 95 80 / 24%);
    --focus-ring: rgb(66 105 82 / 31%);
    --content-glow: rgb(255 255 255 / 32%);
  }

  &.theme-night {
    --page-background: #111827;
    --text-color: #fff;
    --muted-text: rgb(255 255 255 / 72%);
    --card-background: linear-gradient(135deg, rgb(14 18 24 / 16%), rgb(14 18 24 / 5%));
    --card-highlight: rgb(255 255 255 / 12%);
    --card-shadow: rgb(0 0 0 / 8%);
    --surface-background: rgb(10 16 22 / 14%);
    --surface-hover: rgb(12 20 27 / 36%);
    --surface-border: rgb(255 255 255 / 25%);
    --focus-ring: rgb(255 255 255 / 25%);
    --content-glow: rgb(9 14 19 / 22%);
  }
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  margin-left: auto;
  padding: clamp(0.35rem, 1.5vw, 0.85rem);

  &::before {
    position: absolute;
    z-index: -1;
    inset: -2rem -2.5rem;
    background: radial-gradient(ellipse at center, var(--content-glow), transparent 68%);
    content: "";
    filter: blur(12px);
    pointer-events: none;
  }
}

.workspace {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 0;
  padding: clamp(0.35rem, 1.5vw, 0.85rem);
}

@media (max-width: 900px) {
  main {
    display: grid;
    gap: 1rem;
    padding: 1rem;
    overflow: hidden;
  }

  .workspace,
  .content {
    width: min(100%, 620px);
    margin-left: 0;
    padding: 0;
  }
}
</style>
