# confrc

A simple config loader that melds [dotenv](https://github.com/motdotla/dotenv), [rc](https://github.com/dominictarr/rc), and [envs](https://github.com/camshaft/envs).

## Features

- Loads env files based on common naming conventions and project file structures
- Reads JSON, INI, and YAML
- Combines env configs and environment variables
- Provides property lookup fallbacks and value fallbacks

## Order of paths

In the current directory it looks for

- `<cwd>/.env.common`
- `<cwd>/.env.default`
- `<cwd>/.env.<NODE_ENV>`
- `<cwd>/.env.local`
- `<cwd>/.env`

Then for each of the following directories...

- `<cwd>`
- `<cwd>/etc`
- `<cwd>/config`
- `<cwd>/.config`

...it looks for the following files

- `common`
- `default`
- `<NODE_ENV>`

## Usage

#### Loading

```js
// reads and merges files
var conf = require('confrc')();

// change your working directory
var conf = require('confrc')('/some/other/dir');
// same as
var conf = require('confrc')({cwd: '/some/other/dir'});

// override or add some variables
var conf = require('confrc')({NODE_ENV: 'production', foo: 'bar'});
// same as
var conf = require('confrc')({env: {NODE_ENV: 'production', foo: 'bar'}});

// add other lookup directories
var conf = require('confrc')({dirs: ['my-other-environments']});
```

#### Values

```js
var conf = require('confrc')({buz: 'cool'});

// access values as object properties
conf.buz === 'cool';

// or by calling
conf('buz') === 'cool';

// when calling, the second argument value acts as a fallback
conf('missing', 'good save') === 'good save';

// or pass an array as the first argument to fallback to other properties
conf(['missing', 'buz']) === 'cool';
```

## License

MIT
