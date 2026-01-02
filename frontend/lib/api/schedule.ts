import type { ParseRequest, ParseResponse, ErrorResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
const API_ENDPOINT = `${API_BASE_URL}/api/v1/events/parse`

// 自定义错误类，用于传递详细的错误信息
export class ScheduleParseError extends Error {
  suggestion?: string
  code?: string
  details?: string

  constructor(message: string, suggestion?: string, code?: string, details?: string) {
    super(message)
    this.name = "ScheduleParseError"
    this.suggestion = suggestion
    this.code = code
    this.details = details
  }
}

export async function parseSchedule(request: ParseRequest): Promise<ParseResponse> {
  // 开发环境下输出 API 地址（用于调试）
  if (process.env.NODE_ENV === "development") {
    console.log("[API] 请求地址:", API_ENDPOINT)
    console.log("[API] 请求数据:", { text: request.text.substring(0, 50) + "..." })
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })

    // 检查响应状态
    if (!response.ok) {
      // 尝试解析错误响应
      try {
        const errorData: ErrorResponse = await response.json()
        if (errorData.error) {
          const { message, details, suggestion, code } = errorData.error
          throw new ScheduleParseError(
            details || message || "请求失败",
            suggestion,
            code,
            details
          )
        }
      } catch (parseError) {
        // 如果无法解析错误响应，使用 HTTP 状态码
        throw new ScheduleParseError(
          `请求失败 (HTTP ${response.status})`,
          "请检查网络连接或稍后重试"
        )
      }
    }

    const data: ParseResponse | ErrorResponse = await response.json()

    // 检查响应数据
    if (!data.success) {
      const errorData = data as ErrorResponse
      if (errorData.error) {
        const { message, details, suggestion, code } = errorData.error
        throw new ScheduleParseError(
          details || message || "请求失败",
          suggestion,
          code,
          details
        )
      }
      throw new ScheduleParseError("请求失败", "请重试")
    }

    return data as ParseResponse
  } catch (error) {
    // 网络错误处理
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ScheduleParseError(
        "无法连接到 AI 解析服务",
        "请检查网络连接或确认后端服务是否运行在 " + API_BASE_URL
      )
    }

    // 如果已经是 ScheduleParseError，直接抛出
    if (error instanceof ScheduleParseError) {
      throw error
    }

    // 其他错误
    throw new ScheduleParseError(
      error instanceof Error ? error.message : "未知错误",
      "请稍后重试或联系技术支持"
    )
  }
}
