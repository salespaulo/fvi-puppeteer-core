'use strict'

const { debug, objects } = require('fvi-node-utils')

const clickWaitForMillis = 6000

const timeout = {
    timeout: 40000,
}

const clickDelay = {
    delay: 200,
}

const tabDelay = {
    delay: 3000,
}

const LOG_PREFIX = `[i-puppeteer-crawler]`

const doGoto = async (page, url) => {
    try {
        debug.here(`${LOG_PREFIX} [Do Go To][URL]:${url}`)

        page.goto(url)
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Do Go To][URL]:${url}[Error]:${err}`)
        throw err
    }
}

const doSelect = async (page, selector, values, waitForNavigation = false) => {
    if (!values || values.length == 0) {
        debug.here(`[Puppeteer Select without values]: ${selector}`)
        return
    }

    debug.here(`[Puppeteer Select]: ${selector}`)
    const element = await page.waitForSelector(selector, {
        visible: true,
        hidden: true,
        ...timeout,
    })

    const promises = [page.select(selector, values)]

    if (waitForNavigation) {
        debug.here(`[Puppeteer WaitForNavigation]: ${timeout}`)
        promises.push(page.waitForNavigation(timeout))
    }

    await Promise.all(promises)
    return element
}

const doTab = async (page, waitForNavigation = false, opts = tabDelay) => {
    debug.here('[Puppeteer Keyboard Press]: Key "Tab"')
    const promises = [page.keyboard.press('Tab', opts)]

    if (waitForNavigation) {
        debug.here(`[Puppeteer WaitForNavigation]: ${timeout}`)
        promises.push(page.waitForNavigation(timeout))
    }

    await Promise.all(promises)
}

const doClick = async (page, selector, waitForNavigation = false, opts = clickDelay) => {
    debug.here('[Puppeteer Click]: ' + selector)
    const element = await page.waitForSelector(selector, {
        visible: true,
        hidden: true,
        ...timeout,
    })

    if (!element) {
        debug.here('[Puppeteer Click]: ' + selector + ' not found!')
        throw new Error('Selector not found: ' + selector)
    }

    const promises = [element.click(opts)]

    if (waitForNavigation) {
        debug.here(`[Puppeteer WaitForNavigation]: ${timeout}`)
        promises.push(page.waitForNavigation(timeout))
    }

    await Promise.all(promises)

    return element
}

const doClickAndWait = async (page, selector, waitFor = clickWaitForMillis) => {
    const res = await doClick(page, selector)
    if (page.waitFor) await page.waitFor(waitFor)
    return res
}

const doClickAndWaitOpt = async (page, xpath, waitFor = clickWaitForMillis) => {
    try {
        const campo = await page.$x(xpath)
        const res = await campo[0].click()
        if (page.waitFor) await page.waitFor(waitFor)
        return res
    } catch (e) {
        debug.here('Error ignored, returning null; error=' + objects.inspect(e))
        return null
    }
}

const doType = async (page, value, opts = clickDelay) => {
    debug.here(`[Puppeteer Keyboard Type]: ${value}`)
    return await page.keyboard.type(value, opts)
}

const getElementCheckedValue = async (page, selector) => {
    debug.here(`[Puppeteer Element Checked Value]: ${selector}`)

    const value = await page.evaluate(sel => {
        const element = document.querySelector(sel)

        if (!element) {
            throw new Error('[Puppeteer Element Checked Value]: ' + sel + ' not found!')
        }
        return element.checked
    }, selector)

    debug.here(`[Puppeteer Element Checked Value]: ${value}`)
    return value
}

const getElementTextContent = async (page, selector) => {
    debug.here(`[Puppeteer Element Text Content]: ${selector}`)

    const content = await page.evaluate(sel => {
        const formatElementValue = value => {
            return value
                .replace(/\\n/g, '\\n')
                .replace(/\\'/g, "\\'")
                .replace(/\\"/g, '\\"')
                .replace(/\\&/g, '\\&')
                .replace(/\\r/g, '\\r')
                .replace(/\\t/g, '\\t')
                .replace(/\\b/g, '\\b')
                .replace(/\\f/g, '\\f')
                .trim()
        }

        const element = document.querySelector(sel)

        if (!element) {
            throw new Error('[Puppeteer Element Text Content]: ' + sel + ' not found!')
        }

        if (element.textContent && element.textContent.trim().length > 0) {
            return formatElementValue(element.textContent)
        }

        return 'null'
    }, selector)

    debug.here(`[Puppeteer Element Text Content]: ${content}`)
    return content
}

const getElementValue = async (page, selector) => {
    debug.here(`[Puppeteer Element Value]: ${selector}`)

    const value = await page.evaluate(sel => {
        const formatElementValue = value => {
            return value
                .replace(/\\n/g, '\\n')
                .replace(/\\'/g, "\\'")
                .replace(/\\"/g, '\\"')
                .replace(/\\&/g, '\\&')
                .replace(/\\r/g, '\\r')
                .replace(/\\t/g, '\\t')
                .replace(/\\b/g, '\\b')
                .replace(/\\f/g, '\\f')
        }

        const element = document.querySelector(sel)

        if (!element) {
            throw new Error('[Puppeteer Element Value]: ' + sel + ' not found!')
        }

        if (element.value && element.value.trim().length > 0) {
            return formatElementValue(element.value)
        }

        return 'null'
    }, selector)

    debug.here(`[Puppeteer Element Value]: ${value}`)
    return value
}

const catchDialog = async (browser, page) =>
    page.on('dialog', async dialog => {
        debug.here(
            '[Puppeteer Dialog]: ' +
                objects.inspect({
                    type: dialog.type(),
                    message: dialog.message(),
                })
        )

        await dialog.dismiss()

        if (dialog.type() === 'alert') {
            await browser.close()
        }
    })

const catchDialogWithCallback = async (browser, page, cb) =>
    page.on('dialog', async dialog => {
        debug.here(
            '[Puppeteer Dialog]: ' +
                objects.inspect({
                    type: dialog.type(),
                    message: dialog.message(),
                })
        )

        await cb(dialog)
    })

const flatMap = (f, xs) => xs.map(f).reduce((acc, x) => acc.concat(x), [])

const getFrameByName = (pageOrFrame, name) => {
    if (!pageOrFrame || (!pageOrFrame.mainFrame && !pageOrFrame.childFrames)) {
        throw new Error(
            `[Puppeteer Error]: Page or Frame is null or is not a Page or Frame object!`
        )
    }

    debug.here(`[Puppeteer Frame]: Get Frame by name=${name}`)
    let mainFrame = null
    // Is a Page
    if (pageOrFrame.mainFrame) {
        mainFrame = pageOrFrame.mainFrame()
        // Is a Frame
    } else {
        mainFrame = pageOrFrame
    }

    const extractFrames = frame => {
        const childFrames = frame.childFrames()
        const hasChildren = childFrames && childFrames.length > 0

        if (hasChildren) {
            return flatMap(extractFrames, childFrames).concat(frame)
        } else {
            return [frame]
        }
    }

    const frameFound = flatMap(extractFrames, mainFrame.childFrames().concat(mainFrame))
        .filter(f => !!f && f.name() !== '')
        .find(f => f.name() === name)

    if (frameFound) {
        return frameFound
    } else {
        throw new Error(`[Puppeteer Error]: Frame name=${name} not found!`)
    }
}

const getFrameByUrl = async (page, url) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Frame By Url][URL]:${url}`)

        let frames = await page.frames()

        const frameCorretoArray = await Promise.all(
            frames.filter(frame => frame.url().includes(url))
        )

        if (frameCorretoArray[0] !== null) {
            return frameCorretoArray[0]
        } else {
            debug.here('[Puppeteer Frame]: Frame url not found!', url)

            return null
        }
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Get Frame By Url][URL]:${url}[Error]:${err}`)
        throw erro
    }
}

const getElementPropertyOpt = async (page, xPath, property) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Element Property X][xPath]:${xPath}[Property]:${property}`)

        const element = await page.$x(xPath)

        const element2 = await element[0].getProperty(property)

        return element2.jsonValue()
    } catch (err) {
        debug.here(
            `${LOG_PREFIX} [Get Element Property X][xPath]:${xPath}[Property]:${property}[Error]:${err}`
        )

        return null
    }
}

