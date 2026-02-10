import { createReducer } from '@reduxjs/toolkit'

import type { AppName } from '../../config/apps.js'
import {
  changedPickerWindowBounds,
  readiedApp,
  receivedRendererStartupSignal,
  retrievedChromeProfiles,
  retrievedInstalledApps,
} from '../../main/state/actions.js'
import {
  clickedDonate,
  clickedMaybeLater,
} from '../../renderers/picker/state/actions.js'
import {
  confirmedReset,
  reorderedApp,
  updatedHotCode,
} from '../../renderers/prefs/state/actions.js'

type Storage = {
  apps: {
    name: AppName
    hotCode: string | null
    isInstalled: boolean
    profileDirectory?: string
    profileDisplayName?: string
  }[]
  supportMessage: number
  isSetup: boolean
  height: number
}

const defaultStorage: Storage = {
  apps: [],
  height: 450,
  isSetup: false,
  supportMessage: 0,
}

const storage = createReducer<Storage>(defaultStorage, (builder) =>
  builder
    .addCase(readiedApp, (state) => {
      state.isSetup = true
    })

    .addCase(confirmedReset, () => defaultStorage)

    .addCase(
      receivedRendererStartupSignal,
      (_, action) => action.payload.storage,
    )

    .addCase(retrievedInstalledApps, (state, action) => {
      const installedAppNames = action.payload

      for (const storedApp of state.apps) {
        // Only update isInstalled for non-profile entries
        if (!storedApp.profileDirectory) {
          storedApp.isInstalled = installedAppNames.includes(storedApp.name)
        }
      }

      for (const installedAppName of installedAppNames) {
        const installedAppInStorage = state.apps.some(
          ({ name, profileDirectory }) =>
            name === installedAppName && !profileDirectory,
        )

        if (!installedAppInStorage) {
          state.apps.push({
            hotCode: null,
            isInstalled: true,
            name: installedAppName,
          })
        }
      }
    })

    .addCase(retrievedChromeProfiles, (state, action) => {
      const profiles = action.payload

      // Mark existing profile entries as not installed (will be re-enabled below)
      for (const storedApp of state.apps) {
        if (storedApp.profileDirectory) {
          storedApp.isInstalled = false
        }
      }

      for (const profile of profiles) {
        const existingEntry = state.apps.find(
          (a) =>
            a.name === profile.appName &&
            a.profileDirectory === profile.directory,
        )

        if (existingEntry) {
          existingEntry.isInstalled = true
          existingEntry.profileDisplayName = profile.displayName
        } else {
          state.apps.push({
            hotCode: null,
            isInstalled: true,
            name: profile.appName,
            profileDirectory: profile.directory,
            profileDisplayName: profile.displayName,
          })
        }
      }
    })

    .addCase(updatedHotCode, (state, action) => {
      const hotCode = action.payload.value

      const appWithSameHotCodeIndex = state.apps.findIndex(
        (app) => app.hotCode === hotCode,
      )

      if (appWithSameHotCodeIndex !== -1) {
        state.apps[appWithSameHotCodeIndex].hotCode = null
      }

      const appIndex = state.apps.findIndex(
        (app) =>
          app.name === action.payload.appName &&
          app.profileDirectory === action.payload.profileDirectory,
      )

      state.apps[appIndex].hotCode = hotCode
    })

    .addCase(clickedDonate, (state) => {
      state.supportMessage = -1
    })

    .addCase(clickedMaybeLater, (state) => {
      state.supportMessage = Date.now()
    })

    .addCase(changedPickerWindowBounds, (state, action) => {
      state.height = action.payload.height
    })

    .addCase(reorderedApp, (state, action) => {
      const sourceIndex = state.apps.findIndex(
        (app) =>
          app.name === action.payload.sourceName &&
          app.profileDirectory === action.payload.sourceProfileDirectory,
      )

      const destinationIndex = state.apps.findIndex(
        (app) =>
          app.name === action.payload.destinationName &&
          app.profileDirectory === action.payload.destinationProfileDirectory,
      )

      const [removed] = state.apps.splice(sourceIndex, 1)
      state.apps.splice(destinationIndex, 0, removed)
    }),
)

export { defaultStorage, Storage, storage }
