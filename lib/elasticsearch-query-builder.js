'use strict';

const util = require('util');

const DEFAULT_SORT              = 'desc';
const DEFAULT_QUERY             = {"bool": { "must": { "match_all": {}}}};
const DEFAULT_MIN_TERM_FREQ     = 3;
const DEFAULT_MIN_DOC_FREQ      = 1;
const DEFAULT_MAX_TERM_FREQ     = 12;
const DEFAULT_MIN_SHOULD_MATCH  = '30%';
const DEFAULT_GEO_DISTANCE_UNIT = 'km';
const DEFAULT_GEO_DISTANCE_KM   = 30;
const SORT_ORDER_ENUM           = ['asc', 'desc'];
const SORT_MODE_ENUM            = ['min', 'max', 'sum', 'avg'];

/**
 *
 */
class QueryBuilder {
  constructor() {
    this.q = {query: {}};
  }

  /**
   *
   * @returns {QueryBuilder}
   */
  buildQuery() {
    return new QueryBuilder();
  }

  /**
   *
   * @returns {{query: {}}|*}
   */
  build() {
    if (this.q.query.more_like_this) {
      return this.q;
    }

    if (!this.q.query.bool) {
      const filters = this.q.query.filter;
      this.q.query  = DEFAULT_QUERY;

      if (this.q.query.filter) {
        this.q.query.filter = filters;
      }
    }

    return this.q;
  }

  /**
   *
   * @param from
   */
  withFrom(from) {
    this.q.from = from;
  }

  /**
   *
   * @param size
   */
  withSize(size) {
    this.q.size = size;
  }

  /**
   *
   * @param minScore
   */
  withMinScore(minScore) {
    this.q.min_score = minScore;
  }

  /**
   *
   * @param field
   * @param options
   */
  withFieldExist(field, options = {}) {
    this._buildBoolMustFilter();
    this._buildBoolShouldFilter();

    if (util.isArray(field)) {
      field.forEach((f) => {
        this.q.query.bool.filter.bool.should.push({ exists: { field: f }});
      });
    } else {
      this.q.query.bool.filter.bool.must.push({ exists: { field: field }});
    }
  }

  /**
   * Simple property/direction sort.
   *
   * @param field
   * @param order
   */
  withSort(field, order) {
    if (!field) return;

    if (SORT_ORDER_ENUM.indexOf(order) === -1) {
      order = DEFAULT_SORT;
    }

    this.q.sort        = {};
    this.q.sort[field] = { order: order };
  }

  /**
   * URI Based Sorting (field:order:mode).
   *
   * @param sortUris
   */
  withSortUri(sortUris) {
    if (!sortUris) return;

    this.q.sort = [];

    if (!util.isArray(sortUris)) {
      sortUris = [sortUris];
    }

    sortUris.forEach((sortUri) => {
      const parts = sortUri.split(':');

      const field = parts[0];
      let order   = parts[1];
      let mode    = parts[2];

      if (!field) return;

      if (SORT_ORDER_ENUM.indexOf(order) === -1) {
        order = DEFAULT_SORT;
      }

      if (mode && SORT_MODE_ENUM.indexOf(mode) === -1) {
        mode = null;
      }

      const sort                  = {};
      sort[field]                 = {};
      if (sort) sort[field].order = order;
      if (mode) sort[field].mode  = mode;

      this.q.sort.push(sort);
    });
  }

  /**
   * Complex sorting.
   *
   * @param sortObject
   */
  withSortObject(sortObject) {
    if (!sortObject) return;

    if(sortObject instanceof Array || sortObject instanceof Object){
      this.q.sort = sortObject;
    }
  }

  /**
   *
   * @param field
   * @param values
   */
  withRange(field, values) {
    this._buildBoolMust();
    this.q.query.bool.must.push(QueryBuilder._buildRangeSubQuery(field, values));
  }

  /**
   *
   * @param field
   * @param values
   */
  withShouldFilter(field, values) {
    this._buildBoolShouldFilter();

    if (util.isArray(field)) {
      field.forEach((f) => {
        this.q.query.bool.filter.bool.should.push(QueryBuilder._buildSubQuery(f, values));
      });
    } else {
      this.q.query.bool.filter.bool.should.push(QueryBuilder._buildSubQuery(field, values));
    }
  }