const getElementId = async (page, selector) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Element Id][Selector]:${selector}`)

        const id = await page.evaluate(sel => {
            const formatElementValue = value => {
                return id
                    .replace(/\\n/g, '\\n')
                    .replace(/\\'/g, "\\'")
                    .replace(/\\"/g, '\\"')
                    .replace(/\\&/g, '\\&')
                    .replace(/\\r/g, '\\r')
                    .replace(/\\t/g, '\\t')
                    .replace(/\\b/g, '\\b')
                    .replace(/\\f/g, '\\f')
            }

            const element = document.querySelector(sel)

            return element.id
        }, selector)

        debug.here('[Puppeteer Element Id]:', id)
        return id
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Get Element Id][Selector]:${selector}[Error]:${err}`)
        throw err
    }
}

const getElementsHref = async (page, selector) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Elements Href][Selector]:${selector}`)

        const href = await page.evaluate(async sel => {
            var selectorStr = sel.toString()

            const hrefs = Array.from(document.querySelectorAll(selectorStr))

            return hrefs.map(a => a.href)
        }, selector)

        if (!href) {
            throw new Error('[Puppeteer Elements Href]: ' + selector + ' not found!')
        }

        debug.here('[Puppeteer Elements Href]:', href)
        return href
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Get Elements Href][Selector]:${selector}[Error]:${err}`)
        throw err
    }
}

