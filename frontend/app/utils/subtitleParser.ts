export interface ParsedSubtitle {
  id: string
  start: number // Giây
  end: number   // Giây
  text: string
  vi: string
}

/**
 * Chuyển chuỗi thời gian SRT/VTT (ví dụ 00:01:23,456 hoặc 01:23.456) thành số giây
 */
export const timeStringToSeconds = (timeStr: string): number => {
  const cleanStr = timeStr.trim().replace(',', '.')
  const parts = cleanStr.split(':')
  
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0
    const minutes = parseFloat(parts[1]) || 0
    const seconds = parseFloat(parts[2]) || 0
    return Math.round((hours * 3600 + minutes * 60 + seconds) * 10) / 10
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0
    const seconds = parseFloat(parts[1]) || 0
    return Math.round((minutes * 60 + seconds) * 10) / 10
  }
  
  return parseFloat(cleanStr) || 0
}

/**
 * Phân tích nội dung file hoặc chuỗi SRT thành danh sách phụ đề
 */
export const parseSRT = (content: string): ParsedSubtitle[] => {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  const blocks = normalized.split(/\n\s*\n/)
  const result: ParsedSubtitle[] = []

  blocks.forEach((block, index) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return

    // Dòng thời gian có dạng: 00:00:01,000 --> 00:00:04,000
    let timeLineIdx = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIdx = i
        break
      }
    }

    if (timeLineIdx === -1) return

    const timeParts = lines[timeLineIdx].split('-->')
    const start = timeStringToSeconds(timeParts[0])
    const end = timeStringToSeconds(timeParts[1])

    const textLines = lines.slice(timeLineIdx + 1)
    const combinedText = textLines.join(' ')

    // Nếu dòng có định dạng song ngữ phân cách bằng || hoặc // hoặc \n
    let targetText = combinedText
    let viText = ''
    if (combinedText.includes('||')) {
      const splitPair = combinedText.split('||')
      targetText = splitPair[0].trim()
      viText = splitPair[1]?.trim() || ''
    } else if (combinedText.includes('//')) {
      const splitPair = combinedText.split('//')
      targetText = splitPair[0].trim()
      viText = splitPair[1]?.trim() || ''
    }

    result.push({
      id: `sub-${index + 1}`,
      start,
      end: end > start ? end : start + 3,
      text: targetText,
      vi: viText,
    })
  })

  return result
}

/**
 * Phân tích nội dung VTT (WebVTT)
 */
export const parseVTT = (content: string): ParsedSubtitle[] => {
  // Loại bỏ header WEBVTT
  const cleaned = content.replace(/^WEBVTT[^\n]*\n+/i, '')
  return parseSRT(cleaned)
}

/**
 * Tự động nhận diện và parse SRT hoặc VTT
 */
export const parseSubtitles = (content: string): ParsedSubtitle[] => {
  if (content.trim().startsWith('WEBVTT')) {
    return parseVTT(content)
  }
  return parseSRT(content)
}

/**
 * Trích xuất YouTube Video ID từ nhiều định dạng URL khác nhau
 */
export const extractYouTubeId = (url: string): string | null => {
  if (!url) return null
  const trimmed = url.trim()

  // Trường hợp truyền thẳng ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  // Regex hỗ trợ: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/..., youtube.com/shorts/...
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = trimmed.match(regExp)
  return match && match[1] ? match[1] : null
}
