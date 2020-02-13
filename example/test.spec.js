const expect = require('chai').expect;

describe('describe', function() {
  let foo = '';
  before(function() {
    foo = 'bar';
  });

  beforeEach(function() {
    foo = 'bar';
  });

  describe('nested describe', function() {
    before(function() {
      foo = 'bar';
    });

    beforeEach(function() {
      foo = 'bar';
    });

    it('test pass in nested describe', function() {
      expect(foo).to.be.equal('bar');
    });

    it('test fail in nested describe', function() {
      expect(true).to.be.equal(false);
    });

    it('test fail with 3 reties in nested describe', function() {
      this.retries(3);
      expect(true).to.be.equal(false);
    });

    it('test pending in nested describe');

    after('named hook', function() {
      foo = 'bar';
    });

    afterEach(function() {
      foo = 'bar';
    });
  });

  it('test pass', function() {
    expect(true).to.be.equal(true);
  });

  it('test fail', function() {
    expect(true).to.be.equal(false);
  });

  it('test pending');

  after(function() {
    foo = 'bar';
  });

  afterEach(function() {
    foo = 'bar';
  });
});
