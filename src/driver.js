import path from 'path'
import { fs } from '@appium/support'
import { BaseDriver } from '@appium/base-driver'

class AppiumFSDriver extends BaseDriver {

  desiredCapConstraints = {baseDir: {presence: true}}

  async getPageSource() {
    // TODO return an actual directory hierarchy instead of a flat list
    const files = await fs.glob(path.resolve(this.opts.baseDir, '**', '*'))
    const fileNodes = files.map((filePath) => `\t<file path="${filePath}" />`)
    return `<files>\n${fileNodes.join('\n')}</files>`
  }
}

export { AppiumFSDriver }
export default AppiumFSDriver
