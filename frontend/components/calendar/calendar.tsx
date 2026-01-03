"use client"

import { useEffect, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import rrulePlugin from "@fullcalendar/rrule"
import { motion } from "framer-motion"
import { getCategoryColor } from "@/lib/utils/colors"
import { convertRecurrenceToRRule } from "@/lib/utils/recurrence"
import type { CalendarEvent } from "@/lib/api/types"
import "./calendar-styles.css"

interface CalendarProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function Calendar({ events, onEventClick }: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">("week")

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.refetchEvents()
    }
  }, [events])

  const handleEventClick = (info: any) => {
    const event = events.find((e) => e.id === info.event.id)
    if (event) {
      onEventClick(event)
    }
  }

  const handleViewChange = (view: "month" | "week" | "day") => {
    setCurrentView(view)
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      const viewMap = {
        month: "dayGridMonth",
        week: "timeGridWeek",
        day: "timeGridDay",
      }
      calendarApi.changeView(viewMap[view])
    }
  }

  return (
    <motion.div
      className="glass-strong rounded-2xl overflow-hidden"
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
          {(["month", "week", "day"] as const).map((view) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                currentView === view ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {view === "month" ? "月" : view === "week" ? "周" : "日"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          locale="zh-cn"
          firstDay={1}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="08:00:00"
          height="auto"
          editable={true}
          selectable={true}
          events={events.map((event) => {
            // 确保时间格式正确（FullCalendar 需要 ISO 8601 格式）
            const start = event.start
            const end = event.end

            // 转换 recurrence 为 RRULE 字符串
            const rrule = convertRecurrenceToRRule(event)

            // 构建 FullCalendar 事件对象
            return {
              id: event.id,
              title: event.title,
              start: start, // ISO 8601 格式，包含时区
              end: end, // ISO 8601 格式，包含时区
              allDay: event.allDay || false,
              backgroundColor: event.backgroundColor || getCategoryColor(event.extendedProps?.category),
              borderColor: event.borderColor || event.backgroundColor || getCategoryColor(event.extendedProps?.category),
              textColor: event.textColor || "#ffffff",
              // 添加 rrule 字段用于重复事件
              rrule: rrule || undefined,
              // FullCalendar 会自动处理 extendedProps
              extendedProps: {
                description: event.description || event.extendedProps?.description,
                location: event.location || event.extendedProps?.location,
                category: event.extendedProps?.category,
                timezone: event.extendedProps?.timezone,
                priority: event.extendedProps?.priority,
                // 保留原始 metadata 用于显示
                metadata: event.metadata,
              },
            }
          })}
          eventClick={handleEventClick}
          buttonText={{
            today: "今天",
            month: "月",
            week: "周",
            day: "日",
          }}
          allDayText="全天"
          noEventsText="暂无日程"
        />
      </div>
    </motion.div>
  )
}
