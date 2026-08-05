import { applyTextTool, type TextTool } from '../utils/textTools'

self.onmessage = (event: MessageEvent<{ id: string; tool: TextTool; input: string }>) => {
  try {
    self.postMessage({ id: event.data.id, output: applyTextTool(event.data.tool, event.data.input) })
  } catch (error) {
    self.postMessage({ id: event.data.id, error: error instanceof Error ? error.message : 'Unable to process text' })
  }
}
