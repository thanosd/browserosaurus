import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import log from 'electron-log'

import type { AppName } from '../../config/apps.js'
import { apps } from '../../config/apps.js'

export type ChromeProfile = {
  appName: AppName
  directory: string
  displayName: string
}

/**
 * Map of Chromium-based app names to their Application Support directory names.
 */
const chromiumAppSupportDirs: Partial<Record<AppName, string>> = {
  'Brave Browser': 'BraveSoftware/Brave-Browser',
  'Brave Browser Beta': 'BraveSoftware/Brave-Browser-Beta',
  'Brave Browser Nightly': 'BraveSoftware/Brave-Browser-Nightly',
  'Google Chrome': 'Google/Chrome',
  'Google Chrome Beta': 'Google/Chrome Beta',
  'Google Chrome Canary': 'Google/Chrome Canary',
  'Google Chrome Dev': 'Google/Chrome Dev',
}

/**
 * Read Chrome/Brave "Local State" JSON to discover profiles.
 * Returns an array of { appName, directory, displayName } for each profile found.
 * Returns an empty array if the file doesn't exist or can't be parsed.
 */
function getProfilesForApp(appName: AppName): ChromeProfile[] {
  const appSupportDir = chromiumAppSupportDirs[appName]

  if (!appSupportDir) {
    return []
  }

  const localStatePath = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    appSupportDir,
    'Local State',
  )

  try {
    const raw = fs.readFileSync(localStatePath)
    const localState = JSON.parse(raw) as {
      profile?: {
        info_cache?: Record<string, { name?: string }>
      }
    }

    const infoCache = localState?.profile?.info_cache

    if (!infoCache) {
      return []
    }

    return Object.entries(infoCache).map(([directory, info]) => ({
      appName,
      directory,
      displayName: info.name || directory,
    }))
  } catch (error: unknown) {
    log.warn(`Could not read profiles for ${appName}:`, error)
    return []
  }
}

/**
 * Detect profiles for all installed Chromium-based browsers that have a profileArg.
 * Only returns profiles for apps that are in the installedAppNames list.
 */
export function getChromeProfiles(
  installedAppNames: AppName[],
): ChromeProfile[] {
  const profiles: ChromeProfile[] = []

  for (const appName of installedAppNames) {
    const appConfig = apps[appName]

    if ('profileArg' in appConfig && chromiumAppSupportDirs[appName]) {
      const appProfiles = getProfilesForApp(appName)

      // Only create profile entries if there are multiple profiles.
      // A single profile (Default) doesn't need special handling.
      if (appProfiles.length > 1) {
        profiles.push(...appProfiles)
      }
    }
  }

  return profiles
}
