/**
 * Module dependencies
 */

const minimatch = require('minimatch');
const extend = require('deep-extend');
const format = require('whatever-format');
const exists = require('fs').existsSync;
const resolve = require('path').resolve;
const inspect = require('util').inspect;
const join = require('path').join;
const variable = require('./variable');
const {FAIL} = require('./symbol');

/**
 * Expose `envrc`
 */

exports = module.exports = envrc;

Object.defineProperties(exports, {
  variables: {get: () => variable.variables},
  count: {get: () => variable.count},
});

/**
 * Read and merge environment config files
 * @param {String} [cwd] - current working directory
 * @param {Object} [env] - additional environment variables
 * @param {Object} [opts] - configuration options (properties: cwd, env, dirs)
 */
function envrc(cwd, env, opts) {
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

  if (!hasOpts(['cwd', 'env', 'dirs', 'overrides', 'ignore'])) {
    opts = {env: opts};
  }

  if (!opts.env) {
    opts.env = {};
  }

  if (!opts.overrides) {
    opts.overrides = {};
  }

  if (!opts.dirs) {
    opts.dirs = [];
  }

  if (!opts.ignore) {
    opts.ignore = [];
  } else if (typeof opts.ignore === 'string') {
    opts.ignore = [opts.ignore];
  }

  env = Object.assign({}, process.env, opts.env, opts.overrides);

  // remove non-environment variable props
  if (env.hasOwnProperty('_')) delete env['_'];

  let dirs = [];
  let files = [];

  if (!env['ENVRC_IGNORE_ALL']) {
    if (!env['ENVRC_IGNORE_CWD']) dirs.push(cwd);
    if (!env['ENVRC_IGNORE_ETC']) dirs.push('etc');
    if (!env['ENVRC_IGNORE_CONFIG']) dirs.push('config');
    if (!env['ENVRC_IGNORE_DOT_CONFIG']) dirs.push('.config');

    dirs = dirs
      .concat(opts.dirs)
      .map(dir => join(cwd, dir))
      .filter(dir => exists(dir))
      .map(dir => dir.replace(cwd, ''));

    // search for the files, read if they exist, and merge the output
    if (!env['ENVRC_IGNORE_COMMON']) files.push(search('common'));
    if (!env['ENVRC_IGNORE_DEFAULT']) files.push(search('default'));
    if (!env['ENVRC_IGNORE_LOCAL']) files.push(search('local'));
    if (!env['ENVRC_IGNORE_ENV']) files.push('.env');
  }

  const ignore = opts.ignore;

  if (env['ENVRC_IGNORE']) {
    ignore.push(env['ENVRC_IGNORE']);
  }

  const values = [].concat
    .apply([], files)
    .filter(file => {
      for (let i = 0; i < ignore.length; i++) {
        let glob = ignore[i];
        if (minimatch(file, glob)) return false;
      }
      return exists(join(cwd, file));
    })
    .reduce(read, {});

  Object.assign(values, opts.overrides);

  // now look for environment-specific config files, since it may
  // have been changed in an env file above
  const configValues = search(values.NODE_ENV || env.NODE_ENV).reduce(read, values);

  // merge values with env values
  const configMerged = Object.assign({}, env, values);

  Object.defineProperties(config, {
    merged: {value: configMerged},
    values: {value: configValues},
    env: {value: env},
    cwd: {value: cwd},
  });

  const proxy = new Proxy(config, {
    get: function(_target, name) {
      if (['env', 'cwd'].indexOf(name) > -1) return config[name];
      return get(name);
    },

    apply: function(_target, _thisArg, args) {
      let name = args[0];
      let names = [].concat(name);
      let fallback = args[1];
      let options = args[2];

      if (!options) {
        if (typeof fallback === 'object') {
          options = fallback;
          fallback = undefined;
        } else {
          options = {};
        }
      }

      let {type, required} = options;

      let value = apply(names, fallback, fallback, options);

      if (isUndefined(value)) {
        if (required) {
          throw new Error(`undefined value for ${inspect(name)}`);
        }
      } else {
        if (type) {
          let vtype = typeof value;
          let check = name => type === name && typeof value !== name;
          let error = new Error(
            `${inspect(name)} requires type ${type}, but got type ${vtype} (${inspect(value)})`
          );
          if (check('string')) throw error;
          if (check('number')) throw error;
          if (check('object')) throw error;
          if (type === 'array' && !Array.isArray(value)) throw error;
        }
      }

      return value;
    },
  });

  return Object.freeze(proxy);

  function config() {}

  function get(name, value, fallback) {
    let usesFallback = false;
    let hasFallback = typeof fallback !== 'undefined';

    // resolve the value if possible
    if (configValues.hasOwnProperty(name)) value = configValues[name];
    else if (configMerged.hasOwnProperty(name)) value = configMerged[name];
    else if (config.hasOwnProperty(name)) value = config[name];
    else usesFallback = hasFallback;

    // instantiate the variable
    let v = variable.create({name, fallback, value, usesFallback, hasFallback});

    // if variable has a Symbol value, use the fallback...
    if (value === FAIL) {
      if (v.hasFallback) {
        v.value = v.fallback;
      } else {
        delete v.value;
      }
    }

    // ...but return the value as set upon instantiation
    return value;
  }

  function apply(names, fallback, originalFallback, options) {
    let value = get(names.shift(), FAIL, originalFallback);
    if (value !== FAIL) return value;
    if (!names.length) return originalFallback;
    return apply(names, fallback, originalFallback, options);
  }

  function hasOpts(list) {
    return opts.hasOwnProperty(list.shift()) || (list.length && hasOpts(list));
  }

  function search(name) {
    const paths = [];

    if (!name) return paths;

    if (!ignored('ENV', name)) {
      paths.push(`.env.${name}`);
    }

    for (let i = 0; i < dirs.length; i++) {
      let dir = dirs[i];
      if (!ignored(dir, name)) {
        paths.push(`${dir}/${name}`);
      }
    }

    return paths;
  }

  function ignored() {
    const key = [].slice
      .call(arguments)
      .join('_')
      .toUpperCase();
    return env['ENVRC_IGNORE_' + key];
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
}

function isUndefined(val) {
  return typeof val === 'undefined';
}
