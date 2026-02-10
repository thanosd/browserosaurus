import { hostMatchesPattern, parseDomains } from './match-domain.js'

describe('parseDomains', () => {
  it('parses domain entries, ignoring comments and blank lines', () => {
    const content = `
# This is a comment
github.com

*.google.com
  # indented comment
stackoverflow.com
`

    expect(parseDomains(content)).toStrictEqual([
      'github.com',
      '*.google.com',
      'stackoverflow.com',
    ])
  })

  it('returns empty array for empty content', () => {
    expect(parseDomains('')).toStrictEqual([])
  })

  it('returns empty array for only comments', () => {
    expect(parseDomains('# comment\n# another')).toStrictEqual([])
  })
})

describe('hostMatchesPattern', () => {
  it('exact domain match', () => {
    expect(hostMatchesPattern('github.com', 'github.com')).toBe(true)
  })

  it('exact domain match is case-insensitive', () => {
    expect(hostMatchesPattern('GitHub.COM', 'github.com')).toBe(true)
    expect(hostMatchesPattern('github.com', 'GitHub.COM')).toBe(true)
  })

  it('exact domain does not match subdomain', () => {
    expect(hostMatchesPattern('sub.github.com', 'github.com')).toBe(false)
  })

  it('wildcard matches subdomain', () => {
    expect(hostMatchesPattern('mail.google.com', '*.google.com')).toBe(true)
  })

  it('wildcard matches deeply nested subdomain', () => {
    expect(hostMatchesPattern('a.b.c.google.com', '*.google.com')).toBe(true)
  })

  it('wildcard does not match bare domain', () => {
    expect(hostMatchesPattern('google.com', '*.google.com')).toBe(false)
  })

  it('wildcard is case-insensitive', () => {
    expect(hostMatchesPattern('Mail.Google.COM', '*.google.com')).toBe(true)
  })

  it('non-matching domain returns false', () => {
    expect(hostMatchesPattern('example.com', 'github.com')).toBe(false)
  })

  it('partial domain name does not match', () => {
    expect(hostMatchesPattern('notgithub.com', 'github.com')).toBe(false)
  })
})
