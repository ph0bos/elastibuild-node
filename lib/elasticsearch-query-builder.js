'use strict';

var util = require('util');

var DEFAULT_SORT              = 'desc';
var DEFAULT_QUERY             = { "filtered": { "query": { "match_all": {} } } };
var DEFAULT_MIN_TERM_FREQ     = 3;
var DEFAULT_MIN_DOC_FREQ      = 1;
var DEFAULT_MAX_TERM_FREQ     = 12;
var DEFAULT_MIN_SHOULD_MATCH  = '30%';
var DEFAULT_GEO_DISTANCE_UNIT = 'km';
var DEFAULT_GEO_DISTANCE_KM   = 30;
var SORT_ORDER_ENUM           = [ 'asc', 'desc' ];
var SORT_MODE_ENUM            = [ 'min', 'max', 'sum', 'avg' ];

function QueryBuilder() {
  this.query = { query: { filtered: { query: {}, filter: {} } } };
}

var queryBuilder = module.exports = new QueryBuilder();

QueryBuilder.prototype.buildQuery = function() {
  return new QueryBuilder();
};

QueryBuilder.prototype.withFrom = function(fromVal) {
  this.query.from = fromVal;
};

QueryBuilder.prototype.withSize = function(sizeVal) {
  this.query.size = sizeVal;
};

QueryBuilder.prototype.withMinScore = function(minScore) {
  this.query.min_score = minScore;
};

QueryBuilder.prototype.withMatch = function(field, values) {
  this._buildBoolMust();
  this.query.query.filtered.query.bool.must.push(this._buildSubQuery(field, values));
};

QueryBuilder.prototype.withGeoDistance = function(fields, lat, lon, distance) {
  this._buildBoolShouldFilter();
  this.query.query.filtered.filter.bool.should.push(this._buildGeoDistanceSubQuery(fields, lat, lon, distance));
};

QueryBuilder.prototype.withNotMatch = function(field, values) {
  this._buildBoolMustNot();
  this.query.query.filtered.query.bool.must_not.push(this._buildSubQuery(field, values));
};

QueryBuilder.prototype.withMustMatch = function(field, values, options) {
  this._buildBoolMust();
  this.query.query.filtered.query.bool.must.push(this._buildComplexSubQuery(field, values, options));
};

QueryBuilder.prototype.withShouldMatch = function(field, values, options) {
  this._buildBoolShould();
  this.query.query.filtered.query.bool.should.push(this._buildComplexSubQuery(field, values, options));
};

QueryBuilder.prototype.withTerms = function(field, values) {
  this._buildBoolMust();
  this.query.query.filtered.query.bool.must.push(this._buildSubQuery(field, values));
};

QueryBuilder.prototype.withQueryString = function(fields, queryString, options) {
  this._buildBoolMust();
  this.query.query.filtered.query.bool.must.push(this._buildQueryStringQuery(fields, queryString, options));
};

QueryBuilder.prototype.withMatchQueryString = function(fields, queryString, options) {
  this._buildBoolMust();
  this.query.query.filtered.query.bool.must.push(this._buildQueryStringQuery(fields, queryString, options));
};

QueryBuilder.prototype.withShouldMatchQueryString = function(fields, queryString, options) {
  this._buildBoolShould();
  this.query.query.filtered.query.bool.should.push(this._buildQueryStringQuery(fields, queryString, options));
};

QueryBuilder.prototype.withMustFilter = function(field, values) {
  this._buildBoolMustFilter();

  var self = this;

  if (util.isArray(field)) {
    field.forEach(function(f) {
      self.query.query.filtered.filter.bool.must.push(self._buildSubQuery(f, values));
    });
  } else {
    self.query.query.filtered.filter.bool.must.push(self._buildSubQuery(field, values));
  }
};

QueryBuilder.prototype.withMustNotFilter = function(field, values) {
  this._buildBoolMustNotFilter();
  this.query.query.filtered.filter.bool.must_not.push(this._buildSubQuery(field, values));
};

QueryBuilder.prototype.withShouldFilter = function(field, values) {
  this._buildBoolShouldFilter();

  var self = this;


  if (util.isArray(field)) {
    field.forEach(function(f) {
      self.query.query.filtered.filter.bool.should.push(self._buildSubQuery(f, values));
    });
  } else {
    self.query.query.filtered.filter.bool.should.push(self._buildSubQuery(field, values));
  }
};

