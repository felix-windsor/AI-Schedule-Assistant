"use client"

import { useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, AlertTriangle, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { StatusMessageType } from "@/lib/api/types"

interface StatusMessageProps {
  type: StatusMessageType
  message: string
  metadata?: {
    total_events?: number
    confidence_score?: number
  }
  onClose: () => void
}

export function StatusMessage({ type, message, metadata, onClose }: StatusMessageProps) {
  useEffect(() => {
    if (type === "success") {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [type, onClose])

  const config = {
    success: {
      icon: CheckCircle2,
      className: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    error: {
      icon: AlertCircle,
      className: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
    },
    warning: {
      icon: AlertTriangle,
      className: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    loading: {
      icon: Loader2,
      className: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },
  }

  const { icon: Icon, className } = config[type]

  return (
    <Alert className={`${className} border animate-in fade-in slide-in-from-top-2 duration-300`}>
      <Icon className={`h-4 w-4 ${type === "loading" ? "animate-spin" : ""}`} />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <div className="whitespace-pre-line">{message}</div>
          {metadata && metadata.confidence_score !== undefined && (
            <div className="text-xs mt-1 opacity-80">置信度: {Math.round(metadata.confidence_score * 100)}%</div>
          )}
        </div>
        {type !== "loading" && (
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
