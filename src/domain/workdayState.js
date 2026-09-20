const cloneTask = (task) => ({ ...task });
const cloneBlock = (block) => ({ ...block });

const findTask = (state, taskId) => {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("任务不存在");
  return task;
};

export const startFocus = (state, taskId) => {
  const target = findTask(state, taskId);
  if (["completed", "archived", "waiting"].includes(target.status)) throw new Error("该任务当前不能开始专注");

  return {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id === taskId) return { ...cloneTask(task), status: "active" };
      if (task.status === "active") return { ...cloneTask(task), status: "planned" };
      return cloneTask(task);
    }),
  };
};

export const completeTask = (state, taskId, completedAt = new Date().toISOString()) => {
  if (state.activeTimer?.taskId === taskId) throw new Error("正在专注的任务不能直接完成，请先结束本轮专注");
  findTask(state, taskId);

  return {
    ...state,
    tasks: state.tasks.map((task) => task.id === taskId
      ? { ...cloneTask(task), status: "completed", completedAt }
      : cloneTask(task)),
    scheduleBlocks: state.scheduleBlocks.map((block) => block.taskId === taskId && block.status === "planned"
      ? { ...cloneBlock(block), status: "cancelled" }
      : cloneBlock(block)),
  };
};

export const deleteTask = (state, taskId) => {
  findTask(state, taskId);
  return {
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId).map(cloneTask),
    scheduleBlocks: state.scheduleBlocks.filter((block) => block.taskId !== taskId).map(cloneBlock),
    focusSessions: (state.focusSessions || []).filter((session) => session.taskId !== taskId).map((session) => ({ ...session })),
    activeTimer: state.activeTimer?.taskId === taskId ? null : state.activeTimer,
  };
};

export const moveTask = (state, taskId, targetTaskId) => {
  const index = state.tasks.findIndex((task) => task.id === taskId);
  const targetIndex = state.tasks.findIndex((task) => task.id === targetTaskId);
  if (index < 0 || targetIndex < 0) throw new Error("任务不存在");
  const tasks = state.tasks.map(cloneTask);
  [tasks[index], tasks[targetIndex]] = [tasks[targetIndex], tasks[index]];
  return { ...state, tasks };
};

export const resolveFocusOutcome = (state, taskId, action, completedAt = new Date().toISOString()) => {
  if (!['continue', 'rest', 'complete'].includes(action)) throw new Error("无效的专注结束动作");
  if (action === 'complete') return completeTask({ ...state, activeTimer: null }, taskId, completedAt);
  return { ...startFocus(state, taskId), activeTimer: null };
};
