var test = require('tape')
var spawn = require('../')

test('spawn ls', function (t) {
  var st = spawn(t, 'ls ' + __dirname)

  st.end()
})

test('spawn ls w/ succeeds', function (t) {
  var st = spawn(t, 'ls ' + __dirname)

  st.succeeds()
  st.end()
})

test('spawn ls w/ fails', function (t) {
  var st = spawn(t, 'pizzadonkeyultimate-highlylikelynotinstalled')

  st.fails()
  st.end()
})

test('spawn ls w/ match regex', function (t) {
  var st = spawn(t, 'ls ' + __dirname)

  st.succeeds()
  st.stdout.match(/test.js/)
  st.stdout.match(/test/)
  st.end()
})

test('spawn ls w/ match string', function (t) {
  var st = spawn(t, 'ls ' + __dirname)

  st.succeeds()
  st.stdout.match('test.js\n')
  st.end()
})

test('spawn true w/ empty', function (t) {
  var st = spawn(t, 'true') // spawn /usr/bin/true which outputs nothing
  st.succeeds()
  st.stdout.empty()
  st.end()
})

test('spawn with end false', function (t) {
  var st = spawn(t, 'pizzadonkeyultimate-highlylikelynotinstalled', {
    end: false
  })

  st.end(function onEnd (err) {
    t.ifErr(err, 'got error in custom end fn')
    t.end()
  })
})

test('spawn and ensure proc was killed', function (t) {
  var st = spawn(t, 'cat -')

  st.stdin.write('x')
  st.stdout.match('x')

  st.end()
})

test('spawn and ensure proc was killed (with delay)', function (t) {
  var st = spawn(t, 'cat -')

  st.stdout.match('x')

  setTimeout(function () {
    st.stdin.write('x')
  }, 250)

  st.end()
})

test('spawn with timeout', function (t) {
  var st = spawn(t, 'cat -')

  st.timeout(250, function onTimeout () {
    t.ok(true, 'timeout happened')
  })
  st.end()
})

test('spawn with custom spawn option', function (t) {
  var st = spawn(t, 'echo $FOO', {env: {FOO: 'hi'}})
  st.stdout.match('hi\n')
  st.end()
})

test('spawn kill', function (t) {
  var st = spawn(t, 'ping localhost' + __dirname)
  setTimeout(function () {
    st.kill()
  }, 2000)
  st.end()
})

test('custom match function', function (t) {
  var st = spawn(t, 'ls ' + __dirname)

  st.succeeds()
  st.stdout.match(function match (output) {
    return output === 'test.js\n'
  })
  st.end()
})
