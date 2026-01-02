"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, MapPin, Tag, Trash2, Info, X } from "lucide-react"
import { formatEventTime } from "@/lib/utils/date"
import { getCategoryColor, getCategoryLabel } from "@/lib/utils/colors"
import type { CalendarEvent } from "@/lib/api/types"

interface EventDrawerProps {
  event: CalendarEvent | null
  onClose: () => void
  onDelete: (eventId: string) => void
}

export function EventDrawer({ event, onClose, onDelete }: EventDrawerProps) {
  if (!event) return null

  const handleDelete = () => {
    onDelete(event.id)
  }

  const confidence = Math.round((event.metadata?.confidence || 0) * 100)

  return (
    <AnimatePresence>
      {event && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] glass-strong border-l border-border/50 z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-semibold pr-8">{event.title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-secondary/50">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Time */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">时间</div>
                    <div className="text-sm">{formatEventTime(event.start, event.end, event.allDay)}</div>
                  </div>
                </motion.div>

                {/* Location */}
                {event.extendedProps.location && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">地点</div>
                      <div className="text-sm">{event.extendedProps.location}</div>
                    </div>
                  </motion.div>
                )}

                {/* Description */}
                {event.extendedProps.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <Info className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">描述</div>
                      <div className="text-sm">{event.extendedProps.description}</div>
                    </div>
                  </motion.div>
                )}

                {/* Category */}
                {event.extendedProps.category && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <Tag className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">分类</div>
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
                  </motion.div>
                )}

                {/* AI Metadata */}
                {event.metadata && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4 pt-6 border-t border-border/50"
                  >
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
                      AI 分析
                    </div>

                    {/* Confidence Score */}
                    <div className="p-4 rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground">置信度</span>
                        <span className="text-sm font-semibold text-primary">{confidence}%</span>
                      </div>
                      <Progress value={confidence} className="h-2" />
                    </div>

                    {/* Inferred Fields */}
                    {event.metadata.inferredFields && event.metadata.inferredFields.length > 0 && (
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <div className="text-sm text-muted-foreground mb-3">推断字段</div>
                        <div className="flex flex-wrap gap-2">
                          {event.metadata.inferredFields.map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Source Text */}
                    {event.metadata.sourceText && (
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <div className="text-sm text-muted-foreground mb-3">原始文本</div>
                        <div className="text-xs font-mono bg-background/50 p-3 rounded-md border border-border/30">
                          {event.metadata.sourceText}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex gap-3 pt-6 mt-6 border-t border-border/50"
              >
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 bg-secondary/50 hover:bg-secondary border-border/50"
                >
                  关闭
                </Button>
                <Button onClick={handleDelete} className="flex-1 bg-primary hover:bg-primary/90 text-white">
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
