import { computed, ref } from "vue";
import {
  createEmptyPomodoroData,
  mergePomodoroData,
  parseImportedPomodoroData,
  readPomodoroData,
  removePomodoroData,
  writePomodoroData,
} from "@/utils/pomodoroStorage";
import { completeTask as completeWorkdayTask, deleteTask as deleteWorkdayTask, moveTask as moveWorkdayTask, resolveFocusOutcome, startFocus } from "@/domain/workdayState";

const state = ref(null);
const currentMoment = ref(new Date());
const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));
const minutesBetween = (start, end) => Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));

const workdayKeyFor = (date, start = "08:30") => {
  const current = new Date(date);
  const [hour, minute] = start.split(":").map(Number);
  if (current.getHours() < hour || (current.getHours() === hour && current.getMinutes() < minute)) current.setDate(current.getDate() - 1);
  return current.toLocaleDateString("en-CA");
};

const persist = () => {
  state.value = writePomodoroData(clone(state.value));
};

export const usePomodoroStore = () => {
  if (!state.value) state.value = readPomodoroData();

  const currentWorkday = computed(() => workdayKeyFor(currentMoment.value, state.value.settings.workdayStart));
  const activeTask = computed(() => state.value.tasks.find((task) => task.id === state.value.activeTimer?.taskId) || null);
  const currentTask = computed(() => state.value.tasks.find((task) => task.status === "active") || null);

  const addTask = ({ title, quadrant = "important", estimatePomodoros = 1 }) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) throw new Error("请输入任务名称");
    const task = { id: id(), title: cleanTitle, quadrant, estimatePomodoros: Number(estimatePomodoros) || 1, status: "inbox", createdAt: new Date().toISOString() };
    state.value.tasks.unshift(task);
    persist();
    return task;
  };

  const completeTask = (taskId) => {
    state.value = completeWorkdayTask(state.value, taskId);
    persist();
  };

  const deleteTask = (taskId) => {
    state.value = deleteWorkdayTask(state.value, taskId);
    persist();
  };

  const moveTask = (taskId, targetTaskId) => {
    state.value = moveWorkdayTask(state.value, taskId, targetTaskId);
    persist();
  };

  const archiveTask = (taskId) => {
    const task = state.value.tasks.find((item) => item.id === taskId);
    if (!task) return;
    task.status = "archived";
    persist();
  };

  const addScheduleBlock = ({ taskId, startTime, durationMinutes }) => {
    const duration = Number(durationMinutes);
    if (!taskId || !/^\d{2}:\d{2}$/.test(startTime) || !Number.isFinite(duration) || duration < 5) throw new Error("请填写有效的计划时间和时长");
    const task = state.value.tasks.find((item) => item.id === taskId);
    if (!task || ["completed", "archived", "waiting"].includes(task.status)) throw new Error("请选择可安排的任务");
    if (task.status !== "active") task.status = "planned";
    const block = { id: id(), taskId, workday: currentWorkday.value, startTime, durationMinutes: duration, status: "planned", createdAt: new Date().toISOString() };
    state.value.scheduleBlocks.push(block);
    persist();
    return block;
  };

  const removeScheduleBlock = (blockId) => {
    state.value.scheduleBlocks = state.value.scheduleBlocks.filter((block) => block.id !== blockId);
    persist();
  };

  const startTimer = ({ taskId, mode, durationMinutes }) => {
    if (!taskId || !["countdown", "stopwatch"].includes(mode)) throw new Error("请选择任务和计时模式");
    const task = state.value.tasks.find((item) => item.id === taskId);
    if (!task || !["planned", "active"].includes(task.status)) throw new Error("请先将任务安排到今日计划，再开始专注");
    if (state.value.activeTimer) throw new Error("请先结束正在进行的专注");
    state.value = startFocus(state.value, taskId);
    const startedAt = new Date().toISOString();
    state.value.activeTimer = { taskId, mode, status: "running", startedAt, initialStartedAt: startedAt, elapsedBeforePause: 0, plannedSeconds: mode === "countdown" ? Number(durationMinutes) * 60 : null };
    persist();
  };

  const pauseTimer = () => {
    const timer = state.value.activeTimer;
    if (!timer || timer.status !== "running") return;
    timer.elapsedBeforePause += Math.max(0, Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000));
    timer.status = "paused";
    persist();
  };

  const resumeTimer = () => {
    const timer = state.value.activeTimer;
    if (!timer || timer.status !== "paused") return;
    timer.startedAt = new Date().toISOString();
    timer.status = "running";
    persist();
  };

  const stopTimer = (status = "completed") => {
    const timer = state.value.activeTimer;
    if (!timer) return;
    const endedAt = new Date().toISOString();
    const measuredSeconds = timer.elapsedBeforePause + (timer.status === "running" ? Math.max(0, Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000)) : 0);
    const actualSeconds = timer.mode === "countdown" && timer.plannedSeconds ? Math.min(measuredSeconds, timer.plannedSeconds) : measuredSeconds;
    state.value.focusSessions.push({ id: id(), taskId: timer.taskId, mode: timer.mode, plannedSeconds: timer.plannedSeconds, startedAt: timer.initialStartedAt || timer.startedAt, endedAt, actualSeconds, status, workday: currentWorkday.value });
    state.value.activeTimer = null;
    persist();
  };

  const settleTimer = (action) => {
    const timer = state.value.activeTimer;
    if (!timer) return;
    const taskId = timer.taskId;
    stopTimer("completed");
    state.value = resolveFocusOutcome(state.value, taskId, action);
    persist();
    if (action === "continue") startTimer({ taskId, mode: "countdown", durationMinutes: 25 });
  };

  const discardTimer = () => {
    state.value.activeTimer = null;
    persist();
  };

  const getElapsedSeconds = () => {
    const timer = state.value.activeTimer;
    if (!timer) return 0;
    return timer.elapsedBeforePause + (timer.status === "running" ? Math.max(0, Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000)) : 0);
  };

  const todaySessions = computed(() => state.value.focusSessions.filter((session) => session.workday === currentWorkday.value));
  const todayStats = computed(() => {
    const seconds = todaySessions.value.filter((item) => item.status === "completed").reduce((sum, item) => sum + item.actualSeconds, 0);
    const active = state.value.tasks.filter((task) => task.status !== "archived");
    return { minutes: Math.floor(seconds / 60), completedTasks: active.filter((task) => task.status === "completed").length, totalTasks: active.length, longestMinutes: Math.floor(Math.max(0, ...todaySessions.value.map((item) => item.actualSeconds)) / 60) };
  });

  const exportData = () => JSON.stringify(state.value, null, 2);
  const importData = (text, mode) => {
    const incoming = parseImportedPomodoroData(text);
    state.value = mode === "merge" ? mergePomodoroData(state.value, incoming) : incoming;
    persist();
  };
  const clearAllData = () => { removePomodoroData(); state.value = createEmptyPomodoroData(); };
  const refreshWorkday = () => { currentMoment.value = new Date(); };

  return { state, currentWorkday, activeTask, currentTask, todaySessions, todayStats, addTask, completeTask, deleteTask, moveTask, archiveTask, addScheduleBlock, removeScheduleBlock, startTimer, pauseTimer, resumeTimer, stopTimer, settleTimer, discardTimer, getElapsedSeconds, exportData, importData, clearAllData, refreshWorkday, minutesBetween };
};
