export const generateOccurrences = (
  startDate: Date,
  endDate: Date,
  pattern: string
): Date[] => {
  const dates: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) return [];
  
  // Set up dynamic pointer starting from the initial date
  const current = new Date(start);
  
  if (pattern === 'DAILY') {
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  } else if (pattern === 'WEEKLY') {
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
  } else {
    // Parse custom days: e.g. "MON, WED, FRI" or "Monday, Wednesday"
    const dayMap: Record<string, number> = {
      sun: 0, sunday: 0,
      mon: 1, monday: 1,
      tue: 2, tuesday: 2,
      wed: 3, wednesday: 3,
      thu: 4, thursday: 4,
      fri: 5, friday: 5,
      sat: 6, saturday: 6
    };
    
    const targetDays = pattern
      .split(',')
      .map(d => d.trim().toLowerCase())
      .map(d => dayMap[d])
      .filter((d): d is number => d !== undefined);
    
    if (targetDays.length > 0) {
      while (current <= end) {
        if (targetDays.includes(current.getDay())) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
    }
  }
  return dates;
};
