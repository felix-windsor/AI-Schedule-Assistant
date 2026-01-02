export function getContext() {
  const now = new Date()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return {
    current_time: formatISO8601WithTimezone(now),
    timezone: timezone,
    locale: "zh-CN",
  }
}

export function formatISO8601WithTimezone(date: Date): string {
  const offset = -date.getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(offset) / 60)
  const offsetMinutes = Math.abs(offset) % 60
  const offsetSign = offset >= 0 ? "+" : "-"
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}${offsetStr}`
}
