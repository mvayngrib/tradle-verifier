
var Identity = require('midentity').Identity

module.exports = {
  verify: function (verifier, obj, cb, next) {
    if (obj.parsed.data.value._type !== Identity.TYPE) {
      return next(verifier, obj, cb)
    }

    try {
      Identity.fromJSON(obj.parsed.data.value)
      next(verifier, obj, cb)
    } catch (err) {
      console.warn('Failed to parse identity object', obj)
      // throw err
      cb(err)
    }
  }
}
