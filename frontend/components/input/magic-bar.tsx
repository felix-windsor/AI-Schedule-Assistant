"use client"

import type React from "react"
import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Trash2 } from "lucide-react"
import { parseSchedule, ScheduleParseError } from "@/lib/api/schedule"
import { getContext } from "@/lib/utils/timezone"
import type { CalendarEvent } from "@/lib/api/types"
import { cn } from "@/lib/utils"

interface MagicBarProps {
  onEventsAdded: (events: CalendarEvent[], metadata: { total_events: number; confidence_score: number }) => void
  onError: (error: string, suggestion?: string) => void
  onClearCalendar: () => void
  scenarioText?: string // 从父组件传入的场景文本
}

export interface MagicBarRef {
  setText: (text: string) => void
}

export const MagicBar = forwardRef<MagicBarRef, MagicBarProps>(
  ({ onEventsAdded, onError, onClearCalendar, scenarioText }, ref) => {
    const [text, setText] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const maxChars = 2000

    // 暴露 setText 方法给父组件
    useImperativeHandle(ref, () => ({
      setText: (newText: string) => {
        setText(newText)
      },
    }))

    // 监听 scenarioText 变化，自动填充到输入框
    useEffect(() => {
      if (scenarioText) {
        setText(scenarioText)
      }
    }, [scenarioText])

    const handleSubmit = async () => {
      if (!text.trim()) {
        onError("请输入日程描述")
        return
      }

      if (text.length > maxChars) {
        onError("输入内容超过最大长度限制")
        return
      }

      setIsLoading(true)
      try {
        const context = getContext()
        const response = await parseSchedule({
          text: text.trim(),
          context,
          options: {
            default_duration: 60,
            allow_past_events: false,
            max_events: 10,
          },
        })

        if (response.events.length === 0) {
          onError("未解析出任何事件", '请尝试更明确的时间描述，例如"明天下午3点开会"')
        } else {
          onEventsAdded(response.events, response.metadata)
          setText("")
        }
      } catch (error) {
        // 处理 ScheduleParseError，提取 suggestion
        if (error instanceof ScheduleParseError) {
          onError(error.message, error.suggestion)
        } else {
          onError(
            error instanceof Error ? error.message : "解析失败，请稍后再试",
            "请检查网络连接或稍后重试"
          )
        }
      } finally {
        setIsLoading(false)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSubmit()
      }
    }

    return (
      <motion.div
        className={cn("glass-strong rounded-2xl p-6 relative overflow-hidden", isLoading && "border-primary/50")}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {isLoading && <div className="absolute inset-0 shimmer pointer-events-none z-10" />}

        <div className="relative z-20 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 2, repeat: isLoading ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            <h2 className="text-lg font-semibold">Magic Bar</h2>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入自然语言创建日程... 例如：明天下午3点和老板开会1小时"
            className="min-h-[100px] resize-none bg-secondary/50 border-border/50 focus:border-primary/50 transition-all"
            maxLength={maxChars}
          />

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <kbd className="px-2 py-1 bg-secondary rounded text-xs border border-border/50">Ctrl</kbd>
              {" + "}
              <kbd className="px-2 py-1 bg-secondary rounded text-xs border border-border/50">Enter</kbd>
              {" 快速提交"}
            </div>
            <span className={cn("text-xs", text.length > maxChars * 0.9 ? "text-primary" : "text-muted-foreground")}>
              {text.length} / {maxChars}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !text.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="mr-2"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  思考中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  解析并添加
                </>
              )}
            </Button>
            <Button
              onClick={onClearCalendar}
              variant="outline"
              className="bg-secondary/50 hover:bg-secondary border-border/50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }
)

MagicBar.displayName = "MagicBar"