QueryBuilder.prototype.withRange = function(field, values) {
  this._buildBoolMust();
  this.query.query.filtered.query.bool.must.push(this._buildRangeSubQuery(field, values));
};

/**
 * URI Based Sorting (field:order:mode)
 */
QueryBuilder.prototype.withSortUri = function(sortUris) {
  if (!sortUris) return;

  var self = this;

  self.query.sort = [];

  if (!util.isArray(sortUris)) {
    sortUris = [sortUris];
  }

  sortUris.forEach(function(sortUri) {
    var parts = sortUri.split(':');

    var field = parts[0];
    var order = parts[1];
    var mode  = parts[2];

    if (!field) return;

    if (SORT_ORDER_ENUM.indexOf(order) === -1) {
      order = DEFAULT_SORT;
    }

    if (mode && SORT_MODE_ENUM.indexOf(mode) === -1) {
      mode = null;
    }

    var sort                    = {};
    sort[field]                 = {};
    if (sort) sort[field].order = order;
    if (mode) sort[field].mode  = mode;

    self.query.sort.push(sort);
  });
};

/**
 * Simple property/direction sort
 */
QueryBuilder.prototype.withSort = function(field, order) {
  if (!field) return;

  if (SORT_ORDER_ENUM.indexOf(order) === -1) {
    order = DEFAULT_SORT;
  }

  this.query.sort        = {};
  this.query.sort[field] = { order: order };
};

/**
 * Simple property/direction sort
 */
QueryBuilder.prototype.withSort = function(field, order) {
  if (!field) return;

  if (SORT_ORDER_ENUM.indexOf(order) === -1) {
    order = DEFAULT_SORT;
  }

  this.query.sort        = {};
  this.query.sort[field] = { order: order };
};

QueryBuilder.prototype.withFieldExist = function(field, options) {
  var self = this;

  this._buildBoolMustFilter();
  this._buildBoolShouldFilter();

  if (util.isArray(field)) {
    field.forEach(function(f) {
      self.query.query.filtered.filter.bool.should.push({ exists: { field: f }});
    });
  } else {
    self.query.query.filtered.filter.bool.must.push({ exists: { field: field }});
  }
};

QueryBuilder.prototype.build = function() {
  if (this.query.query.filtered.query.more_like_this) {
    return this.query;
  }

  if (!this.query.query.filtered.query.bool) {
    var filters = this.query.query.filtered.filter;
    this.query.query = DEFAULT_QUERY;
    this.query.query.filtered.filter = filters;
  }

  return this.query;
};

/**
 * Build a "More Like This" Query
 */
QueryBuilder.prototype.withMoreLikeThis = function(fields, id, options) {
  this.query.query.filtered.query.more_like_this = {};
  this.query.query.filtered.query.more_like_this.fields = fields;
  this.query.query.filtered.query.more_like_this.min_term_freq = options.min_term_freq || DEFAULT_MIN_TERM_FREQ;
  this.query.query.filtered.query.more_like_this.max_query_terms = options.max_query_terms || DEFAULT_MAX_TERM_FREQ;
  this.query.query.filtered.query.more_like_this.minimum_should_match = options.minimum_should_match || DEFAULT_MIN_SHOULD_MATCH;
  this.query.query.filtered.query.more_like_this.min_doc_freq = options.min_doc_freq || DEFAULT_MIN_DOC_FREQ;
  this.query.query.filtered.query.more_like_this.docs = [ { _index: options._index, _type: options._type, _id: id } ];
};

/**
 *
 */
QueryBuilder.prototype._buildBoolMust = function() {
  if (!this.query.query.filtered.query.bool) {
    this.query.query.filtered.query.bool = {};
  }

  if (!this.query.query.filtered.query.bool.must) {
    this.query.query.filtered.query.bool.must = [];
  }
};

/**
 *
 */
QueryBuilder.prototype._buildBoolShould = function() {
  if (!this.query.query.filtered.query.bool) {
    this.query.query.filtered.query.bool = {};
  }

  if (!this.query.query.filtered.query.bool.should) {
    this.query.query.filtered.query.bool.should = [];
  }
};

/**
 *
 */
