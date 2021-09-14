/** @type {import('@types/jest')} */
/** @type {import('webdriverio').remote} */

import { AppiumFSDriver } from '../driver'

import { remote } from 'webdriverio'

// TODO for now we assume a running Appium server with our driver linked in, but to make this
// a real robust test suite, we'd want to dynamically run an Appium 2.0 server instead of relying
// on an external one
const APPIUM_HOST = 'localhost'
const APPIUM_PORT = 4723

test('driver export exists', () => {
  expect(AppiumFSDriver).toBeDefined()
})

describe('E2E', () => {
  const capabilities = {
    platformName: 'Mac',
    'appium:automationName': 'FS',
  }
  const params = {
    connectionRetryCount: 0,
    hostname: APPIUM_HOST,
    port: APPIUM_PORT,
    path: '/',
    capabilities
  }

  let driver = null

  beforeAll(async () => {
    driver = await remote(params)
  })

  test('do something', () => {
  })

  afterAll(async () => {
    if (driver) {
      await driver.deleteSession()
    }
  })
})
