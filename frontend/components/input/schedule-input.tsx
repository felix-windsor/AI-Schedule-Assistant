"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, Trash2 } from "lucide-react"
import { parseSchedule } from "@/lib/api/schedule"
import { getContext } from "@/lib/utils/timezone"
import type { CalendarEvent } from "@/lib/api/types"

interface ScheduleInputProps {
  onEventsAdded: (events: CalendarEvent[], metadata: { total_events: number; confidence_score: number }) => void
  onError: (error: string, suggestion?: string) => void
  onClearCalendar: () => void
}

export function ScheduleInput({ onEventsAdded, onError, onClearCalendar }: ScheduleInputProps) {
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const maxChars = 2000

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
      onError(error instanceof Error ? error.message : "解析失败，请稍后再试", "请检查网络连接或稍后重试")
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
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          输入日程描述
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如：明天下午3点和老板开会1小时，晚上7点健身"
            className="min-h-[160px] resize-none"
            maxLength={maxChars}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>按 Ctrl+Enter 快速提交</span>
            <span className={text.length > maxChars * 0.9 ? "text-destructive" : ""}>
              {text.length} / {maxChars}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleSubmit} disabled={isLoading || !text.trim()} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                解析中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                解析并添加到日历
              </>
            )}
          </Button>
          <Button onClick={onClearCalendar} variant="outline" className="sm:w-auto bg-transparent">
            <Trash2 className="w-4 h-4 mr-2" />
            清空日历
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
