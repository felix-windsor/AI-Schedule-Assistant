/**
 * FullCalendar 兼容的事件 Schema
 * 用于 OpenAI Structured Outputs
 */

const eventSchema = {
  type: "object",
  properties: {
    events: {
      type: "array",
      description: "解析出的事件列表",
      items: {
        type: "object",
        properties: {
          // FullCalendar 必需字段
          id: {
            type: "string",
            description: "唯一标识符，格式: evt_timestamp_index"
          },
          title: {
            type: "string",
            description: "事件标题"
          },
          start: {
            type: "string",
            description: "ISO 8601 格式的开始时间，必须包含时区",
            pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}[+-]\\d{2}:\\d{2}$"
          },
          end: {
            type: "string",
            description: "ISO 8601 格式的结束时间，必须包含时区",
            pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}[+-]\\d{2}:\\d{2}$"
          },
          allDay: {
            type: "boolean",
            description: "是否全天事件"
          },
          
          // FullCalendar 可选字段
          description: {
            type: ["string", "null"],
            description: "详细描述"
          },
          location: {
            type: ["string", "null"],
            description: "地点"
          },
          backgroundColor: {
            type: ["string", "null"],
            description: "背景颜色，十六进制格式，如 #3788d8"
          },
          borderColor: {
            type: ["string", "null"],
            description: "边框颜色，十六进制格式"
          },
          textColor: {
            type: ["string", "null"],
            description: "文字颜色，十六进制格式"
          },
          
          // 扩展属性（存储在 extendedProps 中）
          extendedProps: {
            type: ["object", "null"],
            properties: {
              description: {
                type: ["string", "null"],
                description: "详细描述（与顶层 description 相同）"
              },
              location: {
                type: ["string", "null"],
                description: "地点（与顶层 location 相同）"
              },
              category: {
                type: ["string", "null"],
                enum: ["work", "personal", "health", "other"],
                description: "事件分类"
              },
              timezone: {
                type: ["string", "null"],
                description: "IANA 时区标识符，如 Asia/Shanghai"
              },
              priority: {
                type: ["string", "null"],
                description: "优先级：high, medium, low"
              }
            },
            // OpenAI Structured Outputs 要求：required 必须包含 properties 中的所有键
            // 对于可选字段，我们使用 type: ["string", "null"] 来允许 null 值
            required: ["description", "location", "category", "timezone", "priority"],
            additionalProperties: false
          },
          
          // 重复事件支持
          recurrence: {
            type: ["object", "null"],
            properties: {
              freq: {
                type: "string",
                enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
                description: "重复频率"
              },
              interval: {
                type: ["integer", "null"],
                minimum: 1,
                description: "重复间隔，如每2周则 interval=2"
              },
              byDay: {
                type: ["array", "null"],
                items: {
                  type: "string",
                  enum: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
                },
                description: "指定星期几重复，如 ['MO', 'WE', 'FR']"
              },
              until: {
                type: ["string", "null"],
                description: "ISO 8601 格式的结束日期"
              },
              count: {
                type: ["integer", "null"],
                minimum: 1,
                description: "重复次数"
              }
            },
            // OpenAI Structured Outputs 要求：required 必须包含 properties 中的所有键
            // 对于可选字段，我们使用 type: ["type", "null"] 来允许 null 值
            required: ["freq", "interval", "byDay", "until", "count"],
            additionalProperties: false
          },
          
          // 元数据（用于调试和验证）
          metadata: {
            type: "object",
            properties: {
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "置信度，0-1之间的浮点数"
              },
              sourceText: {
                type: "string",
                description: "原始输入片段"
              },
              inferredFields: {
                type: "array",
                items: { type: "string" },
                description: "推断出的字段列表，如 ['end', 'location', 'category']"
              }
            },
            required: ["confidence", "sourceText", "inferredFields"],
            additionalProperties: false
          }
        },
        // OpenAI Structured Outputs 要求：required 必须包含 properties 中的所有键
        // 对于可选字段，我们使用 type: ["type", "null"] 来允许 null 值
        required: [
          "id", 
          "title", 
          "start", 
          "end", 
          "allDay", 
          "description",
          "location",
          "backgroundColor",
          "borderColor",
          "textColor",
          "extendedProps",
          "recurrence",
          "metadata"
        ],
        additionalProperties: false
      }
    }
  },
  required: ["events"],
  additionalProperties: false
};

module.exports = eventSchema;

