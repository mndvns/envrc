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

describe('env', () => {
  it('should accept variables explicitly or implicitly', () => {
    lib({stuff: 'good'}).stuff.should.equal('good')
    lib({env: {stuff: 'good'}}).stuff.should.equal('good')
  });

  it('should read environment variables', () => {
    process.env.FOOBAR = 'hi'
    lib().FOOBAR.should.equal('hi');
  });

  it('should override environment variables', () => {
    lib({env: {NODE_ENV: 'production'}}).NODE_ENV.should.equal('production');
    lib({env: {NODE_ENV: 'development'}}).NODE_ENV.should.equal('development');
  });

  it('should fallback to non-environment properties', () => {
    lib().env.should.be.a.Object();
    lib({env: {FOOBAR: 'hi'}}).env.FOOBAR.should.equal('hi');
    lib().cwd.should.be.a.String();
    lib().cwd.should.equal(process.cwd());
  });

  it('should fallback to arguments when called', () => {
    should.not.exist(lib()('BAZ'));
    lib({env: {BAZ: 'cool'}})('BAZ').should.equal('cool');
    lib({env: {BUZ: 'cool'}})(['BAZ', 'BUZ']).should.equal('cool');
  });

  it('should use fallback as value if arguments are exhausted', () => {
    lib()(['BAZ', 'BUZ', 'QUX'], 'oh well').should.equal('oh well');
  });
});
