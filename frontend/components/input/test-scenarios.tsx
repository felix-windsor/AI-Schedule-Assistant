"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Beaker } from "lucide-react"

const scenarios = [
  { label: "简单事件", text: "明天下午3点和老板开会", icon: "📅" },
  { label: "多个事件", text: "后天上午10点项目评审，下午2点客户会议", icon: "📊" },
  { label: "全天事件", text: "下周一全天团建", icon: "🎉" },
  { label: "重复事件", text: "每周三早上9点站会15分钟", icon: "🔄" },
  { label: "复杂场景", text: "明天下午3点开会1小时，晚上7点健身，9点和朋友吃饭", icon: "⚡" },
]

export function TestScenarios() {
  const handleScenarioClick = (text: string) => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    if (textarea) {
      textarea.value = text
      textarea.dispatchEvent(new Event("input", { bubbles: true }))
      textarea.focus()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-strong rounded-2xl overflow-hidden"
    >
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Beaker className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">测试场景</h3>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {scenarios.map((scenario, index) => (
          <motion.div
            key={scenario.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-3 px-3 text-left hover:bg-secondary/50 transition-all group relative overflow-hidden rounded-lg border border-transparent hover:border-primary/20"
              onClick={() => handleScenarioClick(scenario.text)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-start gap-3 w-full">
                <span className="text-lg">{scenario.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-foreground mb-1">{scenario.label}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{scenario.text}</div>
                </div>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
