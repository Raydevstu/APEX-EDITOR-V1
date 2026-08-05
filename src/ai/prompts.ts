import type { AiRewriteMode, AiSummarizeMode } from './types'

const REWRITE_INSTRUCTIONS: Record<AiRewriteMode, string> = {
  grammar:
    'Fix grammar, spelling, and punctuation. Preserve the original meaning, structure, and markdown formatting. Do not add commentary.',
  clearer:
    'Rewrite for clarity and flow. Keep the same meaning and approximate length. Preserve markdown structure. Do not add commentary.',
  shorter:
    'Make the text shorter and tighter without losing essential meaning. Preserve markdown structure. Do not add commentary.',
  professional:
    'Rewrite in a clear professional tone. Preserve meaning and markdown structure. Do not add commentary.',
}

const SUMMARIZE_INSTRUCTIONS: Record<AiSummarizeMode, string> = {
  summary: 'Write a concise summary of the note in a few short paragraphs or bullets. Use markdown.',
  'key-points': 'Extract the key points as a markdown bullet list. Be faithful to the source; do not invent facts.',
  'action-items':
    'Extract action items / next steps as a markdown checklist (- [ ] item). If none are present, say so briefly.',
}

export function rewriteSystemPrompt(mode: AiRewriteMode): string {
  return [
    'You are ApexPad rewrite assistant for a local notepad.',
    REWRITE_INSTRUCTIONS[mode],
    'Return ONLY the rewritten text — no quotes, no preamble, no explanation.',
  ].join(' ')
}

export function summarizeSystemPrompt(mode: AiSummarizeMode): string {
  return [
    'You are ApexPad summarize assistant for a local notepad.',
    SUMMARIZE_INSTRUCTIONS[mode],
    'Return ONLY the markdown result — no preamble.',
  ].join(' ')
}

export function askNotesSystemPrompt(): string {
  return [
    'You answer questions using ONLY the provided note excerpts from the user\'s local ApexPad notes.',
    'If the excerpts are insufficient, say what is missing instead of inventing facts.',
    'Be concise. When you use a note, mention its title in brackets like [Note title].',
    'Do not claim access to notes that were not provided.',
  ].join(' ')
}

export function buildAskUserPrompt(question: string, packedContext: string): string {
  return [
    'Question:',
    question.trim(),
    '',
    'Note excerpts:',
    packedContext.trim() || '(no matching notes)',
  ].join('\n')
}
