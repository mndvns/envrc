/**
 * Module dependencies
 */

const extend = require('deep-extend');
const format = require('whatever-format');
const exists = require('fs').existsSync;
const resolve = require('path').resolve;
const join = require('path').join;

/**
 * Expose `confrc`
 */

module.exports = confrc;

/**
 * Read and merge environment config files
 * @param {String} [cwd] - current working directory
 * @param {Object} [env] - additional environment variables
 * @param {Object} [opts] - configuration options (properties: cwd, env, dirs)
 */
function confrc(cwd, env, opts) {
  if (typeof cwd === 'object') {
    opts = env;
    env = cwd;
    cwd = null;
  }

  if (!env) {
    env = {};
  }

  if (!opts) {
    opts = env || {};
  }

  if (!cwd) {
    cwd = opts.cwd || process.cwd();
  }

  if (!opts.hasOwnProperty('cwd') && !opts.hasOwnProperty('env') && !opts.hasOwnProperty('dirs')) {
    opts = {env: opts};
  }

  env = Object.assign({}, process.env, opts.env || {});

  const dirs = [
    'etc',
    'config',
    '.config',
  ].concat(opts.dirs || [])
   .map(dir => join(cwd, dir))
   .filter(dir => exists(dir))
   .map(dir => dir.replace(cwd, ''));

  const resolvedValues = [
    search('common'),
    search('default'),
    search(env.NODE_ENV),
    search('local'),
    `.env`,
  ].reduce((prev, next) => prev.concat(next), [])
   .reduce(read, env);

  if (resolvedValues.hasOwnProperty('_')) delete resolvedValues['_'];

  function config() {}

  Object.defineProperties(config, {
    env: {value: resolvedValues},
    cwd: {value: cwd},
  })

  const proxy = new Proxy(config, {
    get: function(target, name) {
      if (target.hasOwnProperty(name)) return target[name];
      if (target.env.hasOwnProperty(name)) return target.env[name];
    },
    apply: function(target, thisArg, args) {
      const names = [].concat(args.shift());
      const fallback = args.pop();
      return get.call(target.env, names, fallback);
    }
  });

  return Object.freeze(proxy);

  function search(name) {
    if (!name) return [];

    const paths = [`.env.${name}`];

    for (let i = 0; i < dirs.length; i++) {
      let dir = dirs[i];
      paths.push(`${dir}/${name}`);
    }

    return paths;
  }

  function read(conf, file) {
    const path = resolve(cwd + '/' + file);
    if (exists(path)) {
      const additions = format.readFileSync(path);
      return extend(conf, additions);
    } else {
      return conf;
    }
  }

  function get(names, fallback) {
    let name = names.shift();
    if (this.hasOwnProperty(name)) return this[name];
    return names.length ? get.call(this, names, fallback) : fallback;
  }
}
