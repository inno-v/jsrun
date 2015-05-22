/* globals Promise */
'use strict';
var util = require('util');
var gutil = require('gulp-util');
var Orchestrator = require('orchestrator');
var buildCommand = require('./lib/buildCommand');
var npmTaskRun = require('./lib/exec');

function Justrun() {
  Orchestrator.call(this);
}
util.inherits(Justrun, Orchestrator);

Justrun.prototype.task = Justrun.prototype.add;

Justrun.prototype.run = function run() {
  if (arguments.length < 2) {
    throw new Error('Invalid argument for run-script task');
  }
  var runArgs = arguments[arguments.length - 1];
  if (!Array.isArray(runArgs)) {
    throw new Error('Invalid argument for run-script task');
  }
  var options = arguments[arguments.length - 2];
  var hasOptions = options && typeof options === 'object';
  var cwd;
  if (hasOptions) {
    cwd = options.cwd;
  }
  cwd = cwd ? cwd : process.cwd();

  var command = buildCommand.apply(buildCommand, runArgs);
  function runScript(cb) {
    gutil.log('run-script', command);
    return npmTaskRun(command, {cwd: cwd}, cb);
  }

  var args = Array.prototype.slice.call(arguments);
  var sliceLength = args.length - (hasOptions ? 2 : 1);

  this.add.apply(this, args.slice(0, sliceLength).concat([runScript]));
};

Justrun.prototype.justExec = function justExec(args, options, callback) {
  if (!Array.isArray(args)) {
    throw new Error('Invalid arguments');
  }
  options = options || {};
  options.cwd = options.cwd || process.cwd();

  var cmd = buildCommand.apply(buildCommand, args);

  if (typeof callback === 'function') {
    return npmTaskRun(cmd, options, callback);
  }

  var Pr;
  try {
    Pr = Promise;
  } catch (e) {
    if (e instanceof ReferenceError) {
      Pr = null;
    }
    throw e;
  }

  if (Pr) {
    return new Pr(function promise(resolve, reject) {
      return npmTaskRun(cmd, options, function cb(err, data) {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }
  return npmTaskRun(cmd, options, function noop() {
  });
};

Justrun.prototype.Justrun = Justrun;

var inst = new Justrun();
module.exports = inst;
