import test from "node:test";
import assert from "node:assert/strict";
import { completeTask, deleteTask, moveTask, resolveFocusOutcome, startFocus } from "../src/domain/workdayState.js";

const task = (id, status = "planned") => ({ id, title: `任务 ${id}`, status, completedAt: null });
const block = (id, taskId, status = "planned") => ({ id, taskId, status });

test("完成任务会关闭其未完成的计划块，并保留其他任务的计划", () => {
  const state = {
    tasks: [task("a"), task("b")],
    scheduleBlocks: [block("block-a", "a"), block("block-b", "b")],
    activeTimer: null,
  };

  const next = completeTask(state, "a", "2026-09-20T09:00:00.000Z");

  assert.equal(next.tasks[0].status, "completed");
  assert.equal(next.tasks[0].completedAt, "2026-09-20T09:00:00.000Z");
  assert.equal(next.scheduleBlocks[0].status, "cancelled");
  assert.equal(next.scheduleBlocks[1].status, "planned");
});

test("正在专注的任务不能被直接完成", () => {
  const state = {
    tasks: [task("a", "active")],
    scheduleBlocks: [block("block-a", "a")],
    activeTimer: { taskId: "a", status: "running" },
  };

  assert.throws(() => completeTask(state, "a", "2026-09-20T09:00:00.000Z"), /正在专注/);
});

test("开始专注会将目标任务设为当前任务，并让此前当前任务回到已安排状态", () => {
  const state = {
    tasks: [task("a", "active"), task("b", "planned")],
    scheduleBlocks: [block("block-a", "a"), block("block-b", "b")],
    activeTimer: null,
  };

  const next = startFocus(state, "b");

  assert.equal(next.tasks[0].status, "planned");
  assert.equal(next.tasks[1].status, "active");
});

test("结束本轮后，继续和休息都保留当前任务，完成则关闭后续排期", () => {
  const state = {
    tasks: [task("a", "active"), task("b", "planned")],
    scheduleBlocks: [block("block-a", "a"), block("block-b", "b")],
    activeTimer: { taskId: "a", status: "running" },
  };

  for (const action of ["continue", "rest"]) {
    const next = resolveFocusOutcome(state, "a", action, "2026-09-20T09:00:00.000Z");
    assert.equal(next.tasks[0].status, "active");
    assert.equal(next.tasks[1].status, "planned");
    assert.equal(next.scheduleBlocks[0].status, "planned");
  }

  const completed = resolveFocusOutcome(state, "a", "complete", "2026-09-20T09:00:00.000Z");
  assert.equal(completed.tasks[0].status, "completed");
  assert.equal(completed.scheduleBlocks[0].status, "cancelled");
  assert.equal(completed.scheduleBlocks[1].status, "planned");
});

test("删除正在专注的任务会清理计时器、计划和专注记录", () => {
  const state = {
    tasks: [task("a", "active"), task("b")],
    scheduleBlocks: [block("block-a", "a"), block("block-b", "b")],
    focusSessions: [{ id: "session-a", taskId: "a" }, { id: "session-b", taskId: "b" }],
    activeTimer: { taskId: "a", status: "running" },
  };
  const next = deleteTask(state, "a");
  assert.deepEqual(next.tasks.map((item) => item.id), ["b"]);
  assert.deepEqual(next.scheduleBlocks.map((item) => item.taskId), ["b"]);
  assert.deepEqual(next.focusSessions.map((item) => item.taskId), ["b"]);
  assert.equal(next.activeTimer, null);
});

test("调整优先级只交换指定的两个任务", () => {
  const state = { tasks: [task("a"), task("b"), task("c")], scheduleBlocks: [], activeTimer: null };
  const next = moveTask(state, "c", "a");
  assert.deepEqual(next.tasks.map((item) => item.id), ["c", "b", "a"]);
});
