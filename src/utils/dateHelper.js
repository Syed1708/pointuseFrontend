
// 1. Find Monday from any YYYY-MM-DD string or Date object safely [3]
export const getMonday = (d) => {
  const date = d instanceof Date ? d : new Date(String(d).replace(/-/g, '/') + 'T00:00:00');
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const targetDate = new Date(date.setDate(diff));
  
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dayStr = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};

// 2. Get ISO Week Number [3]
export const getWeekNumber = (dateString) => {
  if (!dateString) return '';
  const parsedDate = new Date(String(dateString).replace(/-/g, '/'));
  if (isNaN(parsedDate.getTime())) return '';

  const date = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

// 3. Format single day date (e.g. "22-06") [3]
export const getDayDateString = (mondayString, offsetDays) => {
  if (!mondayString) return '';
  const date = new Date(String(mondayString).replace(/-/g, '/'));
  if (isNaN(date.getTime())) return '';

  date.setDate(date.getDate() + offsetDays);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}`;
};

// 4. Format full range (e.g. "22-06-2026 to 28-06-2026") [3]
export const getWeekRangeString = (mondayString) => {
  if (!mondayString) return '';
  const start = new Date(String(mondayString).replace(/-/g, '/'));
  if (isNaN(start.getTime())) return '';

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  };
  return `${formatDate(start)} to ${formatDate(end)}`;
};