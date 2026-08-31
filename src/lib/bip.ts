/**
 * Building in Public — second studio consumer of npm `bip-kit`.
 *
 * AOZ keeps `marked` for HTML rendering (repo-linked posts). bip-kit is the
 * SSOT for block parsing / video allowlist / roadmap·changelog types.
 * @see docs/building-in-public.md
 * @see https://github.com/bitbaum/bip-kit
 */
export {
  parseContentBlocks,
  parseFrontmatter,
  parseVideoEmbed,
  videoEmbedSrc,
  type ContentBlock,
  type ChangelogEntry,
  type RoadmapDoc,
} from 'bip-kit'
