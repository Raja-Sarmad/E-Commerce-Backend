/**
 * Apply optional start/end date filters to a Mongoose filter object.
 * Accepts query.start|dateFrom|from and query.end|dateTo|to (ISO date strings).
 */
function applyDateRangeFilter(filter, query, field = "createdAt") {
  const start = query.start || query.dateFrom || query.from;
  const end = query.end || query.dateTo || query.to;
  if (!start && !end) return filter;

  const range = {};
  if (start) {
    const from = new Date(start);
    if (!Number.isNaN(from.getTime())) range.$gte = from;
  }
  if (end) {
    const to = new Date(end);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      range.$lte = to;
    }
  }

  if (Object.keys(range).length > 0) filter[field] = range;
  return filter;
}

export { applyDateRangeFilter };
