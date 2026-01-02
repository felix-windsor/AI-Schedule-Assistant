"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, MapPin, Tag, Trash2, Info } from "lucide-react"
import { formatEventTime } from "@/lib/utils/date"
import { getCategoryColor, getCategoryLabel } from "@/lib/utils/colors"
import type { CalendarEvent } from "@/lib/api/types"

interface EventModalProps {
  event: CalendarEvent
  onClose: () => void
  onDelete: (eventId: string) => void
}

export function EventModal({ event, onClose, onDelete }: EventModalProps) {
  const handleDelete = () => {
    onDelete(event.id)
  }

  const confidence = Math.round((event.metadata?.confidence || 0) * 100)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-sm text-muted-foreground mb-1">时间</div>
              <div className="text-sm">{formatEventTime(event.start, event.end, event.allDay)}</div>
            </div>
          </div>

          {event.extendedProps.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-sm text-muted-foreground mb-1">地点</div>
                <div className="text-sm">{event.extendedProps.location}</div>
              </div>
            </div>
          )}

          {event.extendedProps.description && (
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-sm text-muted-foreground mb-1">描述</div>
                <div className="text-sm">{event.extendedProps.description}</div>
              </div>
            </div>
          )}

          {event.extendedProps.category && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-sm text-muted-foreground mb-1">分类</div>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: getCategoryColor(event.extendedProps.category) + "20",
                    color: getCategoryColor(event.extendedProps.category),
                    borderColor: getCategoryColor(event.extendedProps.category),
                  }}
                  className="border"
                >
                  {getCategoryLabel(event.extendedProps.category)}
                </Badge>
              </div>
            </div>
          )}

          {event.metadata && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">AI 置信度</span>
                  <span className="text-sm font-medium">{confidence}%</span>
                </div>
                <Progress value={confidence} className="h-2" />
              </div>

              {event.metadata.inferredFields && event.metadata.inferredFields.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">推断字段</div>
                  <div className="flex flex-wrap gap-2">
                    {event.metadata.inferredFields.map((field) => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {event.metadata.sourceText && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">原始文本</div>
                  <div className="text-xs bg-muted p-2 rounded-md">{event.metadata.sourceText}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            关闭
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="flex-1">
            <Trash2 className="w-4 h-4 mr-2" />
            删除事件
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
