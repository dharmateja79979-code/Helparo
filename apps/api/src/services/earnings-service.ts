export const computeHelperEarningsSummary = (
  rows: Array<{ final_price: unknown; created_at: unknown }>,
  nowDate?: Date
) => {
  const current = nowDate ?? new Date();
  const weekStart = new Date(current);
  weekStart.setDate(current.getDate() - 7);
  const monthStart = new Date(current);
  monthStart.setMonth(current.getMonth() - 1);

  let week = 0;
  let month = 0;
  let totalJobs = 0;

  for (const row of rows) {
    const value = Number(row.final_price ?? 0);
    const createdAt = new Date(String(row.created_at));
    totalJobs += 1;
    if (createdAt >= weekStart) week += value;
    if (createdAt >= monthStart) month += value;
  }

  return { week, month, totalJobs };
};
