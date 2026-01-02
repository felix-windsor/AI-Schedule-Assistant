export function formatEventTime(start: string, end: string, allDay: boolean): string {
  if (allDay) {
    const startDate = new Date(start)
    return `${formatDate(startDate)} (全天)`
  }

  const startDate = new Date(start)
  const endDate = new Date(end)

  const isSameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()

  if (isSameDay) {
    return `${formatDate(startDate)} ${formatTime(startDate)} - ${formatTime(endDate)}`
  }

  return `${formatDate(startDate)} ${formatTime(startDate)} - ${formatDate(endDate)} ${formatTime(endDate)}`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date)
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
