
var omit = require('object.omit')
var Builder = require('@tradle/chained-obj').Builder
var Identity = require('@tradle/identity').Identity
var constants = require('@tradle/constants')
var parallel = require('run-parallel')
var SIGNEE = constants.SIGNEE
var SIG = constants.SIG
var TYPE = constants.TYPE
var PREV_HASH = constants.PREV_HASH

module.exports = {
  verify: function (verifier, chainedObj, cb, next) {
    var data = chainedObj.parsed.data
    var sig = data[SIG]
    // unsigned objects are fine, they don't claim to be created by anyone
    if (typeof sig === 'undefined') return next(verifier, chainedObj, cb)

    getSignee(verify)

    function getSignee (cb) {
      if (data[SIGNEE]) {
        // format is one of:
        // rootHash:curHash
        // curHash
        var curHash = data[SIGNEE].split(':').pop()
        return verifier.lookup(curHash, function (err, obj) {
          if (err) return cb(err)

          cb(null, Identity.fromJSON(obj.parsed.data))
        })
      }

      var identity = chainedObj.from && chainedObj.from.identity
      if (identity) return cb(null, identity)

      cb(new Error('unknown sender'))
    }

    function verify (err, signee) {
      if (err) return cb(err)

      var isIdentity = data[TYPE] === Identity.TYPE
      var purpose
      if (isIdentity && data[PREV_HASH]) {
        purpose = 'update'
      } else {
        purpose = 'sign'
      }

      var keys = signee.keys({
        purpose: purpose
      })

      var unsigned = omit(data, [SIG])

      var rebuild = new Builder().data(unsigned)
      chainedObj.parsed.attachments.forEach(rebuild.attach, rebuild)
      rebuild.build(function (err, result) {
        if (err) return cb(err)

        var buf = result.form
        var verifications = keys.map(function (k) {
          return k.verify.bind(k, buf, sig)
        })

        parallel(verifications, function (err, results) {
          if (err) return cb(err)

          if (results.some(function (r) { return r })) {
            next(verifier, chainedObj, cb)
          } else {
            cb(new Error('no key verifies signature'))
          }
        })
      })
    }
  }
}
