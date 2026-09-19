<template>
  <aside class="workday cards" aria-label="今日工作台">
    <header class="panel-header">
      <div><p class="eyebrow">TODAY'S FOCUS</p><h1>今日工作台</h1></div>
      <div class="header-actions"><span class="date-label">{{ currentTime.month }} 月 {{ currentTime.day }} 日</span><button v-if="showExportReminder" class="reminder-chip" type="button" @click="downloadAndDismiss">下班前导出</button><button class="icon-button" type="button" aria-label="数据管理" @click="showDataMenu = !showDataMenu">···</button></div>
      <div v-if="showDataMenu" class="data-menu">
        <button type="button" @click="downloadExcel">导出 Excel</button>
        <button type="button" @click="downloadExport">导出我的数据</button>
        <button type="button" @click="importInput?.click()">导入备份</button>
        <button class="danger" type="button" @click="openClearDialog">清空本地数据</button>
      </div>
      <input ref="importInput" class="sr-only" type="file" accept="application/json,.json" @change="prepareImport" />
    </header>

    <div class="summary" aria-label="今日摘要">
      <div><strong>{{ formatMinutes(todayStats.minutes) }}</strong><span>已专注</span></div>
      <div><strong>{{ todayStats.completedTasks }} / {{ todayStats.totalTasks }}</strong><span>已完成</span></div>
      <div><strong>{{ formatMinutes(todayStats.longestMinutes) }}</strong><span>最长连续</span></div>
    </div>

    <section class="focus-now" :class="{ running: activeTimer?.status === 'running' }">
      <div class="focus-copy">
        <span class="status-dot" /><p>{{ activeTimer ? (activeTimer.mode === "countdown" ? "正在倒计时" : "正在正向计时") : "当前下一件事" }}</p>
        <h2>{{ activeTask?.title || selectedTask?.title || "先从一个任务开始" }}</h2>
        <small v-if="activeTimer">{{ activeTimer.mode === "countdown" ? `计划 ${Math.round(activeTimer.plannedSeconds / 60)} 分钟` : "自由专注时长" }}</small>
        <small v-else>{{ selectedTask ? `${quadrantLabel(selectedTask.quadrant)} · 预计 ${selectedTask.estimatePomodoros} 个番茄` : "新建任务后，即可开始记录专注" }}</small>
      </div>
      <div class="timer">
        <strong>{{ formattedTime }}</strong>
        <button v-if="!activeTimer" type="button" :disabled="!selectedTask" @click="openTimerDialog">开始专注</button>
        <template v-else-if="activeTimer.status === 'running'"><button type="button" @click="pauseTimer">暂停</button><button type="button" @click="finishTimer">结束并保存</button><button type="button" @click="abandonTimer">放弃</button></template>
        <template v-else><button type="button" @click="resumeTimer">继续</button><button type="button" @click="finishTimer">结束并保存</button><button type="button" @click="abandonTimer">放弃</button></template>
      </div>
    </section>

    <section class="timeline-section" aria-labelledby="timeline-title">
      <div class="section-title"><div><p class="eyebrow">DAY PLAN</p><h2 id="timeline-title">时间线</h2></div><span>06:30 — 00:30</span></div>
      <div class="timeline" aria-label="今日计划与实际时间线">
        <div v-for="hour in hours" :key="hour" class="hour-row"><time>{{ hour }}</time></div>
        <button v-for="item in timelineItems" :key="item.id" class="timeline-item" :class="item.kind" :style="item.style" type="button" :title="item.title" @click="item.blockId && removePlannedBlock(item.blockId)"><span>{{ item.title }}</span><small>{{ item.duration }}</small></button>
        <div class="now-line" :style="{ top: `${nowPosition}%` }"><span>现在</span></div>
        <button class="add-plan" type="button" @click="showScheduleDialog = true">+ 安排任务</button>
      </div>
      <p class="timeline-note">实色为已完成，描边为已安排；点击已安排项可移除计划。</p>
    </section>

    <WorkdayHeatmap :sessions="state.focusSessions" :tasks="state.tasks" :clock="currentTime" :workday-start="state.settings.workdayStart" />

    <section class="task-pool" aria-labelledby="task-pool-title">
      <div class="section-title"><div><p class="eyebrow">PRIORITY POOL</p><h2 id="task-pool-title">任务池</h2></div><div><button class="text-button" type="button" @click="showAllTasks = !showAllTasks">{{ showAllTasks ? "收起" : "查看四象限" }}</button><button class="text-button" type="button" @click="showTaskDialog = true">+ 新任务</button></div></div>
      <div v-if="visibleTasks.length" class="task-grid">
        <article v-for="task in visibleTasks" :key="task.id" class="task" :class="[task.quadrant, { selected: selectedTaskId === task.id, done: task.status === 'completed' }]">
          <button class="task-main" type="button" @click="selectedTaskId = task.id"><span>{{ task.title }}</span><small>{{ quadrantLabel(task.quadrant) }} · 预计 {{ task.estimatePomodoros }} 个番茄</small></button>
          <button class="task-check" type="button" :aria-label="task.status === 'completed' ? '恢复任务' : '完成任务'" @click="completeTask(task.id)">{{ task.status === "completed" ? "✓" : "○" }}</button>
        </article>
      </div>
      <button v-else class="empty-tasks" type="button" @click="showTaskDialog = true">还没有任务，点击创建第一个任务</button>
    </section>

    <div v-if="showTaskDialog || showTimerDialog || showScheduleDialog || importPreview || showClearDialog" class="dialog-backdrop" @click.self="closeDialogs">
      <form v-if="showTaskDialog" class="dialog" @submit.prevent="createTask"><h2>新建任务</h2><label>任务名称<input v-model="taskForm.title" required maxlength="60" placeholder="例如：完成数据模型" /></label><label>优先级<select v-model="taskForm.quadrant"><option value="urgent">重要且紧急</option><option value="important">重要不紧急</option><option value="delegate">紧急不重要</option><option value="later">不紧急不重要</option></select></label><label>预计番茄数<input v-model.number="taskForm.estimatePomodoros" type="number" min="1" max="99" /></label><p v-if="formError" class="error">{{ formError }}</p><footer><button type="button" @click="closeDialogs">取消</button><button class="primary" type="submit">创建任务</button></footer></form>
      <form v-else-if="showTimerDialog" class="dialog" @submit.prevent="beginTimer"><h2>开始专注</h2><p class="dialog-subtitle">{{ selectedTask?.title }}</p><div class="mode-picker"><button type="button" :class="{ selected: timerForm.mode === 'countdown' }" @click="timerForm.mode = 'countdown'">倒计时</button><button type="button" :class="{ selected: timerForm.mode === 'stopwatch' }" @click="timerForm.mode = 'stopwatch'">正向计时</button></div><label v-if="timerForm.mode === 'countdown'">专注分钟<input v-model.number="timerForm.durationMinutes" type="number" min="1" max="240" /></label><p class="dialog-subtitle">开始后会在此浏览器保存进行中状态；结束并保存后才计入统计。</p><p v-if="formError" class="error">{{ formError }}</p><footer><button type="button" @click="closeDialogs">取消</button><button class="primary" type="submit">确认开始</button></footer></form>
      <form v-else-if="showScheduleDialog" class="dialog" @submit.prevent="createSchedule"><h2>安排任务</h2><label>任务<select v-model="scheduleForm.taskId"><option disabled value="">选择任务</option><option v-for="task in activeTasks" :key="task.id" :value="task.id">{{ task.title }}</option></select></label><label>开始时间<input v-model="scheduleForm.startTime" type="time" min="06:30" /></label><label>预计分钟<input v-model.number="scheduleForm.durationMinutes" type="number" min="5" max="1080" /></label><p v-if="formError" class="error">{{ formError }}</p><footer><button type="button" @click="closeDialogs">取消</button><button class="primary" type="submit">加入时间线</button></footer></form>
      <section v-else-if="importPreview" class="dialog"><h2>导入备份</h2><p>将导入 {{ importPreview.tasks.length }} 个任务、{{ importPreview.scheduleBlocks.length }} 个计划和 {{ importPreview.focusSessions.length }} 条专注记录。</p><p class="dialog-subtitle">合并会按 ID 保留当前数据；替换会覆盖当前全部数据。</p><footer><button type="button" @click="closeDialogs">取消</button><button type="button" @click="applyImport('merge')">合并导入</button><button class="danger-button" type="button" @click="applyImport('replace')">替换全部</button></footer></section>
      <section v-else class="dialog"><h2>清空本地数据</h2><p>此操作会删除此浏览器中所有任务、计划、专注记录和设置，无法撤销。</p><label>输入“清空”确认<input v-model="clearPhrase" autocomplete="off" /></label><footer><button type="button" @click="closeDialogs">取消</button><button class="danger-button" type="button" :disabled="clearPhrase !== '清空'" @click="confirmClear">清空全部数据</button></footer></section>
    </div>
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { createExcelWorkbook, downloadFile } from "@/utils/analyticsExport";
import WorkdayHeatmap from "@/components/WorkdayHeatmap/index.vue";