  /**
   *
   * @param field
   * @param values
   */
  withMustFilter(field, values) {
    this._buildBoolMustFilter();

    if (util.isArray(field)) {
      field.forEach((f) => {
        this.q.query.bool.filter.bool.must.push(QueryBuilder._buildSubQuery(f, values));
      });
    } else {
      this.q.query.bool.filter.bool.must.push(QueryBuilder._buildSubQuery(field, values));
    }
  }

  /**
   *
   * @param field
   * @param values
   */
  withMustNotFilter(field, values) {
    this._buildBoolMustNotFilter();
    this.q.query.bool.filter.bool.must_not.push(QueryBuilder._buildSubQuery(field, values));
  }

  /**
   *
   * @param field
   * @param values
   */
  withMatch(field, values) {
    this._buildBoolMust();
    this.q.query.bool.must.push(QueryBuilder._buildSubQuery(field, values));
  }

  /**
   *
   * @param field
   * @param values
   */
  withNotMatch(field, values) {
    this._buildBoolMustNot();
    this.q.query.bool.must_not.push(QueryBuilder._buildSubQuery(field, values));
  }

  /**
   *
   * @param field
   * @param values
   */
  withMustMatch(field, values) {
    this._buildBoolMust();

    if (util.isArray(values)) {
      values.forEach((v) => {
        this.q.query.bool.must.push(QueryBuilder._buildSubQuery(field, v));
      });
    } else {
      this.q.query.bool.must.push(QueryBuilder._buildSubQuery(field, values));
    }
  }

  /**
   *
   * @param field
   * @param values
   * @param options
   */
  withShouldMatch(field, values, options) {
    this._buildBoolShould();
    this.q.query.bool.should.push(QueryBuilder._buildComplexSubQuery(field, values, options));
  }

  /**
   *
   * @param field
   * @param values
   */
  withTerms(field, values) {
    this._buildBoolMust();
    this.q.query.bool.must.push(QueryBuilder._buildSubQuery(field, values));
  }

  /**
   *
   * @param fields
   * @param queryString
   * @param options
   */
  withQueryString(fields, queryString, options) {
    this._buildBoolMust();
    this.q.query.bool.must.push(QueryBuilder._buildQueryStringQuery(fields, queryString, options));
  };

  /**
   *
   * @param fields
   * @param queryString
   * @param options
   */
  withMatchQueryString(fields, queryString, options) {
    this._buildBoolMust();
    this.q.query.bool.must.push(QueryBuilder._buildQueryStringQuery(fields, queryString, options));
  }

  /**
   *
   * @param fields
   * @param queryString
   * @param options
   */
  withShouldMatchQueryString(fields, queryString, options) {
    this._buildBoolShouldFilter();
    this.q.query.bool.filter.bool.should.push(QueryBuilder._buildQueryStringQuery(fields, queryString, options));
  }

  /**
   *
   * @param fields
   * @param lat
   * @param lon
   * @param distance
   */
  withGeoDistance(fields, lat, lon, distance) {
    this._buildBoolShouldFilter();
    this.q.query.bool.filter.bool.should.push(this._buildGeoDistanceSubQuery(fields, lat, lon, distance));
  }

  /**
   *
   * @param fields
   * @param id
   * @param options
   */
  withMoreLikeThis(fields, id, options) {
    if (!fields || !id) {
      return;
    }

    this._buildBoolMust();

    const moreLikeThisQuery = {
      fields: fields,
      min_term_freq: options.min_term_freq || DEFAULT_MIN_TERM_FREQ,
      max_query_terms: options.max_query_terms || DEFAULT_MAX_TERM_FREQ,
      minimum_should_match: options.minimum_should_match || DEFAULT_MIN_SHOULD_MATCH,
      min_doc_freq: options.min_doc_freq || DEFAULT_MIN_DOC_FREQ,
      docs: [ { _index: options._index, _type: options._type, _id: id } ]
    }

    this.q.query.bool.must.push({ more_like_this: moreLikeThisQuery });
  }

  /**
   * TODO: Rename?
   *
   * @private
   */
  _buildBoolShouldFilter() {
    if (!this.q.query.bool) {
      this.q.query.bool = {};
    }

    if (!this.q.query.bool.filter) {
      this.q.query.bool.filter = {};
    }

    if (!this.q.query.bool.filter.bool) {
      this.q.query.bool.filter.bool = {};
    }

    if (!this.q.query.bool.filter.bool.should || !util.isArray(this.q.query.bool.filter.bool.should)) {
      this.q.query.bool.filter.bool.should = [];
    }
  }

