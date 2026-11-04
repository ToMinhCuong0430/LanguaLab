import type { RoadmapNode, TypingTopic } from '~/composables/useTypingPractice'

// Cấp độ chủ đề là một khoảng ("A2 - B1", "HSK 2 - 3", "N5 - N4"): tách thành các mốc để so với chặng
export const levelTokens = (level: string) => {
  const parts = level.split(/\s*[-–]\s*/).map((p) => p.trim().toUpperCase()).filter(Boolean)
  const prefix = parts[0]?.match(/^([A-Z]+)\s+\d/)?.[1]
  return parts.map((p) => (prefix && /^\d+$/.test(p) ? `${prefix} ${p}` : p))
}

export interface PathUnit {
  node: RoadmapNode | null // null = chủ đề không khớp chặng nào
  topics: TypingTopic[]
}

// Gộp chủ đề thành unit theo chặng thấp nhất mà khoảng cấp độ của chủ đề chạm tới; chủ đề lạc vào unit cuối
export const buildPathUnits = (nodes: RoadmapNode[], topics: TypingTopic[]): PathUnit[] => {
  const list: PathUnit[] = nodes.map((node) => ({ node, topics: [] }))
  const others: TypingTopic[] = []
  for (const topic of topics) {
    const tokens = levelTokens(topic.level || '')
    const idx = nodes.findIndex((n) => tokens.includes(n.level.toUpperCase()))
    if (idx >= 0) list[idx]!.topics.push(topic)
    else others.push(topic)
  }
  if (others.length) list.push({ node: null, topics: others })
  return list
}

// Chủ đề đầu tiên trên đường đi (mục đầu của lộ trình)
export const firstPathTopic = (units: PathUnit[]) => units.find((u) => u.topics.length)?.topics[0] ?? null
