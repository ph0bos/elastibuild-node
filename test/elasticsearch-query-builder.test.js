'use strict';

var should = require('chai').should();
var mocha  = require('mocha');
var sinon  = require('sinon');

var QueryBuilder = require('../');

describe('utils/elasticsearch-query-builder', function () {

  var builder;

  beforeEach(function(done) {
    builder = QueryBuilder.buildQuery();
    done();
  });

  afterEach(function(done) {
    done();
  });

  it('should successfully build a simple match query when provided with a simple field and value', function (done) {
    builder.withMatch("my_field", "my_value");

    var query = builder.build();

    should.exist(query.query.filtered.query.bool.must[0].match);
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should successfully build a multi-match query by converting a single "match" statement to a multiple "terms" statement', function (done) {
    builder.withMatch("my_field", [ "my_value_1", "my_value_2" ]);

    var query = builder.build();
    should.exist(query.query.filtered.query.bool.must[0].terms);
    should.not.exist(query.query.filtered.query.bool.must[0].match);
    query.query.filtered.query.bool.must[0].terms.should.have.property('my_field').with.lengthOf(2);

    done();
  });

  it('should successfully build a terms query when provided with an array of required values for a field', function (done) {
    builder.withTerms("my_field", [ "my_value_1", "my_value_2" ]);

    var query = builder.build();
    should.exist(query.query.filtered.query.bool.must[0].terms);
    should.not.exist(query.query.filtered.query.bool.must[0].match);
    query.query.filtered.query.bool.must[0].terms.should.have.property('my_field').with.lengthOf(2);

    done();
  });

  it('should successfully append a sort field when provided with a valid field and order', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSort("my_field", "desc");

    var query = builder.build();
    should.exist(query.sort);
    query.sort.should.have.property('my_field');
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should successfully append a sort field and override the order when provided with a valid field and invalid order', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSort("my_field", "INVALID!!");

    var query = builder.build();
    should.exist(query.sort);
    query.sort.should.have.property('my_field');
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should successfully append a sort field when withSortUri is provided with a valid field and order', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSortUri("my_field:desc");

    var query = builder.build();
    should.exist(query.sort);
    query.sort[0].should.have.property('my_field');
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should successfully append a sort field when withSortUri is provided with a valid field', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSortUri("my_field");

    var query = builder.build();
    should.exist(query.sort);
    query.sort[0].should.have.property('my_field');
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should successfully append a sort field when withSortUri is provided with a valid field with a suffixed colon(:)', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSortUri("my_field:");

    var query = builder.build();
    should.exist(query.sort);
    query.sort[0].should.have.property('my_field');
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should successfully append a sort field when withSortUri is provided with a valid field, order and mode', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSortUri("my_field:desc:min");

    var query = builder.build();
    should.exist(query.sort);
    query.sort[0].should.have.property('my_field');
    query.sort[0].my_field.order.should.equal('desc');
    query.sort[0].my_field.mode.should.equal('min');
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should successfully append a sort field when withSortUri is provided with an array of valid uri', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSortUri(["my_field:desc:min", "my_field_foo:asc:max"]);

    var query = builder.build();
    should.exist(query.sort);
    query.sort[0].should.have.property('my_field');
    query.sort[0].my_field.order.should.equal('desc');
    query.sort[0].my_field.mode.should.equal('min');
    query.sort[1].should.have.property('my_field_foo');
    query.sort[1].my_field_foo.order.should.equal('asc');
    query.sort[1].my_field_foo.mode.should.equal('max');
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should successfully append a sort field when withSortUri is provided with a valid field and order but an invalid mode', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSortUri("my_field:desc:foo");

    var query = builder.build();
    should.exist(query.sort);
    query.sort[0].should.have.property('my_field');
    query.sort[0].my_field.order.should.equal('desc');
    query.sort[0].my_field.should.not.have.property('mode');
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should successfully append a sort field when withSortUri is provided with a valid field and mode but an invalid order', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSortUri("my_field:foo:max");

    var query = builder.build();
    should.exist(query.sort);
    query.sort[0].should.have.property('my_field');
    query.sort[0].my_field.mode.should.equal('max');
    query.sort[0].my_field.order.should.equal('desc');
    query.query.filtered.query.bool.must[0].match.should.have.property('my_field');

    done();
  });

  it('should not append a sort field when withSortUri is provided with an invalid uri', function (done) {
    builder.withMatch("my_field", "my_value");
    builder.withSortUri("");

    var query = builder.build();
    should.not.exist(query.sort);
    query.should.not.have.property('sort');

    done();
  });

  it('should successfully build a string query when provided with a valid array of fields and a query string', function (done) {
    builder.withQueryString([ "my_field_1", "my_field_2" ], "this AND that");

    var query = builder.build();
    should.exist(query.query.filtered.query.bool.must[0].query_string);

    done();
  });

  it('should successfully build a string query when provided with valid single field and a query string', function (done) {
    builder.withQueryString("my_field_1", "this AND that");

    var query = builder.build();

    should.exist(query.query.filtered.query.bool.must[0].query_string);

    done();
  });

  it('should successfully build a range query when provided with valid single field range properties', function (done) {
    builder.withRange("timestamp", { gte: "1970-01-01", lte: "1970-01-01" });

    var query = builder.build();

    should.exist(query.query.filtered.query.bool.must[0].range);

    done();
  });

  it('should create a more like this (MLT) query when called with no options', function (done) {
    builder.withMoreLikeThis(["my_field_1"], "my-id", {});

    var query = builder.build();

    should.exist(query.query.filtered.query.more_like_this);
    should.exist(query.query.filtered.query.more_like_this.fields);
    query.query.filtered.query.more_like_this.fields[0].should.equal("my_field_1");
    query.query.filtered.query.more_like_this.docs[0]._id.should.equal("my-id");
    query.query.filtered.query.more_like_this.min_term_freq.should.equal(3);
    query.query.filtered.query.more_like_this.minimum_should_match.should.equal("30%");

    done();
  });

  it('should create a more like this (MLT) query when called with customised options', function (done) {
    builder.withMoreLikeThis(["my_field_1", "my-field-2"], "my-id", { min_term_freq: 4, minimum_should_match: "90%" });

    var query = builder.build();

    should.exist(query.query.filtered.query.more_like_this);
    should.exist(query.query.filtered.query.more_like_this.fields);
    query.query.filtered.query.more_like_this.fields[0].should.equal("my_field_1");
    query.query.filtered.query.more_like_this.docs[0]._id.should.equal("my-id");
    query.query.filtered.query.more_like_this.min_term_freq.should.equal(4);
    query.query.filtered.query.more_like_this.minimum_should_match.should.equal("90%");

    done();
  });

  it('should automatically build a match_all query if no parameters are provided', function (done) {
    var query = builder.build();
    should.exist(query.query.filtered.query);

    done();
  });

  it('should override the from value when provided with a valid value', function (done) {
    builder.withFrom(10);

    var query = builder.build();
    query.from.should.equal(10);

    done();
  });

  it('should override the size value when provided with a valid value', function (done) {
    builder.withSize(100);

    var query = builder.build();
    query.size.should.equal(100);

    done();
  });
});
