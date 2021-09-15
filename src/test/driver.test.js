/** @type {import('@types/jest')} */
/** @type {import('webdriverio').remote} */

import path from 'path'
import { AppiumFSDriver } from '../driver'
import { remote } from 'webdriverio'
import { fs } from '@appium/support'

// TODO for now we assume a running Appium server with our driver linked in, but to make this
// a real robust test suite, we'd want to dynamically run an Appium 2.0 server instead of relying
// on an external one. We also assume the chroot driver arg as represented here, i.e., with:
// appium --driver-args='{"fs": {"chroot": "<CHROOT_DIR>"}}'
const APPIUM_HOST = 'localhost'
const APPIUM_PORT = 4723
const BASE_DIR = path.resolve(__dirname, '..')
const CHROOT_DIR = path.resolve(__dirname, '..', '..')
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
const SANDBOX = path.resolve(__dirname, '..', 'sandbox')

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

  test('must use a basedir within the appropriate chroot', async () => {
    const badPaths = [
      path.resolve(CHROOT_DIR, '..'),
      path.resolve(CHROOT_DIR, '..', 'foo'),
      '/',
      '/foo',
    ]
    for (const badPath of badPaths) {
      const capabilities = {
        platformName: 'Mac',
        'appium:automationName': 'FS',
        'appium:baseDir': badPath
      }
      let err
      try {
        await remote({...WDIO_PARAMS, capabilities})
      } catch (e) {
        err = e
      }
      expect(err.message).toMatch(/chroot/)
    }
  })
})

describe('E2E - commands', () => {
  let driver = null

  beforeAll(async () => {
    // create a file sandbox within 'build'
    await fs.rimraf(SANDBOX)
    await fs.mkdir(SANDBOX)
    driver = await remote({...WDIO_PARAMS, capabilities: DEFAULT_CAPS})
  })

  test('should get directory listing as page source', async () => {
    expect(await driver.getPageSource()).toContain(__filename)
  })

  test('should be able to find a file as element', async () => {
    const el = await driver.$('//file[contains(@path, "build/driver.js")]')
    expect(el.error).toBeUndefined()
  })

  test('should not be able to use a non-xpath locator strategy', async () => {
    let err
    try {
      await driver.$('#foo')
    } catch (e) {
      err = e
    }
    expect(err.message).toMatch(/not supported/)
  })

  test('should not be able to find an element which does not exist', async () => {
    const el = await driver.$('//file[contains(@path, "doesnotexist")]')
    expect(el.error).toBeDefined()
  })

  test('should be able to find multiple elements', async () => {
    const els = await driver.$$('//file')
    expect(els.length).toBeGreaterThan(1)
  })

  test('should be able to get file contents from element get text', async () => {
    const el = await driver.$('//file[contains(@path, "driver.test.js")]')
    expect(await el.getText()).toContain('should be able to get file contents')
  })

  test('should throw a stale element error if file does not exist', async () => {
    const staleFile = path.resolve(SANDBOX, 'stale.txt')
    await fs.writeFile(staleFile, 'this file will go away')
    const el = await driver.$('//file[contains(@path, "stale.txt")]')
    await fs.unlink(staleFile)
    let err
    try {
      await el.getText()
    } catch (e) {
      err = e
    }
    expect(err.message).toContain('stale')
  })

  test('should use add value to append to a files text', async () => {
    const testFile = path.resolve(SANDBOX, 'sendkeys.txt')
    await fs.writeFile(testFile, '')
    const el = await driver.$('//file[contains(@path, "sendkeys.txt")]')
    await el.addValue('foo')
    expect(await fs.readFile(testFile, 'utf8')).toEqual('foo')
    await el.addValue('bar')
    expect(await fs.readFile(testFile, 'utf8')).toEqual('foobar')
  })

  test('should use clear to clear out the file contents', async () => {
    const testFile = path.resolve(SANDBOX, 'clear.txt')
    await fs.writeFile(testFile, 'hello!')
    const el = await driver.$('//file[contains(@path, "clear.txt")]')
    await el.clearValue()
    expect(await fs.readFile(testFile, 'utf8')).toEqual('')
  })

  test('should delete a file with fs: delete', async () => {
    const testFile = path.resolve(SANDBOX, 'delete.txt')
    await fs.writeFile(testFile, 'oh no not again')
    const el = await driver.$('//file[contains(@path, "delete.txt")]')
    await driver.execute('fs: delete', el.elementId)
    expect(await fs.exists(testFile)).toBeFalsy()
  })

  afterAll(async () => {
    if (driver) {
      await driver.deleteSession()
    }
  })
})
