var spawn = require('npm-execspawn')
var stripAnsi = require('strip-ansi')

module.exports = StreamMatch

function StreamMatch (t, command, opts) {
  var self = this
  if (!(this instanceof StreamMatch)) return new StreamMatch(t, command, opts)
  if (!opts) opts = {}
  if (typeof command !== 'string') throw new Error('must specify command string')

  this.proc = spawn(command, opts)
  this.t = t
  this.opts = opts
  this.stdout = new StreamTest(t, this.proc.stdout, checkDone, 'stdout')
  this.stderr = new StreamTest(t, this.proc.stderr, checkDone, 'stderr')
  this.stdin = this.proc.stdin
  this.kill = this.proc.kill.bind(this.proc)

  var debug = process.env.DEBUG || ''
  if (debug.indexOf('tape-spawn') > -1) {
    this.stderr.stream.pipe(process.stderr)
  }

  // in case tape times out or something we should clean up
  t.on('end', function onTapeEnd () {
    self.proc.kill()
  })

  function checkDone () {
    if (self.stdout.pending === 0 && self.stderr.pending === 0) {
      self.proc.kill()
    }
  }
}

StreamMatch.prototype.end = function (onDone) {
  var self = this
  self.proc.on('exit', function onExit (code) {
    code = code || 0
    if (self.timeoutId) clearTimeout(self.timeoutId)
    if (typeof self.opts.exitCode === 'number') self.t.equal(code, self.opts.exitCode, 'exit code matched')
    else if (self.opts.exitCode === 'nonzero') self.t.notEqual(code, 0, 'non-zero exit code')
    if (self.opts.end !== false) self.t.end()
    if (onDone) onDone()
  })
}

StreamMatch.prototype.timeout = function (time, message) {
  var self = this
  if (self.timeoutId) clearTimeout(self.timeoutId)
  self.timeoutId = setTimeout(function timeout () {
    self.proc.kill()
    if (typeof message === 'function') message() // e.g. let the user handle the assertion themselves
    else self.t.ok(false, message || 'timeout exceeded')
  }, time)
}

StreamMatch.prototype.succeeds = function () {
  this.opts.exitCode = 0
}

StreamMatch.prototype.fails = function () {
  this.opts.exitCode = 'nonzero'
}

StreamMatch.prototype.exitCode = function (code) {
  this.opts.exitCode = code
}

function StreamTest (t, stream, onDone, label) {
  if (!(this instanceof StreamTest)) return new StreamTest(t, stream, onDone, label)
  this.t = t
  this.stream = stream
  this.onDone = onDone
  this.label = label ? label + ' ' : ''
  this.pending = 0
}

StreamTest.prototype.empty = function empty () {
  this.match(/^$/, this.label + 'was empty', this.label + 'was not empty')
}

StreamTest.prototype.match = function match (pattern, message, failMessage) {
  var self = this
  var patternLabel = (typeof pattern === 'function') ? 'pattern function' : pattern
  this.pending++
  var matched = false
  var buff = ''
  this.stream.setEncoding('utf8')
  this.stream.on('data', function onData (ch) {
    buff += ch
    matchOutput()
  })

  this.stream.on('end', function onEnd () {
    matchOutput()
    if (!matched) {
      self.pending--
      var outMessage = '"' + buff + '" did not match ' + patternLabel
      if (failMessage) outMessage = failMessage + ' ("' + buff + '")'
      self.t.ok(false, stripAnsi(outMessage))
      self.onDone()
    }
  })

  function matchOutput () {
    if (matched) return
    var match
    if (typeof pattern === 'function') {
      match = pattern(buff)
    } else if (typeof pattern === 'string') {
      match = pattern === buff
    } else {
      match = pattern.test(buff)
    }
    if (match) {
      matched = true
      self.pending--
      self.t.ok(true, stripAnsi(message || 'matched ' + patternLabel))
      self.onDone()
    }
  }
}
