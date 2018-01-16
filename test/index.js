const lib = require('..');
const should = require('should');
const Path = require('path');
const fixtures = (...args) => Path.join(__dirname, 'fixtures', ...args);

describe('cwd', () => {
  it('should accept the name of a module', () => {
    let input = fixtures('has-package.json/nested');
    let output = fixtures('has-package.json');
    should(lib({name: 'test', cwd: input}).cwd).equal(output);
    should(lib({name: 'test', cwd: input}).works).equal(true);
    should(lib({name: 'test', cwd: input}).rc_file_property).equal('good');
    should(lib({name: 'test', cwd: input}).rc_nested_file_property).equal('also good');
    should(lib({name: 'test', cwd: input}).in_package).equal('here');
  });

  it('should accept cwd as string or object', () => {
    lib(fixtures('simple')).cwd.should.equal(fixtures('simple'));
    lib({cwd: fixtures('simple')}).cwd.should.equal(fixtures('simple'));
  });

  it('should accept cwd', () => {
    lib(fixtures('simple')).value.should.equal('something');
  });

  it('should follow file heirarchy', () => {
    lib(fixtures('simple')).static_value.should.equal('same');
    lib(fixtures('simple')).changing_value.should.equal('different');
  });
});

describe('ignores', () => {
  it('should ignore files that match globs', () => {
    const conf = lib(fixtures('simple'), {ignore: 'etc/*'});
    conf.value.should.equal('something');
    conf.other_value.should.equal('original');
  });

  it('should ignore files that match globs from evironment', () => {
    const conf = lib(fixtures('simple'), {ENVRC_IGNORE: 'etc/*'});
    conf.value.should.equal('something');
    conf.other_value.should.equal('original');
  });
});

describe('env', () => {
  it('should accept variables explicitly or implicitly', () => {
    lib({stuff: 'good'}).stuff.should.equal('good');
    lib({env: {stuff: 'good'}}).stuff.should.equal('good');
  });

  it('should read environment variables', () => {
    process.env.FOOBAR = 'hi';
    lib().FOOBAR.should.equal('hi');
  });

  it('should override environment variables', () => {
    lib({env: {NODE_ENV: 'production'}}).NODE_ENV.should.equal('production');
    lib({env: {NODE_ENV: 'development'}}).NODE_ENV.should.equal('development');
  });

  describe('extensions', () => {
    it('should read files with extensions', () => {
      should(lib(fixtures('has-file-extensions')).glark).equal('blark');
      should(lib(fixtures('has-file-extensions')).fubz).equal('norc');
    });
  });

  describe('special', () => {
    it('should return env', () => {
      lib(fixtures('simple')).env.should.be.an.Object();
      lib(fixtures('has-special-keys')).env.should.equal(10);
    });

    it('should return cwd', () => {
      lib(fixtures('simple')).cwd.should.be.a.String();
      lib(fixtures('has-special-keys')).cwd.should.equal(20);
    });

    it('should return merged', () => {
      lib(fixtures('simple')).merged.should.be.an.Object();
      lib(fixtures('has-special-keys')).merged.should.equal(30);
    });

    it('should return values', () => {
      lib(fixtures('simple')).values.should.be.an.Object();
      lib(fixtures('has-special-keys')).values.should.equal(40);
    });

    it('should return files', () => {
      lib(fixtures('simple')).files.should.be.an.Array();
      lib(fixtures('has-special-keys')).files.should.equal(50);
    });
  });

  describe('fallbacks', () => {
    it('should fallback to non-environment properties', () => {
      lib().env.should.be.a.Object();
      lib({env: {FOOBAR: 'hi'}}).env.FOOBAR.should.equal('hi');
      lib().cwd.should.be.a.String();
      lib().cwd.should.equal(process.cwd());
    });

    it('should fallback to arguments when called', () => {
      should.not.exist(lib()('BAZ'));
      lib({env: {BAZ: 'cool'}})('BAZ').should.equal('cool');
      lib({env: {ZUN: 'keep'}})('ZUN', 'other').should.equal('keep');
      lib({env: {BUZ: 'cool'}})(['BAZ', 'BUZ']).should.equal('cool');
    });

    it('should use fallback as value if arguments are exhausted', () => {
      lib({env: {}})('BAZ', 'cool').should.equal('cool');
      lib()(['BAZ', 'BUZ', 'QUX'], 'oh well').should.equal('oh well');
    });
  });

  describe('options', () => {
    it('should not throw', () => {
      lib({env: {ABC: 'abc'}})('ABC', {required: true}).should.equal('abc');
    });

    it('should throw', () => {
      should.throws(() => {
        lib({env: {ABC: 'abc'}})('DEF', {required: true});
      }, /undefined value for 'DEF'/);
    });

    it('should throw a type error', () => {
      should.throws(() => {
        lib({env: {num: 10}})('num', {type: 'string'});
      }, /'num' requires type string, but got type number/);
    });
  });

  describe('variables', () => {
    it('should count the stored variables', () => {
      lib.count.should.be.a.Number();
      lib.count.should.be.greaterThan(10);
    });

    it('should store this variables', () => {
      let keys = Object.keys(lib.variables);
      let values = Object.values(lib.variables);
      keys.length.should.be.a.Number();
      keys.length.should.be.greaterThan(5);
      let count = values.reduce((prev, v) => (prev += v.length), 0);
      count.should.equal(lib.count);
    });
  });
});
