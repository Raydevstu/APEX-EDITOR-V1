import type { TextTool } from './textTools'

const worker = new Worker(new URL('../workers/processor.worker.ts', import.meta.url), { type: 'module' })

export function processText(tool: TextTool, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    const onMessage = (event: MessageEvent<{ id: string; output?: string; error?: string }>) => {
      if (event.data.id !== id) return
      worker.removeEventListener('message', onMessage)
      if (event.data.error) reject(new Error(event.data.error))
      else resolve(event.data.output ?? '')
    }
    worker.addEventListener('message', onMessage)
    worker.postMessage({ id, tool, input })
  })
}