const props = defineProps({ currentTime: { type: Object, required: true } });
const { state, currentWorkday, activeTask, todaySessions, todayStats, addTask, completeTask, addScheduleBlock, removeScheduleBlock, startTimer, pauseTimer, resumeTimer, stopTimer, discardTimer, getElapsedSeconds, exportData, importData, clearAllData, refreshWorkday } = usePomodoroStore();
const selectedTaskId = ref(""); const showAllTasks = ref(false); const showDataMenu = ref(false); const showTaskDialog = ref(false); const showTimerDialog = ref(false); const showScheduleDialog = ref(false); const showClearDialog = ref(false); const importPreview = ref(null); const importText = ref(""); const importInput = ref(null); const clearPhrase = ref(""); const formError = ref(""); const elapsedSeconds = ref(0); const exportReminderDismissed = ref(false); let clock;
const taskForm = ref({ title: "", quadrant: "important", estimatePomodoros: 1 }); const timerForm = ref({ mode: "countdown", durationMinutes: 25 }); const scheduleForm = ref({ taskId: "", startTime: "09:00", durationMinutes: 50 });
const activeTimer = computed(() => state.value.activeTimer); const activeTasks = computed(() => state.value.tasks.filter((task) => task.status === "active")); const selectedTask = computed(() => activeTasks.value.find((task) => task.id === selectedTaskId.value) || activeTasks.value[0] || null); const visibleTasks = computed(() => showAllTasks.value ? activeTasks.value : activeTasks.value.slice(0, 2));
const hours = ["06:30", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "00:30"];
const formatMinutes = (minutes) => minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const formattedTime = computed(() => { if (!activeTimer.value) return "00:00"; const elapsed = elapsedSeconds.value; return activeTimer.value.mode === "countdown" ? formatTime(Math.max(0, activeTimer.value.plannedSeconds - elapsed)) : formatTime(elapsed); });
const quadrantLabel = (quadrant) => ({ urgent: "重要 · 紧急", important: "重要 · 不紧急", delegate: "紧急 · 可委派", later: "稍后处理" })[quadrant] || "未分类";
const timePercent = (time) => { const [h, m] = time.split(":").map(Number); let minutes = h * 60 + m - 390; if (minutes < 0) minutes += 1440; return Math.min(100, Math.max(0, (minutes / 1080) * 100)); };
const taskTitle = (taskId) => state.value.tasks.find((task) => task.id === taskId)?.title || "已归档任务";
const timelineItems = computed(() => {
  const planned = state.value.scheduleBlocks.filter((block) => block.workday === currentWorkday.value).map((block) => ({ id: block.id, blockId: block.id, title: taskTitle(block.taskId), duration: formatMinutes(block.durationMinutes), kind: "planned", style: { top: `${timePercent(block.startTime)}%`, height: `${Math.max(5, (block.durationMinutes / 1080) * 100)}%` } }));
  const actual = todaySessions.value.filter((session) => session.status === "completed").map((session) => {
    const d = new Date(session.startedAt);
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return {
      id: session.id,
      title: taskTitle(session.taskId),
      duration: formatMinutes(Math.round(session.actualSeconds / 60)),
      kind: "completed",
      style: { top: `${timePercent(time)}%`, height: `${Math.max(5, (session.actualSeconds / 64800) * 100)}%` },
    };
  });
  return [...planned, ...actual];
});
const nowPosition = computed(() => timePercent(`${props.currentTime.hour}:${props.currentTime.minute}`));
const showExportReminder = computed(() => Number(props.currentTime.hour) === 19 && Number(props.currentTime.minute) >= 30 && !exportReminderDismissed.value);
const tick = () => { elapsedSeconds.value = getElapsedSeconds(); };
onMounted(() => { tick(); clock = window.setInterval(tick, 1000); }); onBeforeUnmount(() => window.clearInterval(clock));
watch(() => `${props.currentTime.year}-${props.currentTime.month}-${props.currentTime.day}-${props.currentTime.hour}-${props.currentTime.minute}`, refreshWorkday, { immediate: true });
watch(currentWorkday, () => { exportReminderDismissed.value = false; }, { immediate: true });
const closeDialogs = () => { showTaskDialog.value = false; showTimerDialog.value = false; showScheduleDialog.value = false; showClearDialog.value = false; importPreview.value = null; formError.value = ""; clearPhrase.value = ""; };
const createTask = () => { try { const task = addTask(taskForm.value); selectedTaskId.value = task.id; taskForm.value = { title: "", quadrant: "important", estimatePomodoros: 1 }; closeDialogs(); } catch (error) { formError.value = error.message; } };
const openTimerDialog = () => { if (selectedTask.value) { timerForm.value.durationMinutes = state.value.settings.defaultCountdownMinutes; showTimerDialog.value = true; } };
const beginTimer = () => { try { startTimer({ taskId: selectedTask.value?.id, ...timerForm.value }); closeDialogs(); tick(); } catch (error) { formError.value = error.message; } };
const finishTimer = () => { stopTimer("completed"); tick(); };
const abandonTimer = () => { if (window.confirm("放弃当前专注？本次时长不会计入统计。")) { discardTimer(); tick(); } };
const createSchedule = () => { try { addScheduleBlock(scheduleForm.value); closeDialogs(); } catch (error) { formError.value = error.message; } };
const removePlannedBlock = (blockId) => { if (window.confirm("移除这个计划时间块？")) removeScheduleBlock(blockId); };
const downloadExport = () => { downloadFile(exportData(), `homepage-pomodoro-${currentWorkday.value}.json`, "application/json"); showDataMenu.value = false; };
const downloadAndDismiss = () => { downloadExport(); exportReminderDismissed.value = true; };
const downloadExcel = () => { downloadFile(createExcelWorkbook(state.value), `homepage-focus-${currentWorkday.value}.xls`, "application/vnd.ms-excel;charset=utf-8"); showDataMenu.value = false; };
const prepareImport = async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const text = await file.text(); const parsed = JSON.parse(text); if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.scheduleBlocks) || !Array.isArray(parsed.focusSessions)) throw new Error("文件格式不正确"); importText.value = text; importPreview.value = parsed; showDataMenu.value = false; } catch (error) { window.alert(error.message || "无法读取备份文件"); } finally { event.target.value = ""; } };
const applyImport = (mode) => { try { importData(importText.value, mode); closeDialogs(); } catch (error) { window.alert(error.message); } };
const openClearDialog = () => { showDataMenu.value = false; showClearDialog.value = true; };
const confirmClear = () => { if (clearPhrase.value === "清空") { clearAllData(); selectedTaskId.value = ""; closeDialogs(); } };
</script>

