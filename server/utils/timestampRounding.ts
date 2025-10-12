// Utility to round timestamps to prevent timing triangulation attacks
// Strips millisecond/second/minute precision from timestamps in exports

export function roundTimestampToDay(timestamp: Date | string | null): string | null {
  if (!timestamp) return null;
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // Round to start of day (YYYY-MM-DD 00:00:00)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function roundTimestampToHour(timestamp: Date | string | null): string | null {
  if (!timestamp) return null;
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // Round to start of hour (YYYY-MM-DD HH:00:00)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:00`;
}
