export interface ParseRequest {
  text: string
  context: {
    current_time: string
    timezone: string
    locale: string
  }
  options: {
    default_duration: number
    allow_past_events: boolean
    max_events: number
  }
}

export interface ParseResponse {
  success: true
  timestamp: string
  request_id: string
  events: CalendarEvent[]
  metadata: {
    total_events: number
    parsing_time_ms: number
    confidence_score: number
    model: string
    use_structured_outputs: boolean
  }
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  description: string | null
  location: string | null
  backgroundColor: string | null
  borderColor: string | null
  textColor: string | null
  extendedProps: {
    description: string | null
    location: string | null
    category: "work" | "personal" | "health" | "other" | null
    timezone: string | null
    priority: string | null
  }
  recurrence: {
    freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
    interval: number | null
    byDay: string[] | null
    until: string | null
    count: number | null
  } | null
  metadata: {
    confidence: number
    sourceText: string
    inferredFields: string[]
  } | null
}

export interface ErrorResponse {
  success: false
  timestamp: string
  error: {
    code: string
    message: string
    details: string
    suggestion: string
  }
  httpStatus: number
}

export type StatusMessageType = "success" | "error" | "warning" | "loading"
