const safeCell = (value) => {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const escapeXml = (value) =>
  safeCell(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "");
const minutes = (seconds) => Math.round((Number(seconds) || 0) / 60);

const worksheet = (name, columns, rows) => {
  const header = columns.map(({ label }) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(label)}</Data></Cell>`).join("");
  const body = rows
    .map((row) => `<Row>${columns.map(({ key }) => `<Cell><Data ss:Type="String">${escapeXml(row[key])}</Data></Cell>`).join("")}</Row>`)
    .join("");
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table><Row>${header}</Row>${body}</Table></Worksheet>`;
};

const taskById = (data) => new Map(data.tasks.map((task) => [task.id, task]));

export const createExcelWorkbook = (data) => {
  const tasks = taskById(data);
  const completedSessions = data.focusSessions.filter((session) => session.status === "completed");
  const totalMinutes = completedSessions.reduce((sum, session) => sum + minutes(session.actualSeconds), 0);
  const taskMetrics = completedSessions.reduce((result, session) => {
    const metric = result[session.taskId] || { focusMinutes: 0, sessionCount: 0 };
    metric.focusMinutes += minutes(session.actualSeconds);
    metric.sessionCount += 1;
    result[session.taskId] = metric;
    return result;
  }, {});
  const overviewRows = [
    { metric: "导出时间", value: formatDateTime(new Date()) },
    { metric: "有效专注分钟", value: totalMinutes },
    { metric: "完成专注次数", value: completedSessions.length },
    { metric: "任务总数", value: data.tasks.length },
    { metric: "已完成任务", value: data.tasks.filter((task) => task.status === "completed").length },
  ];
  const taskRows = data.tasks.map((task) => ({
    title: task.title,
    quadrant: task.quadrant,
    estimatedPomodoros: task.estimatePomodoros,
    completedSessions: taskMetrics[task.id]?.sessionCount || 0,
    focusMinutes: taskMetrics[task.id]?.focusMinutes || 0,
    status: task.status,
    createdAt: formatDateTime(task.createdAt),
    completedAt: formatDateTime(task.completedAt),
  }));
  const sessionRows = data.focusSessions.map((session) => ({
    workday: session.workday,
    task: tasks.get(session.taskId)?.title || "已归档任务",
    mode: session.mode === "countdown" ? "倒计时" : "正向计时",
    plannedMinutes: session.plannedSeconds ? minutes(session.plannedSeconds) : "",
    actualMinutes: minutes(session.actualSeconds),
    status: session.status,
    startedAt: formatDateTime(session.startedAt),
    endedAt: formatDateTime(session.endedAt),
  }));
  const scheduleRows = data.scheduleBlocks.map((block) => ({
    workday: block.workday,
    task: tasks.get(block.taskId)?.title || "已归档任务",
    startTime: block.startTime,
    durationMinutes: block.durationMinutes,
    status: block.status,
  }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="header"><Font ss:Bold="1"/></Style></Styles>
${worksheet("任务明细", [{ key: "title", label: "任务" }, { key: "quadrant", label: "四象限" }, { key: "estimatedPomodoros", label: "预计番茄" }, { key: "completedSessions", label: "完成专注次数" }, { key: "focusMinutes", label: "实际专注分钟" }, { key: "status", label: "状态" }, { key: "createdAt", label: "创建时间" }, { key: "completedAt", label: "完成时间" }], taskRows)}
${worksheet("概览", [{ key: "metric", label: "指标" }, { key: "value", label: "数值" }], overviewRows)}
${worksheet("专注记录", [{ key: "workday", label: "工作日" }, { key: "task", label: "任务" }, { key: "mode", label: "模式" }, { key: "plannedMinutes", label: "计划分钟" }, { key: "actualMinutes", label: "实际分钟" }, { key: "status", label: "状态" }, { key: "startedAt", label: "开始时间" }, { key: "endedAt", label: "结束时间" }], sessionRows)}
${worksheet("计划", [{ key: "workday", label: "工作日" }, { key: "task", label: "任务" }, { key: "startTime", label: "开始时间" }, { key: "durationMinutes", label: "计划分钟" }, { key: "status", label: "状态" }], scheduleRows)}
</Workbook>`;
};

export const downloadFile = (content, filename, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