const getElementsClass = async (page, selector) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Elements Class][Selector]:${selector}`)

        const clas = await page.evaluate(async sel => {
            var selectorStr = sel.toString()

            const formatElementValue = value => {
                return value
                    .replace(/\\n/g, '\\n')
                    .replace(/\\'/g, "\\'")
                    .replace(/\\"/g, '\\"')
                    .replace(/\\&/g, '\\&')
                    .replace(/\\r/g, '\\r')
                    .replace(/\\t/g, '\\t')
                    .replace(/\\b/g, '\\b')
                    .replace(/\\f/g, '\\f')
                    .trim()
            }
            const classes = Array.from(document.querySelectorAll(selectorStr))

            return classes
                .map(td => formatElementValue(td.textContent))
                .filter(td => td.textContent != '')
        }, selector)

        if (!clas) {
            throw new Error('[Puppeteer Elements Class]: ' + selector + ' not found!')
        }

        debug.here('[Puppeteer Elements class]:', clas)

        return clas
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Get Elements Class][Selector]:${selector}[Error]:${err}`)
        throw err
    }
}

const getPageByUrl = async (browser, url) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Page By Url][URL]:${url}`)

        let pages = await browser.pages()

        const pageCorretoArray = await Promise.all(pages.filter(page => page.url().includes(url)))

        if (pageCorretoArray[0] !== null) {
            return pageCorretoArray[0]
        } else {
            debug.here('[Puppeteer Page]: Page url not found!', url)
            return null
        }
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Get Page By Url][URL]:${url}[Error]:${err}`)
        throw err
    }
}

const setDownloadBehavior = async (page, path) => {
    try {
        debug.here(`${LOG_PREFIX} [Set Download Behavior][Path]:${path}`)

        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path,
        })
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Set Download Behavior][Path]:${path}[Error]:${err}`)
        throw err
    }
}

const getElements = async (page, selector) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Elements][Selector]:${selector}`)

        const elements = await page.evaluate(async sel => {
            var selectorStr = sel.toString()
            const elements = Array.from(document.querySelectorAll(selectorStr))

const formatElementValue = value => {
    return value
        .replace(/\\n/g, '\\n')
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, '\\&')
        .replace(/\\r/g, '\\r')
        .replace(/\\t/g, '\\t')
        .replace(/\\b/g, '\\b')
        .replace(/\\f/g, '\\f')
        .trim()
}

            return elements.map(e => {
                e.textContent = formatElementValue(e.textContent)
                return e
            })
        }, selector)

        return elements
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Get Elements][Selector]:${selector}[Error]:${err}`)
        throw err
    }
}

const getElement = async (page, selector) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Element][Selector]:${selector}`)

        const element = await page.evaluate(async sel => {
            var selectorStr = sel.toString()
            const element = document.querySelector(selectorStr)

const formatElementValue = value => {
    return value
        .replace(/\\n/g, '\\n')
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, '\\&')
        .replace(/\\r/g, '\\r')
        .replace(/\\t/g, '\\t')
        .replace(/\\b/g, '\\b')
        .replace(/\\f/g, '\\f')
        .trim()
}

            return formatElementValue(element.textContent)
        }, selector)

        if (!element) {
            throw new Error('[Puppeteer Element ]: ' + selector + ' not found!')
        }

        debug.here('[Puppeteer Element]:', element)
        return element
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Get Element][Selector]:${selector}[Error]:${err}`)
        throw err
    }
}

const getElementTextContentOpt = async (page, xpath) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Element Text Content X][xPath]:${xpath}`)

        const element = await page.$x(xpath)

        const element2 = await element[0].getProperty('textContent')

        return element2.jsonValue()
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Get Element Text Content X][xPath]:${xpath}[Error]:${err}`)

        return null
    }
}

const getElementsTextContent = async (page, selector) => {
    try {
        debug.here(`${LOG_PREFIX} [Get Elements Text Content][Selector]:${selector}`)

        const elements = await page.evaluate(async sel => {
            var selectorStr = sel.toString()

            const formatElementValue = value => {
                return value
                    .replace(/\\n/g, '\\n')
                    .replace(/\\'/g, "\\'")
                    .replace(/\\"/g, '\\"')
                    .replace(/\\&/g, '\\&')
                    .replace(/\\r/g, '\\r')
                    .replace(/\\t/g, '\\t')
                    .replace(/\\b/g, '\\b')
                    .replace(/\\f/g, '\\f')
                    .trim()
            }
            const elements = Array.from(document.querySelectorAll(selectorStr))

            return elements.map(a => a.textContent)
        }, selector)

        if (!elements) {
            throw new Error('[Puppeteer Element Text Content]: ' + selector + ' not found!')
        }

        debug.here('[Puppeteer Elements Text Content]:', elements)

        return elements
    } catch (err) {
        debug.here(`${LOG_PREFIX} [Get Elements Text Content][Selector]:${selector}[Error]:${err}`)
        throw err
    }
}

module.exports = {
    doGoto,
    doClick,
    doClickAndWait,
    doClickAndWaitOpt,
    doSelect,
    doTab,
    doType,
    getElementValue,
    getElementCheckedValue,
    getElementTextContent,
    getElementsTextContent,
    getFrameByName,
    getFrameByUrl,
    catchDialog,
    catchDialogWithCallback,
    getElementId,
    getElementsHref,
    getElementsClass,
    getPageByUrl,
    setDownloadBehavior,
    getElementPropertyOpt,
    getElements,
    getElement,
    getElementTextContentOpt,
}