<style lang="scss" scoped>
.workday{position:relative;width:min(100%,590px);padding:clamp(1.1rem,2vw,1.5rem);color:var(--text-color)}.panel-header,.section-title,.focus-now,.summary{display:flex;align-items:center;justify-content:space-between;gap:1rem}.panel-header h1,.section-title h2,.focus-now h2,p{margin:0}.panel-header h1{font-size:1.38rem;font-weight:650}.eyebrow{color:var(--muted-text);font-size:.62rem;font-weight:700;letter-spacing:.16em}.header-actions{display:flex;align-items:center;gap:.4rem}.date-label,.section-title>span{color:var(--muted-text);font-size:.76rem;white-space:nowrap}.icon-button,.text-button,.timer button{border:0;border-radius:.5rem;background:transparent;color:inherit;cursor:pointer;font:inherit}.icon-button{padding:.2rem .45rem;font-size:1.1rem}.data-menu{position:absolute;z-index:5;top:3.7rem;right:1.25rem;display:grid;min-width:9.5rem;padding:.35rem;border:1px solid var(--surface-border);border-radius:.7rem;background:#182839ef;box-shadow:0 12px 30px rgb(0 0 0 / 24%)}.data-menu button{padding:.55rem .6rem;border:0;border-radius:.4rem;background:transparent;color:inherit;text-align:left;cursor:pointer}.data-menu button:hover{background:var(--surface-hover)}.data-menu .danger{color:#ffc0b9}.summary{margin:1.15rem 0;padding:.8rem 0;border-top:1px solid var(--surface-border);border-bottom:1px solid var(--surface-border)}.summary div{display:grid;gap:.18rem}.summary strong{font-size:1rem;font-weight:650}.summary span,.focus-now small{color:var(--muted-text);font-size:.7rem}.focus-now{padding:.9rem 1rem;border:1px solid var(--surface-border);border-radius:1rem;background:rgb(255 255 255 / 10%)}.focus-now.running{border-color:rgb(214 244 195 / 65%);box-shadow:0 0 0 3px rgb(214 244 195 / 10%)}.focus-copy{min-width:0}.focus-copy p{display:inline;color:var(--muted-text);font-size:.72rem}.focus-now h2{overflow:hidden;margin:.25rem 0;font-size:.96rem;text-overflow:ellipsis;white-space:nowrap}.status-dot{display:inline-block;width:.45rem;height:.45rem;margin-right:.38rem;border-radius:50%;background:#d5eea5;box-shadow:0 0 0 3px rgb(213 238 165 / 20%)}.timer{display:grid;justify-items:end;gap:.35rem}.timer strong{font-family:"UnidreamLED",monospace;font-size:1.45rem;letter-spacing:.04em}.timer button{padding:.35rem .55rem;background:var(--surface-hover);font-size:.7rem}.timer button:disabled{opacity:.45;cursor:not-allowed}.timeline-section{margin-top:1.4rem}.section-title{margin-bottom:.7rem}.section-title h2{margin-top:.15rem;font-size:1rem;font-weight:600}.text-button{padding:.28rem .45rem;color:var(--muted-text);font-size:.72rem}.timeline{position:relative;height:285px;margin-left:.15rem;padding-left:3.4rem;overflow:hidden;border-radius:.85rem;background:rgb(0 0 0 / 7%)}.hour-row{position:relative;height:11.11%;border-top:1px solid rgb(255 255 255 / 12%)}.hour-row:first-child{border-top:0}.hour-row time{position:absolute;top:-.48rem;left:-3.05rem;color:var(--muted-text);font-size:.65rem}.timeline-item{position:absolute;right:.7rem;left:4rem;z-index:1;display:flex;align-items:center;justify-content:space-between;min-height:1.35rem;padding:.18rem .45rem;overflow:hidden;border-radius:.45rem;color:inherit;text-align:left;font:inherit;font-size:.69rem;cursor:pointer}.timeline-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.timeline-item small{padding-left:.5rem;font-size:.62rem;white-space:nowrap}.completed{border:0;border-left:3px solid #d8f0a7;background:rgb(207 231 191 / 50%)}.planned{border:1px dashed rgb(255 255 255 / 52%);background:rgb(255 255 255 / 9%)}.now-line{position:absolute;right:.6rem;left:3.4rem;z-index:2;height:1px;background:#f7dca5;pointer-events:none}.now-line span{position:absolute;top:-.62rem;right:0;padding:.08rem .28rem;border-radius:.25rem;background:#f7dca5;color:#4b3b1f;font-size:.59rem}.add-plan{position:absolute;z-index:3;right:.7rem;bottom:.45rem;border:0;border-radius:.4rem;background:rgb(0 0 0 / 22%);color:var(--muted-text);font-size:.65rem;cursor:pointer}.timeline-note{margin:.55rem .1rem 0;color:var(--muted-text);font-size:.67rem;line-height:1.5}.task-pool{margin-top:1.25rem}.task-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.task{display:flex;min-width:0;border:1px solid var(--surface-border);border-radius:.7rem;background:rgb(255 255 255 / 8%)}.task.selected{box-shadow:0 0 0 2px var(--focus-ring)}.task.done{opacity:.55}.task-main{display:grid;flex:1;gap:.25rem;min-width:0;padding:.65rem .25rem .65rem .7rem;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.task-main span{overflow:hidden;font-size:.76rem;text-overflow:ellipsis;white-space:nowrap}.task-main small{color:var(--muted-text);font-size:.62rem}.task-check{width:2rem;border:0;background:transparent;color:inherit;cursor:pointer;font-size:1rem}.urgent{border-left:3px solid #efb7ac}.important{border-left:3px solid #d8f0a7}.delegate{border-left:3px solid #abd5ee}.later{border-left:3px solid #d5c5e8}.empty-tasks{width:100%;padding:.8rem;border:1px dashed var(--surface-border);border-radius:.7rem;background:transparent;color:var(--muted-text);cursor:pointer}.dialog-backdrop{position:fixed;z-index:20;inset:0;display:grid;place-items:center;padding:1rem;background:rgb(3 10 18 / 55%);backdrop-filter:blur(4px)}.dialog{display:grid;gap:.85rem;width:min(100%,360px);padding:1.2rem;border:1px solid var(--surface-border);border-radius:1rem;background:#162536;color:#fff;box-shadow:0 18px 45px rgb(0 0 0 / 35%)}.dialog h2{margin:0;font-size:1.1rem}.dialog p{font-size:.8rem;line-height:1.55}.dialog-subtitle{color:#b7c4d0}.dialog label{display:grid;gap:.35rem;font-size:.76rem}.dialog input,.dialog select{width:100%;padding:.58rem .65rem;border:1px solid #617185;border-radius:.5rem;background:#0d1a28;color:#fff;font:inherit}.dialog footer{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.2rem}.dialog footer button,.mode-picker button{padding:.48rem .7rem;border:1px solid var(--surface-border);border-radius:.5rem;background:transparent;color:inherit;cursor:pointer}.dialog .primary,.mode-picker button.selected{border-color:#d8f0a7;background:rgb(216 240 167 / 18%)}.dialog .danger-button{border-color:#e9a9a0;color:#ffc0b9}.dialog .danger-button:disabled{opacity:.45;cursor:not-allowed}.mode-picker{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.error{color:#ffc0b9}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}@media(max-width:900px){.workday{width:min(100%,620px)}.timeline{height:240px}}@media(max-width:420px){.task-grid{grid-template-columns:1fr}.header-actions{gap:.1rem}.date-label{font-size:.68rem}}
.workday{display:flex;height:100%;min-height:0;width:100%;padding:clamp(.8rem,1.6vh,1.5rem);overflow:hidden}.summary{margin:clamp(.55rem,1.4vh,1.15rem) 0;padding:.6rem 0}.focus-now{padding:.8rem 1rem}.timer button{padding:.3rem .48rem;font-size:.68rem}.timeline-section{margin-top:clamp(.7rem,1.8vh,1.25rem)}.section-title{margin-bottom:.55rem}.text-button{padding:.24rem .4rem;font-size:.7rem}.timeline{height:clamp(172px,26vh,285px)}.task-pool{margin-top:clamp(.7rem,1.5vh,1.1rem)}@media(max-height:780px){.timeline-note{display:none}.timeline{height:168px}.task-main{padding-top:.5rem;padding-bottom:.5rem}.task-pool{margin-top:.55rem}}@media(max-width:900px){.workday{width:min(100%,620px)}.timeline{height:clamp(165px,24vh,220px)}}
.reminder-chip{padding:.3rem .5rem;border:1px solid #f7dca5;border-radius:999px;background:rgb(247 220 165 / 12%);color:#f7dca5;font-size:.66rem;cursor:pointer}.reminder-chip:hover{background:rgb(247 220 165 / 24%)}@media(min-width:901px){.workday{display:grid;grid-template-columns:minmax(230px,.82fr) minmax(390px,1.35fr);grid-template-rows:auto auto auto 1fr;align-content:stretch;column-gap:1.1rem;row-gap:.75rem;padding:clamp(1rem,2vh,1.5rem)}.panel-header{grid-column:1/-1;grid-row:1}.summary{grid-column:1;grid-row:2;margin:0;align-self:stretch;flex-direction:column;align-items:stretch;justify-content:center;gap:.55rem;padding:.65rem .75rem;border:1px solid var(--surface-border);border-radius:.85rem;background:rgb(255 255 255 / 6%)}.summary div{grid-template-columns:1fr auto;align-items:baseline}.summary span{text-align:right}.focus-now{grid-column:1;grid-row:3;margin:0;align-self:stretch;flex-direction:column;align-items:stretch;justify-content:center;gap:.5rem}.timer{grid-template-columns:1fr auto;align-items:center}.timer strong{justify-self:start}.timer button{justify-self:end}.timeline-section{grid-column:2;grid-row:2 / span 2;margin:0;min-width:0}.timeline{height:clamp(290px,48vh,480px)}.heatmap-section{grid-column:1;grid-row:4;margin:0;align-self:end}.task-pool{grid-column:2;grid-row:4;margin:0;align-self:end}.task-grid{grid-template-columns:1fr 1fr}.timeline-note{margin-bottom:0}}@media(min-width:901px) and (max-height:800px){.workday{row-gap:.5rem}.timeline{height:clamp(235px,40vh,330px)}.heatmap-section .evaluation{padding:.45rem .6rem}.heatmap-section .heatmap{gap:.18rem}}
</style>
