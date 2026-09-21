import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("白天主题为工作台的主要面板提供浅色覆盖层", () => {
  const source = readFileSync(new URL("../src/components/WorkdayPanel/index.vue", import.meta.url), "utf8");

  for (const selector of [
    ":global(.theme-day) .workday.cards",
    ":global(.theme-day) .focus-now",
    ":global(.theme-day) .timer",
    ":global(.theme-day) .task-pool",
  ]) {
    assert.match(source, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
