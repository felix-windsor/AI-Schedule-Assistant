"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border/30 glass">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>

            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">AI 日程助手</h1>
              <p className="text-sm text-muted-foreground">用自然语言创建日程，智能解析并添加到日历</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="w-2 h-2 rounded-full bg-emerald-500"
            />
            <span className="text-xs text-muted-foreground">API 已连接</span>
          </div>
        </motion.div>
      </div>
    </header>
  )
}
