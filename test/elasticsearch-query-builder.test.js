'use strict';

const should = require('chai').should();

const QueryBuilder = require('../');

describe('lib/elasticsearch-query-builder', function () {
  let builder;

  beforeEach(function(done) {
    builder = QueryBuilder.buildQuery();
    done();
  });

  afterEach(function(done) {
    done();
  });

  it('should automatically build a match_all query if no parameters are provided', function (done) {
    const q = builder.build();
    q.query.should.deep.equal({"bool": { "must": { "match_all": {}}}});

    done();
  });

  describe('withMatch()', function () {
    it('should successfully build a simple match query when provided with a simple field and value', function (done) {
      builder.withMatch("my_field", "my_value");

      const q = builder.build();

      should.exist(q.query.bool.must[0].match);
      q.query.bool.must[0].match.should.have.property('my_field');

      done();
    });

    it('should successfully build a multi-match query by converting a single "match" statement to a multiple "terms" statement', function (done) {
      builder.withMatch("my_field", [ "my_value_1", "my_value_2" ]);

      const q = builder.build();
      should.exist(q.query.bool.must[0].terms);
      should.not.exist(q.query.bool.must[0].match);
      q.query.bool.must[0].terms.should.have.property('my_field').with.lengthOf(2);

      done();
    });
  });

  describe('withMustMatch()', function () {
    it('should successfully build a bool, must, match query by building an array of match queries', function (done) {
      builder.withMustMatch("my_field", [ "my_value_1", "my_value_2" ]);

      const q = builder.build();

      should.exist(q.query.bool.must[0].match);
      should.exist(q.query.bool.must[1].match);

      q.query.bool.must[0].match.my_field.should.equal("my_value_1");
      q.query.bool.must[1].match.my_field.should.equal("my_value_2");

      done();
    });
  });

  describe('withTerms()', function () {
    it('should successfully build a terms query when provided with an array of required values for a field', function (done) {
      builder.withTerms("my_field", [ "my_value_1", "my_value_2" ]);

      const q = builder.build();

      should.exist(q.query.bool.must[0].terms);
      should.not.exist(q.query.bool.must[0].match);
      q.query.should.deep.equal({ "bool": { "must": [{ "terms": { "my_field": ["my_value_1", "my_value_2"] }}]}});

      done();
    });
  });

  describe('withSort()', function () {
    it('should successfully append a sort field when provided with a valid field and order', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSort("my_field", "desc");

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal({ "my_field": { "order": "desc" }});
      should.exist(q.query);
      q.query.should.deep.equal({ "bool": { "must": [{ "match": { "my_field": "my_value" }}]}});

      done();
    });

    it('should successfully append a sort field and override the order with a default when provided with a valid field and invalid order', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSort("my_field", "INVALID!!");

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal({ "my_field": { "order": "desc" }});
      should.exist(q.query);
      q.query.should.deep.equal({ "bool": { "must": [{ "match": { "my_field": "my_value" }}]}});

      done();
    });
  });

  describe('withSortUri', function () {
    it('should successfully append a sort field when withSortUri is provided with a valid field and order', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri("my_field:desc");

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "desc" }}]);
      should.exist(q.query);
      q.query.should.deep.equal({ "bool": { "must": [{ "match": { "my_field": "my_value" }}]}});

      done();
    });

    it('should successfully append a sort field when withSortUri is provided with a valid field', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri("my_field");

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "desc" }}]);
      should.exist(q.query);
      q.query.should.deep.equal({ "bool": { "must": [{ "match": { "my_field": "my_value" }}]}});

      done();
    });

    it('should successfully append a sort field when withSortUri is provided with a valid field with a suffixed colon(:)', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri("my_field:");

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "desc" }}]);
      should.exist(q.query);
      q.query.should.deep.equal({ "bool": { "must": [{ "match": { "my_field": "my_value" }}]}});

      done();
    });

    it('should successfully append a sort field when withSortUri is provided with a valid field, order and mode', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri("my_field:desc:min");

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "desc", "mode": "min" }}]);
      should.exist(q.query);
      q.query.should.deep.equal({ "bool": { "must": [{ "match": { "my_field": "my_value" }}]}});

      done();
    });

    it('should successfully append a sort field when withSortUri is provided with an array of valid uri', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri(["my_field:desc:min", "my_field_foo:asc:max"]);

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "desc", "mode": "min" }}, { "my_field_foo": { "order": "asc", "mode": "max" }}]);
      should.exist(q.query);
      q.query.should.deep.equal({ "bool": { "must": [{ "match": { "my_field": "my_value" }}]}});

      done();
    });

    it('should successfully append a sort field when withSortUri is provided with a valid field and order but an invalid mode', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri("my_field:desc:foo");

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "desc" }}]);
      should.exist(q.query);
      q.query.should.deep.equal({ "bool": { "must": [{ "match": { "my_field": "my_value" }}]}});

      done();
    });

    it('should successfully append a sort field when withSortUri is provided with a valid field and mode but an invalid order', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri("my_field:foo:max");

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "desc", "mode": "max" }}]);
      should.exist(q.query);
      q.query.should.deep.equal({ "bool": { "must": [{ "match": { "my_field": "my_value" }}]}});

      done();
    });
  });

  describe('withSortObject()', function () {
    it('should append a sort field when withSortObject is provided with a sorting object', function (done) {
      builder.withSortObject({_foo: {order: 'desc', nest: {value: 'some value'}}});

      const query = builder.build();
      query.sort.should.exist;
      query.should.deep.equal({"query":{"bool":{"must":{"match_all":{}}}},"sort":{"_foo":{"order":"desc","nest":{"value":"some value"}}}});
      done();
    });

    it('should append a sort field when withSortObject is provided with a sorting array', function (done) {
      builder.withSortObject([{postDate: {order: "asc"}}]);

      const query = builder.build();
      query.sort.should.exist;
      query.should.deep.equal({"query":{"bool":{"must":{"match_all":{}}}},"sort": [{postDate: {order: "asc"}}]});
      done();
    });

    it('should not append a sort field when withSortObject is provided with a non array or non object input (integer)', function (done) {
      builder.withSortObject(3);

      const query = builder.build();
      query.should.deep.equal({"query":{"bool":{"must":{"match_all":{}}}}});
      done();
    });

    it('should not append a sort field when withSortObject is provided with a non array or non object input (string)', function (done) {
      builder.withSortObject('foo');

      const query = builder.build();
      query.should.deep.equal({"query":{"bool":{"must":{"match_all":{}}}}});
      done();
    });

    it('should not append a sort field when withSortUri is provided with an invalid uri', function (done) {
      builder.withMatch("my_field", "my_value");

      const query = builder.build();
      should.not.exist(query.sort);
      query.should.not.have.property('sort');

      done();
    });
  });

  describe('withQueryString', function () {
    it('should successfully build a string query when provided with a valid array of fields and a query string', function (done) {
      builder.withQueryString([ "my_field_1", "my_field_2" ], "this AND that");

      const q = builder.build();
      should.exist(q.query.bool.must[0].query_string);

      done();
    });

    it('should successfully build a string query when provided with valid single field and a query string', function (done) {
      builder.withQueryString("my_field_1", "this AND that");

      const q = builder.build();

      should.exist(q.query.bool.must[0].query_string);

      done();
    });
  });

  describe('withShouldMatchQueryString', function () {
    it('should successfully build a should match query when provided with a valid array of fields, a query string and options', function (done) {
      builder.withShouldMatchQueryString([ "headline", "description_text" ], "corbyn AND fire", { boost: 100, use_dis_max: true });

      const q = builder.build();
      should.exist(q.query.bool.filter.bool.should[0].query_string);

      done();
    });
  });

  describe('withMatchQueryString()', function () {
    it('should successfully build a match query when provided with a valid array of fields, a query string and options', function (done) {
      builder.withMatchQueryString([ "headline", "description_text" ], "corbyn AND fire", { boost: 100, use_dis_max: true });

      const q = builder.build();
      should.exist(q.query.bool.must[0].query_string);

      done();
    });
  });

  describe('withRange()', function () {
    it('should successfully build a range query when provided with valid single field range properties', function (done) {
      builder.withRange("timestamp", { gte: "1970-01-01", lte: "1970-01-01" });

      const q = builder.build();

      should.exist(q.query.bool.must[0].range);

      done();
    });
  });

  describe('withMoreLikeThis()', function () {
    it('should create a more like this (MLT) query when called with no options', function (done) {
      builder.withMoreLikeThis(["my_field_1"], "my-id", {});

      const q = builder.build();

      should.exist(q.query.bool.must[0].more_like_this);
      should.exist(q.query.bool.must[0].more_like_this.fields);

      q.query.bool.must[0].more_like_this.fields[0].should.equal("my_field_1");
      q.query.bool.must[0].more_like_this.docs[0]._id.should.equal("my-id");
      q.query.bool.must[0].more_like_this.min_term_freq.should.equal(3);
      q.query.bool.must[0].more_like_this.minimum_should_match.should.equal("30%");

      done();
    });

    it('should create a more like this (MLT) query when called with customised options', function (done) {
      builder.withMoreLikeThis(["my_field_1", "my-field-2"], "my-id", { min_term_freq: 4, minimum_should_match: "90%" });

      const q = builder.build();

      should.exist(q.query.bool.must[0].more_like_this);
      should.exist(q.query.bool.must[0].more_like_this.fields);
      q.query.bool.must[0].more_like_this.fields[0].should.equal("my_field_1");
      q.query.bool.must[0].more_like_this.docs[0]._id.should.equal("my-id");
      q.query.bool.must[0].more_like_this.min_term_freq.should.equal(4);
      q.query.bool.must[0].more_like_this.minimum_should_match.should.equal("90%");

      done();
    });
  });

  describe('withFrom()', function () {
    it('should override the from value when provided with a valid value', function (done) {
      builder.withFrom(10);

      const q = builder.build();
      q.from.should.equal(10);

      done();
    });
  });

  describe('withSize()', function () {
    it('should override the size value when provided with a valid value', function (done) {
      builder.withSize(100);

      const q = builder.build();
      q.size.should.equal(100);

      done();
    });
  });

  describe('withMustFilter()', function () {
    it('should successfully apply a must filter when provided with a property and array value', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri("my_field:asc");
      builder.withMustFilter(
        "object.code", [
          "pacontent:paservice:news.story.composite",
          "pacontent:paservice:sport.story.composite"
        ]
      );

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "asc" }}]);

      should.exist(q.query.bool.must);
      q.query.bool.must.should.deep.equal([{ "match": { "my_field": "my_value" }}]);

      should.exist(q.query.bool.filter);
      q.query.bool.filter.bool.should.deep.equal({ "must": [{ "terms": { "object.code": [ "pacontent:paservice:news.story.composite", "pacontent:paservice:sport.story.composite" ] }}]});

      done();
    });
  });

  describe('withMustNotFilter()', function () {
    it('should successfully apply a must_not filter when provided with a property and array value', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri("my_field:asc");
      builder.withMustNotFilter(
        "object.code", [
          "pacontent:paservice:news.story.composite",
          "pacontent:paservice:sport.story.composite"
        ]
      );

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "asc" }}]);

      should.exist(q.query.bool.must);
      q.query.bool.must.should.deep.equal([{ "match": { "my_field": "my_value" }}]);

      should.exist(q.query.bool.filter);
      q.query.bool.filter.bool.should.deep.equal({ "must_not": [{ "terms": { "object.code": [ "pacontent:paservice:news.story.composite", "pacontent:paservice:sport.story.composite" ] }}]});

      done();
    });
  });

  describe('withShouldFilter()', function () {
    it('should successfully apply a should filter when provided with a property and array value', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withSortUri("my_field:asc");
      builder.withShouldFilter(
        "object.code", [
          "pacontent:paservice:news.story.composite",
          "pacontent:paservice:sport.story.composite"
        ]
      );

      const q = builder.build();

      should.exist(q.sort);
      q.sort.should.deep.equal([{ "my_field": { "order": "asc" }}]);

      should.exist(q.query.bool.must);
      q.query.bool.must.should.deep.equal([{ "match": { "my_field": "my_value" }}]);

      should.exist(q.query.bool.filter);
      q.query.bool.filter.should.deep.equal({ "bool": { "should": [{ "terms": { "object.code": [ "pacontent:paservice:news.story.composite", "pacontent:paservice:sport.story.composite" ] }}]}});

      done();
    });
  });

  describe('withFieldExist()', function () {
    it('should successfully apply a should filter when provided with a property and array value', function (done) {
      builder.withMatch("my_field", "my_value");
      builder.withFieldExist("my_field");

      const q = builder.build();

      should.exist(q.query.bool.must);
      q.query.bool.must.should.deep.equal([{ "match": { "my_field": "my_value" }}]);

      should.exist(q.query.bool.filter.bool.must);
      q.query.bool.filter.bool.must.should.deep.equal([ { "exists": { "field": "my_field" }}]);

      done();
    });
  });

  describe('withField()', function () {
    it('should successfully apply _source field when withField() is provided with a valid input', function (done) {
      builder.withField("_source", {"enabled": false});

      const q = builder.build();

      should.exist(q._source);
      q._source.should.deep.equal({"enabled": false});

      done();
    });

    it('should not apply a field when withField() is provided with an invalid field input (null)', function (done) {
      builder.withField(null, {"foo": false});

      const q = builder.build();

      q.should.deep.equal({"query": {"bool": {"must": {"match_all": {}}}}});

      done();
    });

    it('should not apply a field when withField() is provided with an invalid field input (object)', function (done) {
      builder.withField({}, {"foo": false});

      const q = builder.build();

      q.should.deep.equal({"query": {"bool": {"must": {"match_all": {}}}}});

      done();
    });
  });
});
