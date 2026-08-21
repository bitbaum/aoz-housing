/**
 * Second-consumer dogfood: AOZ imports npm `bip-kit`.
 */
import { parseContentBlocks, parseVideoEmbed } from '@/lib/bip'

describe('bip-kit (AOZ consumer)', () => {
  it('parses a GFM table into a typed block', () => {
    const blocks = parseContentBlocks('| A | B |\n| --- | --- |\n| 1 | 2 |\n')
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toMatchObject({
      type: 'table',
      headers: ['A', 'B'],
      rows: [['1', '2']],
    })
  })

  it('allowlists youtube embeds and rejects strangers', () => {
    expect(parseVideoEmbed('https://youtu.be/abcdefghijk')?.provider).toBe('youtube')
    expect(parseVideoEmbed('https://evil.example/x')).toBeNull()
  })
})
