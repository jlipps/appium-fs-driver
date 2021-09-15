# appium-fs-driver

Demo filesystem driver for Appium (not for real use). No, I'm serious, this is only a toy for learning purposes and is basically a backdoor to your file system, so don't ever run it for real. The primary context for its development was for use in a live coding workshop meant to teach how to build drivers for Appium 2.x.

## Build a driver workshop

To see how this driver was built in stages, you can compare the diff between each branch that was created during development:

* [Stage 1](https://github.com/jlipps/appium-fs-driver/compare/workshop/0/start...workshop/1/init): Scaffold the project with all the appropriate tools
* [Stage 2](https://github.com/jlipps/appium-fs-driver/compare/workshop/1/init...workshop/2/empty-driver): Get an empty Appium 2.x compatible driver building and running
* [Stage 3](https://github.com/jlipps/appium-fs-driver/compare/workshop/2/empty-driver...workshop/3/page-source): Implement the getPageSource command
* [Stage 4](https://github.com/jlipps/appium-fs-driver/compare/workshop/3/page-source...workshop/4/find-elements): Implement the element finding commands
* [Stage 5](https://github.com/jlipps/appium-fs-driver/compare/workshop/4/find-elements...workshop/5/get-text): Implement the getText command for file elements
* [Stage 6](https://github.com/jlipps/appium-fs-driver/compare/workshop/5/get-text...workshop/6/send-and-clear): Implement set and clear methods for elements
* [Stage 7](https://github.com/jlipps/appium-fs-driver/compare/workshop/6/send-and-clear...workshop/7/execute): Implement a custom 'executeScript override' method for deleting files
* [Stage 8](https://github.com/jlipps/appium-fs-driver/compare/workshop/7/execute...workshop/8/chroot): Require the use of a CLI argument to 'chroot' the use of this driver

And then of course you can diff that against `main` to see if any development has happened since!
