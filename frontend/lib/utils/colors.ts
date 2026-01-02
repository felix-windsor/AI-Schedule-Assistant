export function getCategoryColor(category: string | null): string {
  const colors: Record<string, string> = {
    work: "#3788d8",
    personal: "#28a745",
    health: "#ffc107",
    other: "#6c757d",
  }
  return colors[category || "other"] || colors.other
}

export function getCategoryLabel(category: string | null): string {
  const labels: Record<string, string> = {
    work: "工作",
    personal: "个人",
    health: "健康",
    other: "其他",
  }
  return labels[category || "other"] || labels.other
}
