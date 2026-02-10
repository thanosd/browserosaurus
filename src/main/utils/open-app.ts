import { execFile } from 'node:child_process'

import type { AppName } from '../../config/apps.js'
import { apps } from '../../config/apps.js'

export function openApp(
  appName: AppName,
  url: string,
  isAlt: boolean,
  isShift: boolean,
  profileDirectory?: string,
): void {
  const selectedApp = apps[appName]

  const convertedUrl =
    'convertUrl' in selectedApp ? selectedApp.convertUrl(url) : url

  const profileArgs: string[] =
    profileDirectory && 'profileArg' in selectedApp && selectedApp.profileArg
      ? ['--new', '--args', `${selectedApp.profileArg}=${profileDirectory}`]
      : []

  const openArguments: string[] = [
    '-a',
    appName,
    isAlt ? '--background' : [],
    // Profile args come first so they're passed to the app
    ...profileArgs,
    isShift && 'privateArg' in selectedApp && !profileDirectory
      ? ['--new', '--args', selectedApp.privateArg]
      : [],
    // In order for private/incognito mode to work the URL needs to be passed
    // in last, _after_ the respective app.privateArg flag
    convertedUrl,
  ]
    .filter(Boolean)
    .flat()

  execFile('open', openArguments)
}

