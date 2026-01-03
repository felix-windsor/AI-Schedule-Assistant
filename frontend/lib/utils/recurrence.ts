import { RRule } from 'rrule'
import type { CalendarEvent } from '@/lib/api/types'

/**
 * 将 CalendarEvent 的 recurrence 对象转换为 RRULE 字符串
 * 用于 FullCalendar 的 rrule 插件
 */
export function convertRecurrenceToRRule(event: CalendarEvent): string | null {
  if (!event.recurrence) {
    return null
  }

  const { freq, interval, byDay, until, count } = event.recurrence

  // 转换频率（使用 rrule 的常量值）
  const freqMap: Record<string, number> = {
    DAILY: 3, // RRule.DAILY
    WEEKLY: 2, // RRule.WEEKLY
    MONTHLY: 1, // RRule.MONTHLY
    YEARLY: 0, // RRule.YEARLY
  }

  // 转换星期几（使用 rrule 的常量值，byweekday 需要数字数组）
  const dayMap: Record<string, number> = {
    MO: 0, // Monday
    TU: 1, // Tuesday
    WE: 2, // Wednesday
    TH: 3, // Thursday
    FR: 4, // Friday
    SA: 5, // Saturday
    SU: 6, // Sunday
  }

  const options: {
    freq: number
    interval: number
    dtstart: Date
    byweekday?: number[]
    until?: Date
    count?: number
  } = {
    freq: freqMap[freq],
    interval: interval || 1,
    dtstart: new Date(event.start),
  }

  if (byDay && byDay.length > 0) {
    // byweekday 接受数字数组（0=Monday, 1=Tuesday, ..., 6=Sunday）
    options.byweekday = byDay.map(day => dayMap[day]).filter((day): day is number => day !== undefined)
  }

  // 只有当用户明确指定结束时间时才设置 until
  if (until) {
    options.until = new Date(until)
  }

  // 只有当用户明确指定重复次数时才设置 count
  if (count) {
    options.count = count
  }

  // 如果既没有 until 也没有 count，RRULE 将无限重复
  // FullCalendar 会根据当前视图动态生成事件实例

  const rule = new RRule(options)
  return rule.toString()
}

