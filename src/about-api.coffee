# About

os = require "os"
pk = require "../package.json"

about =
  hostname: os.hostname()
  type: pk.name
  version: pk.version
  description: pk.description
  startDate: (new Date).toISOString()

sendAbout = (req, res, next) ->
  res.send about
  next()

addRoutes = (prefix, server) ->
  server.get "/#{prefix}/about", sendAbout
  server.get "/about", sendAbout

module.exports =
  addRoutes: addRoutes

# vim: ts=2:sw=2:et:
