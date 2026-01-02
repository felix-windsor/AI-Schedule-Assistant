"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MagicBar, type MagicBarRef } from "@/components/input/magic-bar"
import { Calendar } from "@/components/calendar/calendar"
import { EventDrawer } from "@/components/calendar/event-drawer"
import { TestScenarios } from "@/components/input/test-scenarios"
import { Header } from "@/components/layout/header"
import type { CalendarEvent, StatusMessageType } from "@/lib/api/types"

export default function Page() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [statusMessage, setStatusMessage] = useState<{
    type: StatusMessageType
    message: string
    suggestion?: string
    metadata?: { total_events?: number; confidence_score?: number }
  } | null>(null)
  const [newEventAnimation, setNewEventAnimation] = useState<CalendarEvent | null>(null)
  const magicBarRef = useRef<MagicBarRef>(null)

  const handleEventsAdded = (
    newEvents: CalendarEvent[],
    metadata: { total_events: number; confidence_score: number },
  ) => {
    if (newEvents.length > 0) {
      setNewEventAnimation(newEvents[0])
      setTimeout(() => setNewEventAnimation(null), 1000)
    }

    setEvents([...events, ...newEvents])
    setStatusMessage({
      type: "success",
      message: `成功添加 ${metadata.total_events} 个日程`,
      metadata,
    })
    setTimeout(() => setStatusMessage(null), 5000)
  }

  const handleError = (error: string, suggestion?: string) => {
    setStatusMessage({
      type: "error",
      message: error,
      suggestion: suggestion,
    })
    // 错误消息不自动消失，需要用户手动关闭
  }

  const handleScenarioSelect = (text: string) => {
    if (magicBarRef.current) {
      magicBarRef.current.setText(text)
    }
  }

  const handleClearCalendar = () => {
    setEvents([])
    setStatusMessage({
      type: "success",
      message: "日历已清空",
    })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((e: CalendarEvent) => e.id !== eventId))
    setSelectedEvent(null)
    setStatusMessage({
      type: "success",
      message: "事件已删除",
    })
    setTimeout(() => setStatusMessage(null), 3000)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] via-[#050505] to-[#030303]">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <MagicBar
            ref={magicBarRef}
            onEventsAdded={handleEventsAdded}
            onError={handleError}
            onClearCalendar={handleClearCalendar}
          />
        </motion.div>

        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="my-6"
            >
              <div
                className={`glass-strong rounded-lg p-4 border ${
                  statusMessage.type === "success"
                    ? "border-green-500/30 text-green-400"
                    : statusMessage.type === "warning"
                      ? "border-yellow-500/30 text-yellow-400"
                      : "border-red-500/30 text-red-400"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="text-sm whitespace-pre-line">{statusMessage.message}</div>
                    {statusMessage.suggestion && (
                      <div className="text-xs opacity-80 mt-2 pt-2 border-t border-current/20">
                        💡 {statusMessage.suggestion}
                      </div>
                    )}
                    {statusMessage.metadata && statusMessage.type === "success" && (
                      <div className="text-xs opacity-70 mt-2">
                        置信度: {Math.round((statusMessage.metadata.confidence_score || 0) * 100)}%
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setStatusMessage(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    aria-label="关闭消息"
                  >
                    ×
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
          {/* Test Scenarios Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <TestScenarios onScenarioSelect={handleScenarioSelect} />
          </motion.div>

          {/* Calendar Main Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-9"
          >
            <Calendar events={events} onEventClick={handleEventClick} />
          </motion.div>
        </div>
      </main>

      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} onDelete={handleDeleteEvent} />
    </div>
  )
}
