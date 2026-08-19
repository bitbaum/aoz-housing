declare module 'marked' {
  export class Marked {
    constructor(options?: unknown)
    parse(markdown: string, options?: unknown): string
  }
}
