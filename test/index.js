const lib = require('..');
const should = require('should');
const fixtures = __dirname + '/fixtures';

describe('cwd', () => {
  it('should accept cwd as string or object', () => {
    lib(fixtures).cwd.should.equal(fixtures);
    lib({cwd: fixtures}).cwd.should.equal(fixtures);
  });

  it('should accept cwd', () => {
    lib(fixtures).value.should.equal('something');
  });

  it('should follow file heirarchy', () => {
    lib(fixtures).static_value.should.equal('same');
    lib(fixtures).changing_value.should.equal('different');
  });
});

describe('ignores', () => {
  it('should ignore files that match globs', () => {
    const conf = lib(fixtures, {ignore: 'etc/*'});
    conf.value.should.equal('something');
    conf.other_value.should.equal('original');
  });

  it('should ignore files that match globs from evironment', () => {
    const conf = lib(fixtures, {ENVRC_IGNORE: 'etc/*'});
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