  /**
   * TODO: Rename?
   *
   * @private
   */
  _buildBoolMustNotFilter() {
    if (!this.q.query.bool) {
      this.q.query.bool = {};
    }

    if (!this.q.query.bool.filter) {
      this.q.query.bool.filter = {};
    }

    if (!this.q.query.bool.filter.bool) {
      this.q.query.bool.filter.bool = {};
    }

    if (!this.q.query.bool.filter.bool.must_not || !util.isArray(this.q.query.bool.filter.bool.must_not)) {
      this.q.query.bool.filter.bool.must_not = [];
    }
  }

  /**
   * TODO: Rename?
   *
   * @private
   */
  _buildBoolMustFilter() {
    if (!this.q.query.bool) {
      this.q.query.bool = {};
    }

    if (!this.q.query.bool.filter) {
      this.q.query.bool.filter = {};
    }

    if (!this.q.query.bool.filter.bool) {
      this.q.query.bool.filter.bool = {};
    }

    if (!this.q.query.bool.filter.bool.must || !util.isArray(this.q.query.bool.filter.bool.must)) {
      this.q.query.bool.filter.bool.must = [];
    }
  }

  /**
   * TODO: Rename?
   *
   * @private
   */
  _buildBoolShould() {
    if (!this.q.query.bool) {
      this.q.query.bool = {};
    }

    if (!this.q.query.bool.should || !util.isArray(this.q.query.bool.should)) {
      this.q.query.bool.should = [];
    }
  }

  /**
   * TODO: Rename?
   *
   * @private
   */
  _buildBoolMust() {
    if (!this.q.query.bool) {
      this.q.query.bool = {};
    }

    if (!this.q.query.bool.must) {
      this.q.query.bool.must = [];
    }
  }


  /**
   * TODO: Rename?
   *
   * @private
   */
  _buildBoolMustNot() {
    if (!this.q.query.bool) {
      this.q.query.bool = {};
    }

    if (!this.q.query.bool.must_not || !util.isArray(this.q.query.bool.must_not)) {
      this.q.query.bool.must_not = [];
    }
  }

  /**
   *
   * @param fields
   * @param queryString
   * @param options
   * @returns {{query_string: {}}}
   * @private
   */
  static _buildQueryStringQuery(fields, queryString, options = {}) {
    const query               = { "query_string": {} };
    query.query_string.fields = fields;
    query.query_string.query  = queryString;

    if (options.use_dis_max) {
      query.query_string.use_dis_max = true;
    }

    if (options.auto_generate_phrase_queries) {
      query.query_string.auto_generate_phrase_queries = true;
    }

    if (options.boost) {
      query.query_string.boost = options.boost;
    }

    return query;
  }

  /**
   *
   * @param field
   * @param properties
   * @returns {{}}
   * @private
   */
  static _buildRangeSubQuery(field, properties) {
    const type            = 'range';
    const subQuery        = {};
    subQuery[type]        = {};
    subQuery[type][field] = properties;

    return subQuery;
  }

  /**
   *
   * @param fields
   * @param lat
   * @param lon
   * @param distance
   * @returns {Array}
   * @private
   */
  static _buildGeoDistanceSubQuery(fields, lat, lon, distance = DEFAULT_GEO_DISTANCE_KM) {
    if (!util.isArray(fields)) {
      fields = [ fields ];
    }

    const subQuery = [];

    fields.forEach((field) => {
      const q = { geo_distance: { distance: `${distance}${DEFAULT_GEO_DISTANCE_UNIT}` } };
      q.geo_distance[field] = { lat: lat, lon: lon };
      subQuery.push(q);
    });

    return subQuery;
  }

  /**
   *
   * @param field
   * @param value
   * @param options
   * @returns {{}}
   * @private
   */
  static _buildComplexSubQuery(field, value, options = {}) {
    const type = (util.isArray(value)) ? "terms" : "match";

    const subQuery              = {};
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
  }

  /**
   *
   * @param field
   * @param value
   * @returns {{}}
   * @private
   */
  static _buildSubQuery(field, value) {
    const type = (util.isArray(value)) ? "terms" : "match";

    const subQuery        = {};
    subQuery[type]        = {};
    subQuery[type][field] = value;

    return subQuery;
  }
}

module.exports = new QueryBuilder();
