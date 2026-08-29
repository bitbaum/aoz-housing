import { readFileSync } from 'fs'
import { join } from 'path'

export interface StaticDoc {
  title: string
  body: string
}

function readDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

function parseDoc(markdown: string): StaticDoc {
  const lines = markdown.split('\n')
  const titleIndex = lines.findIndex((line) => line.startsWith('# '))
  if (titleIndex === -1) {
    throw new Error('Static doc is missing a top-level heading.')
  }

  return {
    title: lines[titleIndex].slice(2).trim(),
    body: lines
      .slice(titleIndex + 1)
      .join('\n')
      .trim(),
  }
}

export function getRoadmapDoc(): StaticDoc {
  return parseDoc(readDoc('docs/ROADMAP.md'))
}

export function getChangelogDoc(): StaticDoc {
  return parseDoc(readDoc('CHANGELOG.md'))
}
