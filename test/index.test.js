'use strict'

const chai = require('chai')

const app = require('../app')

describe('Testing', () => {
    it('Testing getFrameByName - Validation - with not frame', done => {
        try {
            app.getFrameByName(null, 'frameName')
            done('Should be throws validation error!')
        } catch (e) {
            done()
        }
    })

    it('Testing getFrameByName - Validation - with not mainFrame', done => {
        try {
            app.getFrameByName({}, 'frameName')
            done('Should be throws validation error!')
        } catch (e) {
            done()
        }
    })

    it('Testing getFrameByName - Validation - frame not found', done => {
        try {
            app.getFrameByName(
                {
                    name: () => {
                        return 'frameNotFound'
                    },
                    childFrames: () => {
                        return []
                    },
                },
                'frameName'
            )
            done('Should be throws validation error!')
        } catch (e) {
            done()
        }
    })

    it('Testing getFrameByName - OK', done => {
        try {
            const frame = app.getFrameByName(
                {
                    name: () => {
                        return 'frameName'
                    },
                    childFrames: () => {
                        return []
                    },
                },
                'frameName'
            )
            chai.assert.exists(frame.name, 'frame.name is not exists!')
            chai.assert.exists(frame.childFrames, 'frame.childFrames is not exists!')
            chai.assert.isFunction(frame.name, 'frame.name is not function!')
            chai.assert.isFunction(frame.childFrames, 'frame.childFrames is not function!')

            done()
        } catch (e) {
            done(e)
        }
    })
})
