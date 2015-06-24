
var omit = require('object.omit')
var Builder = require('chained-obj').Builder
var Identity = require('midentity').Identity

module.exports = {
  verify: function (verifier, chainedObj, cb, next) {
    var data = chainedObj.parsed.data.value
    var sig = data._sig
    // unsigned objects are fine, they don't claim to be created by anyone
    if (typeof sig === 'undefined') return next(verifier, chainedObj, cb)

    var identity = chainedObj.from
    if (!identity) return cb(new Error('unknown sender'))

    var purpose = data._type === Identity.TYPE ? 'update' : 'sign'
    var keys = identity.keys({
      purpose: purpose
    })

    var unsigned = omit(data, '_sig')
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
