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
  desiredCapConstraints = {baseDir: {presence: true}}

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

  async getText(elementId) {
    const filePath = this.elementCache[elementId]

    if (!filePath) {
      throw new errors.NoSuchElementError()
    }

    if (!await fs.exists(filePath)) {
      throw new errors.StaleElementReferenceError()
    }

    return await fs.readFile(filePath, 'utf8')
  }

}

export { AppiumFSDriver }
export default AppiumFSDriver
