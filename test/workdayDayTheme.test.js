import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("白天主题为工作台的主要面板提供浅色覆盖层", () => {
  const source = readFileSync(new URL("../src/components/WorkdayPanel/index.vue", import.meta.url), "utf8");
  const appSource = readFileSync(new URL("../src/App.vue", import.meta.url), "utf8");

  assert.match(appSource, /<WorkdayPanel :current-time="currentTime" :theme="currentTime\.theme"/);
  assert.match(source, /theme: \{ type: String, default: "day" \}/);
  assert.match(source, /:class="\[`theme-\$\{theme\}`\]"/);

  for (const selector of [
    ".workday.cards.theme-day",
    ".workday.theme-day .focus-now",
    ".workday.theme-day .timer",
    ".workday.theme-day .task-pool",
  ]) {
    assert.match(source, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
