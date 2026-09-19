<template>
  <section class="heatmap-section" aria-labelledby="heatmap-title">
    <div class="section-title">
      <div><p class="eyebrow">FOCUS RHYTHM</p><h2 id="heatmap-title">工作热力图</h2></div>
      <span>最近 2 周</span>
    </div>
    <div class="evaluation">
      <div class="score-ring" :style="{ '--score': today.score + '%' }"><strong>{{ today.score }}</strong><small>分</small></div>
      <div><p>{{ today.label }}</p><small>{{ today.note }}</small></div>
      <div class="today-focus"><strong>{{ today.focusMinutes }}</strong><small>今日分钟</small></div>
    </div>
    <div class="heatmap" aria-label="最近五周的每日专注热力图">
      <span v-for="weekday in weekdays" :key="weekday" class="weekday">{{ weekday }}</span>
      <span v-for="cell in cells" :key="cell.workday" class="heat-cell" :class="['level-' + cell.level, { today: cell.workday === todayWorkday }]" :title="cell.title" :aria-label="cell.title" />
    </div>
    <div class="legend"><span>少</span><i class="level-0" /><i class="level-1" /><i class="level-2" /><i class="level-3" /><i class="level-4" /><span>多</span></div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  sessions: { type: Array, required: true },
  tasks: { type: Array, required: true },
  clock: { type: Object, required: true },
  workdayStart: { type: String, default: "06:30" },
});
const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
const workdayKeyFor = (date) => {
  const current = new Date(date);
  const [hour, minute] = props.workdayStart.split(":").map(Number);
  if (current.getHours() < hour || (current.getHours() === hour && current.getMinutes() < minute)) current.setDate(current.getDate() - 1);
  return current.toLocaleDateString("en-CA");
};
const scoreFor = (focusMinutes, sessionCount, completedTasks) => {
  const score = Math.min(70, Math.round((focusMinutes / 120) * 70)) + Math.min(20, sessionCount * 5) + Math.min(10, completedTasks * 10);
  if (score >= 75) return { score, label: "深度工作日", note: "专注时间与任务推进都很扎实。" };
  if (score >= 50) return { score, label: "状态在线", note: "保持这个节奏，优先完成关键任务。" };
  if (score >= 20) return { score, label: "节奏建立中", note: "再完成一段专注，就能拉高今天的状态。" };
  return { score, label: "刚刚起步", note: "从一次短专注开始，为今天建立节奏。" };
};
const daily = computed(() => {
  const results = new Map();
  props.sessions.filter((session) => session.status === "completed").forEach((session) => {
    const record = results.get(session.workday) || { focusMinutes: 0, sessionCount: 0, completedTasks: 0 };
    record.focusMinutes += Math.round((session.actualSeconds || 0) / 60);
    record.sessionCount += 1;
    results.set(session.workday, record);
  });
  props.tasks.filter((task) => task.status === "completed" && task.completedAt).forEach((task) => {
    const key = workdayKeyFor(task.completedAt);
    const record = results.get(key) || { focusMinutes: 0, sessionCount: 0, completedTasks: 0 };
    record.completedTasks += 1;
    results.set(key, record);
  });
  return results;
});
const todayWorkday = computed(() => {
  props.clock.hour;
  props.clock.minute;
  return workdayKeyFor(new Date());
});
const today = computed(() => {
  const record = daily.value.get(todayWorkday.value) || { focusMinutes: 0, sessionCount: 0, completedTasks: 0 };
  return { ...record, ...scoreFor(record.focusMinutes, record.sessionCount, record.completedTasks) };
});
const cells = computed(() => {
  const lastDate = new Date(todayWorkday.value + "T12:00:00");
  const firstDate = new Date(lastDate);
  firstDate.setDate(firstDate.getDate() - 13);
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index);
    const workday = date.toLocaleDateString("en-CA");
    const record = daily.value.get(workday) || { focusMinutes: 0, sessionCount: 0, completedTasks: 0 };
    const level = record.focusMinutes === 0 ? 0 : record.focusMinutes < 25 ? 1 : record.focusMinutes < 60 ? 2 : record.focusMinutes < 120 ? 3 : 4;
    return { workday, level, title: workday + "：" + record.focusMinutes + " 分钟专注，" + record.sessionCount + " 次完成专注，" + record.completedTasks + " 个完成任务" };
  });
});
</script>

<style lang="scss" scoped>
.heatmap-section{margin-top:1.25rem}.section-title{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.7rem}.section-title h2,.section-title p{margin:0}.section-title h2{margin-top:.15rem;font-size:1rem;font-weight:600}.section-title>span{color:var(--muted-text);font-size:.72rem}.eyebrow{color:var(--muted-text);font-size:.62rem;font-weight:700;letter-spacing:.16em}.evaluation{display:flex;align-items:center;gap:.75rem;padding:.7rem .8rem;border:1px solid var(--surface-border);border-radius:.8rem;background:rgb(255 255 255 / 7%)}.score-ring{position:relative;display:grid;width:2.75rem;height:2.75rem;place-content:center;border-radius:50%;background:conic-gradient(#d8f0a7 var(--score),rgb(255 255 255 / 13%) 0);color:var(--text-color)}.score-ring::before{position:absolute;width:2.25rem;height:2.25rem;border-radius:50%;background:#172638;content:""}.score-ring strong,.score-ring small{position:relative;z-index:1;text-align:center;line-height:1}.score-ring strong{font-size:.88rem}.score-ring small{margin-top:.1rem;color:var(--muted-text);font-size:.48rem}.evaluation p{margin:0 0 .15rem;font-size:.8rem;font-weight:600}.evaluation small{color:var(--muted-text);font-size:.65rem;line-height:1.4}.today-focus{display:grid;margin-left:auto;text-align:right}.today-focus strong{font-size:.9rem}.today-focus small{font-size:.58rem}.heatmap{display:grid;grid-template-columns:repeat(7,1fr);gap:.25rem;margin-top:.7rem}.weekday{display:grid;place-items:center;height:.72rem;color:var(--muted-text);font-size:.55rem}.heat-cell{aspect-ratio:1;min-width:0;border:1px solid rgb(255 255 255 / 8%);border-radius:.18rem}.heat-cell.today{outline:1px solid #f7dca5;outline-offset:1px}.level-0{background:rgb(255 255 255 / 8%)}.level-1{background:rgb(186 219 165 / 28%)}.level-2{background:rgb(183 222 151 / 48%)}.level-3{background:rgb(198 237 157 / 70%)}.level-4{background:#d8f0a7}.legend{display:flex;align-items:center;justify-content:flex-end;gap:.22rem;margin-top:.45rem;color:var(--muted-text);font-size:.55rem}.legend i{width:.55rem;height:.55rem;border-radius:.13rem}
.heatmap-section{margin-top:clamp(.7rem,1.5vh,1.05rem)}.evaluation{padding:.55rem .7rem}.heatmap{margin-top:.5rem}.legend{margin-top:.3rem}@media(max-height:780px){.evaluation{padding:.42rem .55rem}.score-ring{transform:scale(.86);transform-origin:left}.heatmap{gap:.18rem}.heatmap-section{margin-top:.55rem}}
</style>
