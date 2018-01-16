exports.count = 0;

const cache = {};

const variables = (exports.variables = {});

const create = (exports.create = conf => {
  const json = JSON.stringify(conf, null, '');

  if (cache[json]) return cache[json];

  const {value, name, fallback} = conf;

  if (!variables[name]) {
    variables[name] = [];
  }

  let variable = new Variable(conf);

  cache[json] = variable;

  if (Array.isArray(variables[name])) {
    variables[name].push(variable);
    exports.count += 1;
  }

  return variable;
});

function Variable(conf) {
  const {name, fallback, value, usesFallback, hasFallback} = conf;
  const prop = k => Object.defineProperty(this, k, {value: conf[k]});
  const propIfUndefined = k => (typeof conf[k] === 'undefined' ? prop(k) : (this[k] = conf[k]));
  const propIfFalse = k => (conf[k] === false ? prop(k) : (this[k] = conf[k]));

  prop('name');
  propIfUndefined('value');
  propIfUndefined('fallback');
  propIfFalse('hasFallback');
  propIfFalse('usesFallback');
}
