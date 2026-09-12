<template>
  <div class="function">
    <div class="weather-clock cards">
      <div class="time">
        <div class="date">
          <span>{{ currentTime.year }} 年 </span>
          <span>{{ currentTime.month }} 月 </span>
          <span>{{ currentTime.day }} 日 </span>
          <span class="sm-hidden">{{ currentTime.weekday }}</span>
        </div>
        <div class="text">
          {{ currentTime.hour }}:{{ currentTime.minute }}:{{ currentTime.second }}
        </div>
      </div>
      <Weather />
    </div>
  </div>
</template>

<script setup>
import Weather from "@/components/Weather/index.vue";

defineProps({
  currentTime: { type: Object, required: true },
});
</script>

<style lang="scss" scoped>
.function {
  width: 100%;
  height: 172px;
}

.weather-clock {
  width: 100%;
  height: 100%;
  padding: 1.2rem 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  animation: fade 0.5s;
  transition: background 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background: var(--surface-hover);
    box-shadow: inset 0 1px 0 var(--card-highlight), 0 16px 42px var(--card-shadow);
  }

  .time {
    font-size: 1.1rem;
    text-align: center;
    text-shadow: 0 1px 10px rgb(0 0 0 / 30%);

    .date {
      overflow-x: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .text {
      margin-top: 10px;
      font-family: "UnidreamLED";
      font-size: 3.25rem;
      letter-spacing: 2px;
      line-height: 0.95;
      text-shadow: 0 2px 14px rgb(0 0 0 / 35%);
    }
  }

  .weather {
    width: 100%;
    overflow-x: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--muted-text);
    font-size: 0.92rem;
    text-shadow: 0 1px 8px rgb(0 0 0 / 35%);
  }
}

@media (max-width: 520px) {
  .function {
    height: 158px;
  }

  .weather-clock {
    padding: 1rem;

    .time .text {
      font-size: 2.8rem;
    }
  }
}
</style>