QueryBuilder.prototype._buildBoolMustNot = function() {
  if (!this.query.query.filtered.query.bool) {
    this.query.query.filtered.query.bool = {};
  }

  if (!this.query.query.filtered.query.bool.must_not) {
    this.query.query.filtered.query.bool.must_not = [];
  }
};

/**
 *
 */
QueryBuilder.prototype._buildBoolMustFilter = function() {
  if (!this.query.query.filtered.filter.bool) {
    this.query.query.filtered.filter.bool = {};
  }

  if (!this.query.query.filtered.filter.bool.must || !util.isArray(this.query.query.filtered.filter.bool.must)) {
    this.query.query.filtered.filter.bool.must = [];
  }
};

/**
 *
 */
QueryBuilder.prototype._buildBoolMustNotFilter = function() {
  if (!this.query.query.filtered.filter.bool) {
    this.query.query.filtered.filter.bool = {};
  }

  if (!this.query.query.filtered.filter.bool.must_not || !util.isArray(this.query.query.filtered.filter.bool.must_not)) {
    this.query.query.filtered.filter.bool.must_not = [];
  }
};

/**
 *
 */
QueryBuilder.prototype._buildBoolShouldFilter = function() {
  if (!this.query.query.filtered.filter.bool) {
    this.query.query.filtered.filter.bool = {};
  }

  if (!this.query.query.filtered.filter.bool.should || !util.isArray(this.query.query.filtered.filter.bool.should)) {
    this.query.query.filtered.filter.bool.should = [];
  }
};

/**
 *
 */
QueryBuilder.prototype._buildFilter = function() {
  if (!this.query.query.filtered.filter) {
    this.query.query.filtered.filter = [];
  }
};

/**
 *
 * @param field
 * @param value
 * @param options
 * @returns {{}}
 * @private
 */
QueryBuilder.prototype._buildSubQuery = function(field, value) {
  var type = (util.isArray(value)) ? "terms" : "match";

  var subQuery          = {};
  subQuery[type]        = {};
  subQuery[type][field] = value;

  return subQuery;
};

/**
 *
 * @param field
 * @param value
 * @param options
 * @returns {{}}
 * @private
 */
QueryBuilder.prototype._buildComplexSubQuery = function(field, value, options) {
  options  = options || {};
  var type = (util.isArray(value)) ? "terms" : "match";

  var subQuery                = {};
  subQuery[type]              = {};
  subQuery[type][field]       = {};
  subQuery[type][field].query = value;

  if (options.boost) {
    subQuery[type][field].boost = options.boost;
  }

  if (options.operator) {
    subQuery[type][field].operator = options.operator;
  }

  return subQuery;
};

/**
 *
 */
QueryBuilder.prototype._buildGeoDistanceSubQuery = function(fields, lat, lon, distance) {
  var queryDistance = distance || DEFAULT_GEO_DISTANCE_KM;

  if (!util.isArray(fields)) {
    fields = [ fields ];
  }

  var subQuery                     = [];

  fields.forEach(function (field) {
    var q = { geo_distance: { distance: `${queryDistance}${DEFAULT_GEO_DISTANCE_UNIT}` } };
    q.geo_distance[field] = { lat: lat, lon: lon };
    subQuery.push(q);
  });

  return subQuery;
};

/**
 * { "range": { "versioncreated": { "gte": "2015-11-26", "lte": "2015-11-26" } }
 */
QueryBuilder.prototype._buildRangeSubQuery = function(field, properties) {
  var type              = 'range';
  var subQuery          = {};
  subQuery[type]        = {};
  subQuery[type][field] = properties;

  return subQuery;
};

/**
 * { "query_string": { "fields": fields, "query": queryString, "use_dis_max" : true }
 */
QueryBuilder.prototype._buildQueryStringQuery = function(fields, queryString, options) {
  options = options || {};
  var type = (util.isArray(fields)) ? fields : [].push(fields);

  var stringQuery                      = { "query_string": {} };
  stringQuery.query_string.fields      = fields;
  stringQuery.query_string.query       = queryString;

  if (options.use_dis_max) {
    stringQuery.query_string.use_dis_max = true;
  }

  if (options.auto_generate_phrase_queries) {
    stringQuery.query_string.auto_generate_phrase_queries = true;
  }

  if (options.boost) {
    stringQuery.query_string.boost = options.boost;
  }

  return stringQuery;
};
