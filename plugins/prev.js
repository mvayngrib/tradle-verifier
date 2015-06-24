
module.exports = {
  verify: function (verifier, obj, cb, next) {
    var data = obj.parsed.data.value

    if (!('_prev' in data)) return true

    return verifier.lookup(data._prev, function (err, prev) {
      if (err) return cb(err)

      if ((obj.from && !prev.from) || (!obj.from && prev.from)) return cb(new Error('...'))
      if (obj.from) {
        // check obj.from and prev.from are the same person
      }

      next(verifier, obj, cb)
    })
  }
    //   var prevData = prev.parsed.data.value
    //   var pubKey = prev._pubkey
    //   if (!pubKey) return false

    //   if (pubKey === obj._pubkey) return true

//   return Q.all([
//     store.byPubKey(obj._pubkey),
//     store.byPubKey(prev._pubkey)
//   ])
// })
// .spread(function(ident, prevIdent) {
//   // may not be as simple as this
//   return ident === prevIdent
// })
}
