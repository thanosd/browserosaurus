import { readFileSync } from 'node:fs'
import path from 'node:path'

import { app } from 'electron'

/**
 * Check if a hostname matches a domain pattern.
 * Supports exact matches and wildcard patterns like `*.example.com`.
 */
export function hostMatchesPattern(
  hostname: string,
  pattern: string,
): boolean {
  const h = hostname.toLowerCase()
  const p = pattern.toLowerCase()

  if (p.startsWith('*.')) {
    // ".example.com"
    const suffix = p.slice(1)
    // Must be a subdomain, not the bare domain itself
    return h.endsWith(suffix) && h.length > suffix.length
  }

  return h === p
}

/**
 * Parse a domains file into a list of domain patterns.
 * Ignores blank lines and lines starting with #.
 */
export function parseDomains(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
}

/**
 * Read the domains.txt file from the config directory.
 * Returns an empty array if the file cannot be read.
 */
export function readDomainList(): string[] {
  try {
    const domainsPath = path.join(
      app.getAppPath(),
      'src',
      'config',
      'domains.txt',
    )
    const content = readFileSync(domainsPath, 'utf8')
    return parseDomains(content)
  } catch {
    return []
  }
}

/**
 * Check if a URL's host matches any domain in the domain list.
 * Returns true if the domain list is empty (show picker for all URLs).
 */
export function isUrlMatchingDomainList(url: string): boolean {
  const domains = readDomainList()

  // Empty list = show picker for everything (default behavior)
  if (domains.length === 0) {
    return true
  }

  try {
    const { hostname } = new URL(url)
    return domains.some((pattern) => hostMatchesPattern(hostname, pattern))
  } catch {
    // Invalid URL — show the picker to let the user decide
    return true
  }
}
