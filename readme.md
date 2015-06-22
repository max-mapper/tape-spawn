# tape-spawn

spawn processes conveniently in [tape](https://npmjs.org/tape) tests and match against stdout/stderr streaming output

[![NPM](https://nodei.co/npm/tape-spawn.png)](https://nodei.co/npm/tape-spawn/)

[![Build Status](https://travis-ci.org/maxogden/tape-spawn.svg?branch=master)](https://travis-ci.org/maxogden/tape-spawn)

[![js-standard-style](https://raw.githubusercontent.com/feross/standard/master/badge.png)](https://github.com/feross/standard)

## installation

```
npm install tape-spawn
```

## usage

use this in conjunction with `tape`, e.g.

```js
var test = require('tape')
var spawn = require('tape-spawn')

test('spawn ls', function (t) {
  var st = spawn(t, 'ls ' + __dirname)
  st.stdout.match(/example.js/)
  st.end()
})
```

## debugging

If you set `DEBUG=tape-spawn` in your ENV when running your tests then the STDERR of the spawned child process will be piped into the STDERR of your terminal.

## api

### `var spawn = require('tape-spawn')`

returns a function, `spawn`, that can be used to spawn new processes and test their output with tape

processes are spawned with [npm-execspawn](https://npmjs.org/npm-execspawn), meaning local node_modules bins will be matched first before looking in your PATH

### var spawnTest = spawn(tapeTest, commandString, [options])

returns `spawnTest`, which can be used to set up assertions. also spawns a process using `commandString`. `options` are optional, and can have the following properties:

- `end` (default `true`) - if `false` no `t.end()` assertion will be set up for the test, which means you will have to use `spawnTest.end(onEnd)` to handle it yourself

in addition, the entire `options` object will get passed as the second argument to `spawn`, so you can do e.g. `{env: {FOO: 'bar'}}` to pass env vars to pass custom spawn options (see the child_process node docs for more info)

### spawnTest.fails([message])

sets up a tape assertion that expects a non-zero exit code – with an optional `message`

### spawnTest.succeeds([message])

sets up a tape assertion that expects exit code to equal 0 – with an optional `message`

### spawnTest.exitCode(code, [message])

`code` must be a number. sets up a tape assertion that expects exit code to equal `code` – with an optional `message`

### spawnTest.timeout(time, [message])

waits for `time` milliseconds and then kills the spawned process and fails the test with the optional `message` string assert message. if `message` is a function it will be called after the timeout, and no fail assert will be created

### spawnTest.end([onDone])

sets up a tape assertion for `t.end()`. if you pass the optional `onDone` callback, no `t.end()` assertion will be created, and your `onDone` callback will be called when the test is done

### spawnTest.kill()

kills the spawned process

### spawnTest.stdin

this property is the internally spawned process `stdin` stream instance

### spawnTest.stdout.match(pattern, [message, failMessage])

matches `stdout` output (assumes utf8 encoding). if `pattern` is a RegExp it will set up a tape assertion that uses use `pattern.test(output)`. if `pattern` is a string it will use `t.equals()` to match the entire output against `message`.
if `pattern` is a function it should return true/false and take 1 argument, the full output of the spawn

You can pass the optional `message` or `failMessage` to customize the tape assertion messages

### spawnTest.stdout.empty()

takes no args. sets up a tape assertion that expects output to match `/^$/` (e.g. to be empty)

### spawnTest.stderr.match(pattern, [message, failMessage])

the same as `spawnTest.stdout.match` but matches `stderr` instead

### spawnTest.stderr.empty()

the same as `spawnTest.stdout.empty` but matches `stderr` instead
