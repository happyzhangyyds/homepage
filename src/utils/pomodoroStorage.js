const STORAGE_KEY = "homepage:pomodoro-data:v1";
const VERSION = 2;

export const createEmptyPomodoroData = () => ({
  version: VERSION,
  updatedAt: null,
  settings: { workdayStart: "08:30", defaultCountdownMinutes: 25 },
  tasks: [],
  scheduleBlocks: [],
  focusSessions: [],
  activeTimer: null,
});

const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

export const isValidPomodoroData = (value) =>
  isObject(value) &&
  value.version === VERSION &&
  isObject(value.settings) &&
  Array.isArray(value.tasks) &&
  Array.isArray(value.scheduleBlocks) &&
  Array.isArray(value.focusSessions) &&
  (value.activeTimer === null || isObject(value.activeTimer));

const migratePomodoroData = (value) => {
  if (!isObject(value)) return null;
  if (value.version === VERSION) return value;
  if (value.version !== 1 || !Array.isArray(value.tasks) || !Array.isArray(value.scheduleBlocks) || !Array.isArray(value.focusSessions)) return null;

  const timerTaskId = value.activeTimer?.taskId;
  const scheduledTaskIds = new Set(value.scheduleBlocks.filter((block) => block.status !== "cancelled").map((block) => block.taskId));
  return {
    ...value,
    version: VERSION,
    tasks: value.tasks.map((task) => ({
      ...task,
      status: task.status === "active" ? (task.id === timerTaskId ? "active" : (scheduledTaskIds.has(task.id) ? "planned" : "inbox")) : task.status,
    })),
    scheduleBlocks: value.scheduleBlocks.map((block) => ({ ...block, status: block.status || "planned" })),
  };
};

export const readPomodoroData = () => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyPomodoroData();
  try {
    const parsed = migratePomodoroData(JSON.parse(raw));
    return parsed && isValidPomodoroData(parsed) ? parsed : createEmptyPomodoroData();
  } catch {
    return createEmptyPomodoroData();
  }
};

export const writePomodoroData = (data) => {
  if (!isValidPomodoroData(data)) throw new Error("番茄钟数据格式无效");
  const next = { ...data, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const removePomodoroData = () => window.localStorage.removeItem(STORAGE_KEY);

export const parseImportedPomodoroData = (text) => {
  const parsed = migratePomodoroData(JSON.parse(text));
  if (!parsed || !isValidPomodoroData(parsed)) throw new Error("文件不是可导入的番茄钟数据备份");
  return parsed;
};

export const mergePomodoroData = (current, incoming) => {
  const mergeById = (left, right) => {
    const byId = new Map(left.map((item) => [item.id, item]));
    right.forEach((item) => byId.set(item.id, item));
    return [...byId.values()];
  };
  return {
    ...current,
    tasks: mergeById(current.tasks, incoming.tasks),
    scheduleBlocks: mergeById(current.scheduleBlocks, incoming.scheduleBlocks),
    focusSessions: mergeById(current.focusSessions, incoming.focusSessions),
    settings: { ...current.settings, ...incoming.settings },
  };
};

export { STORAGE_KEY };
