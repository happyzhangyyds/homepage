const STORAGE_KEY = "homepage:pomodoro-data:v1";
const VERSION = 1;

export const createEmptyPomodoroData = () => ({
  version: VERSION,
  updatedAt: null,
  settings: { workdayStart: "06:30", defaultCountdownMinutes: 25 },
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

export const readPomodoroData = () => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyPomodoroData();
  try {
    const parsed = JSON.parse(raw);
    return isValidPomodoroData(parsed) ? parsed : createEmptyPomodoroData();
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
  const parsed = JSON.parse(text);
  if (!isValidPomodoroData(parsed)) throw new Error("文件不是可导入的番茄钟数据备份");
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
