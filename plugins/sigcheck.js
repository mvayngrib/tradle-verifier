
var omit = require('object.omit')
var Builder = require('chained-obj').Builder
var Identity = require('midentity').Identity
var constants = require('tradle-constants')
var SIG = constants.SIG
var TYPE = constants.TYPE
var PREV_HASH = constants.PREV_HASH
var CUR_HASH = constants.CUR_HASH
var ROOT_HASH = constants.ROOT_HASH

module.exports = {
  verify: function (verifier, chainedObj, cb, next) {
    var data = chainedObj.parsed.data
    var sig = data[SIG]
    // unsigned objects are fine, they don't claim to be created by anyone
    if (typeof sig === 'undefined') return next(verifier, chainedObj, cb)

    var identity = chainedObj.from
    if (!identity) return cb(new Error('unknown sender'))

    var isIdentity = data[TYPE] === Identity.TYPE
    var purpose
    if (isIdentity && data[PREV_HASH]) {
      purpose = 'update'
    } else {
      purpose = 'sign'
    }

    var keys = identity.keys({
      purpose: purpose
    })

    var skipProps = [
      CUR_HASH,
      SIG
    ]

    if (!data[CUR_HASH] || data[CUR_HASH] === data[ROOT_HASH]) {
      skipProps.push(ROOT_HASH)
    }

    var unsigned = omit(data, skipProps)

    var rebuild = new Builder().data(unsigned)
    chainedObj.parsed.attachments.forEach(rebuild.attach, rebuild)
    rebuild.build(function (err, result) {
      if (err) return cb(err)

      var buf = result.form
      var verified = keys.some(function (key) {
        return key.verify(buf, sig)
      })

      if (verified) {
        next(verifier, chainedObj, cb)
      } else {
        cb(new Error('no key verifies signature'))
      }
    })
  }
}
