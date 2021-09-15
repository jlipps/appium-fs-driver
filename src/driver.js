import path from 'path'
import { fs, util } from '@appium/support'
import { BaseDriver, errors } from '@appium/base-driver'
import { W3C_ELEMENT_KEY } from '@appium/base-driver/build/lib/constants'
import xpath from 'xpath'
import { DOMParser } from 'xmldom'
import log from './logger'

class AppiumFSDriver extends BaseDriver {

  locatorStrategies = ['xpath']
  elementCache = {}
  desiredCapConstraints = {baseDir: {presence: true, isString: true}}

  static get argsConstraints() {
    return {chroot: {presence: true, isString: true}}
  }

  async createSession(...args) {
    const res = await super.createSession(...args)
    this.validateBaseDir()
    return res
  }

  validateBaseDir() {
    if (!this.cliArgs?.chroot) {
      throw new Error('The "chroot" driver arg must be set for security purposes')
    }
    log.info(`Checking whether baseDir '${this.opts.baseDir}' is in chroot '${this.cliArgs.chroot}'`)
    const chrootParts = this.cliArgs.chroot.split(path.sep)
    const baseDirParts = this.opts.baseDir.split(path.sep)
    const errMsg = `The baseDir cap must represent a path within the driver chroot. ` +
                   `Your baseDir '${this.opts.baseDir}' was not inside '${this.cliArgs.chroot}'`
    if (baseDirParts.length < chrootParts.length) {
      throw new Error(errMsg)
    }
    for (let i = 0; i < baseDirParts.length; i++) {
      if (chrootParts[i] && chrootParts[i] !== baseDirParts[i]) {
        throw new Error(errMsg)
      }
    }
  }

  async getPageSource() {
    // TODO return an actual directory hierarchy instead of a flat list
    const files = await fs.glob(path.resolve(this.opts.baseDir, '**', '*'))
    const fileNodes = files.map((filePath) => `\t<file path="${filePath}" />`)
    return `<files>\n${fileNodes.join('\n')}</files>`
  }

  async findElOrEls(strategy, selector, multiple, context) {
    if (context) {
      // TODO could probably support finding elements from within directories
      throw new errors.NotYetImplementedError('Finding an element from another element not supported')
    }

    log.info(`Running XPath query '${selector}' against the current source`)
    const source = await this.getPageSource()
    const xmlDom = new DOMParser().parseFromString(source)
    const nodes = xpath.select(selector, xmlDom)

    if (multiple) {
      return nodes.map(this._xmlNodeToElement.bind(this))
    }

    if (nodes.length < 1) {
      throw new errors.NoSuchElementError()
    }

    return this._xmlNodeToElement(nodes[0])
  }

  _xmlNodeToElement(node) {
    let filePath = null;
    for (const attribute of Object.values(node.attributes)) {
      if (attribute.name === 'path') {
        filePath = attribute.value
        break
      }
    }
    if (!filePath) {
      throw new Error(`Found element had no path attribute`)
    }
    const elementId = util.uuidV4()
    this.elementCache[elementId] = filePath
    return {[W3C_ELEMENT_KEY]: elementId}
  }

  async fileFromElement(elementId) {
    const filePath = this.elementCache[elementId]

    if (!filePath) {
      throw new errors.NoSuchElementError()
    }

    if (!await fs.exists(filePath)) {
      throw new errors.StaleElementReferenceError()
    }

    return filePath
  }

  async getText(elementId) {
    const filePath = await this.fileFromElement(elementId)
    return await fs.readFile(filePath, 'utf8')
  }

  async setValue(text, elementId) {
    const filePath = await this.fileFromElement(elementId)
    return await fs.appendFile(filePath, text)
  }

  async clear(elementId) {
    const filePath = await this.fileFromElement(elementId)
    return await fs.writeFile(filePath, '')
  }

  async execute(script, args) {
    if (script === 'fs: delete') {
      const filePath = await this.fileFromElement(args[0])
      return await fs.unlink(filePath)
    }

    throw new Error(`Don't know how to run script '${script}'`)
  }

}

export { AppiumFSDriver }
export default AppiumFSDriver
