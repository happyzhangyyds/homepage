import { onBeforeUnmount, onMounted, ref } from "vue";

const BEIJING_TIME_ZONE = "Asia/Shanghai";

const formatTime = () => {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: BEIJING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value])
  );
  const hour = Number(values.hour);
  const pad = (value) => String(value).padStart(2, "0");
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: pad(hour),
    minute: values.minute,
    second: values.second,
    weekday: values.weekday,
    theme: hour >= 6 && hour < 18 ? "day" : "night",
  };
};

export const useSharedClock = () => {
  const currentTime = ref(formatTime());
  let timer;

  onMounted(() => {
    timer = window.setInterval(() => {
      currentTime.value = formatTime();
    }, 1000);
  });
  onBeforeUnmount(() => window.clearInterval(timer));

  return { currentTime };
};
