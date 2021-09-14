/** @type {import('@types/jest')} */
/** @type {import('webdriverio').remote} */

import path from 'path'
import { AppiumFSDriver } from '../driver'
import { remote } from 'webdriverio'

// TODO for now we assume a running Appium server with our driver linked in, but to make this
// a real robust test suite, we'd want to dynamically run an Appium 2.0 server instead of relying
// on an external one
const APPIUM_HOST = 'localhost'
const APPIUM_PORT = 4723
const BASE_DIR = path.resolve(__dirname, '..')
const WDIO_PARAMS = {
  connectionRetryCount: 0,
  hostname: APPIUM_HOST,
  port: APPIUM_PORT,
  path: '/',
  logLevel: 'silent',
}
const DEFAULT_CAPS = {
  platformName: 'Mac',
  'appium:automationName': 'FS',
  'appium:baseDir': BASE_DIR,
}

test('driver export exists', () => {
  expect(AppiumFSDriver).toBeDefined()
})

describe('E2E - session start', () => {
  test('should not start a session without baseDir cap', async () => {
    const capabilities = {
      platformName: 'Mac',
      'appium:automationName': 'FS',
    }
    let err
    try {
      await remote({...WDIO_PARAMS, capabilities})
    } catch (e) {
      err = e
    }
    expect(err.message).toMatch(/baseDir/)
  })
})

describe('E2E - commands', () => {
  let driver = null

  beforeAll(async () => {
    driver = await remote({...WDIO_PARAMS, capabilities: DEFAULT_CAPS})
  })

  test('should get directory listing as page source', async () => {
    expect(await driver.getPageSource()).toContain(__filename)
  })

  afterAll(async () => {
    if (driver) {
      await driver.deleteSession()
    }
  })
})
