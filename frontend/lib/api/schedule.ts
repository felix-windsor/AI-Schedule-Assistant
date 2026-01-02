import type { ParseRequest, ParseResponse, ErrorResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
const API_ENDPOINT = `${API_BASE_URL}/api/v1/events/parse`

export async function parseSchedule(request: ParseRequest): Promise<ParseResponse> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })

    const data: ParseResponse | ErrorResponse = await response.json()

    if (!response.ok || !data.success) {
      const errorData = data as ErrorResponse
      throw new Error(errorData.error?.details || errorData.error?.message || "请求失败")
    }

    return data as ParseResponse
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("无法连接到 AI 解析服务，请检查网络连接")
    }
    throw error
  }
}
