export type TextTool = 'format-json' | 'strip-whitespace' | 'dedupe-lines' | 'format-csv'

export function applyTextTool(tool: TextTool, input: string): string {
  switch (tool) {
    case 'format-json': {
      try {
        return JSON.stringify(JSON.parse(input), null, 2)
      } catch {
        return input
      }
    }
    case 'strip-whitespace': return input.split('\n').map((line) => line.trim()).filter(Boolean).join('\n')
    case 'dedupe-lines': return [...new Set(input.split('\n'))].join('\n')
    case 'format-csv': return input.split('\n').map((line) => line.split(',').map((cell) => cell.trim()).join(', ')).join('\n')
  }
}
