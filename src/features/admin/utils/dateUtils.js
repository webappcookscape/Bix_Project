export const todayISO = () => new Date().toISOString().slice(0, 10);

export const isProjectOverdue = (project) => {
  if (!project.startDate) return false;

  const start = new Date(project.startDate);
  const explicitDeadline = project.deadline ? new Date(project.deadline) : null;

  // 45-day default SLA
  const slaDeadline = new Date(start);
  slaDeadline.setDate(slaDeadline.getDate() + 45);

  const effectiveDeadline = explicitDeadline && explicitDeadline < slaDeadline
    ? explicitDeadline
    : slaDeadline;

  const today = new Date(todayISO());

  return today > effectiveDeadline;
};

export const isTaskOverdue = (task) => {
  if (!task.dueDate) return false;
  if (['completed', 'done'].includes((task.status || "").toLowerCase())) return false;

  const due = new Date(task.dueDate);
  const today = new Date(todayISO());
  return today > due;
};
