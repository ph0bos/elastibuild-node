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

    if(this.q.query.match_all){
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
   * Add a field to the query.
   *
   * @param field
   * @param value
   */
  withField(field, value) {
    if (!field || field instanceof Object) return;

    this.q[field] = value;
  }

  /**
   *
   * @param field
   */
  withFieldExist(field) {
    this._buildBoolMustFilter();
    this._buildBoolShouldFilter();

    if (Array.isArray(field)) {
      field.forEach((f) => {
        this.q.query.bool.filter.bool.should.push({ exists: { field: f }});
      });
    } else {
      this.q.query.bool.filter.bool.must.push({ exists: { field: field }});
    }
  }

  /**
   * Values for search after functionality for next page fetching.
   *
   * @param values
   */
  withSearchAfter(values) {
    if (!values) return;

    if (!Array.isArray(values)) {
      this.q.search_after = [values];
    } else {
      this.q.search_after = values;
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

    if (!Array.isArray(sortUris)) {
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
    this.q.query.bool.must.push(QueryBuilder._buildSubQuery(field, values, { subQueryType: 'range' }));
  }

  /**
   *
   * @param field
   * @param values
   * @param options
   */
  withShouldFilter(field, values, options) {
    this._buildBoolShouldFilter();

    if (Array.isArray(field)) {
      field.forEach((f) => {
        this.q.query.bool.filter.bool.should.push(QueryBuilder._buildSubQuery(f, values, options));
      });
    } else {
      this.q.query.bool.filter.bool.should.push(QueryBuilder._buildSubQuery(field, values, options));
    }
  }

  /**
   *
   * @param field
   * @param values
   * @param options
   */
  withMustFilter(field, values, options) {
    this._buildBoolMustFilter();

    if (Array.isArray(field)) {
      field.forEach((f) => {
        this.q.query.bool.filter.bool.must.push(QueryBuilder._buildSubQuery(f, values, options));
      });
    } else {
      this.q.query.bool.filter.bool.must.push(QueryBuilder._buildSubQuery(field, values, options));
    }
  }

  /**
   *
   * @param partialQueryObject
   */
  withMustFilterObject(partialQueryObject) {
    this._buildBoolMustFilter();

    if (!partialQueryObject) {
      return;
    }

    this.q.query.bool.filter.bool.must.push(partialQueryObject);
  }

  /**
   *
   * @param field
   * @param values
   * @param options
   */
  withMustNotFilter(field, values, options) {
    this._buildBoolMustNotFilter();
    this.q.query.bool.filter.bool.must_not.push(QueryBuilder._buildSubQuery(field, values, options));
  }

  /**
   *
   * @param field
   * @param values
   * @param options
   */
  withMatch(field, values, options) {
    this._buildBoolMust();
    this.q.query.bool.must.push(QueryBuilder._buildSubQuery(field, values, options));
  }

  /**
   * Simple match all query.
   *
   * @param value
   */
  withMatchAll(value) {
    if(!value) return;
    this.q.query.match_all = value;
  }

  /**
   *
   * @param field
   * @param values
   * @param options
   */
  withNotMatch(field, values, options) {
    this._buildBoolMustNot();
    this.q.query.bool.must_not.push(QueryBuilder._buildSubQuery(field, values, options));
  }

  /**
   *
   * @param field
   * @param values
   * @param options
   */
  withMustMatch(field, values, options) {
    this._buildBoolMust();

    if (Array.isArray(values)) {
      values.forEach((v) => {
        this.q.query.bool.must.push(QueryBuilder._buildSubQuery(field, v, options));
      });
    } else {
      this.q.query.bool.must.push(QueryBuilder._buildSubQuery(field, values, options));
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
    this.q.query.bool.filter.bool.should.push(QueryBuilder._buildGeoPointDistanceSubQuery(fields, lat, lon, distance));
  }

  /**
   * Method to build a geo_shape circle query with a default 'intersects' relation.
   *
   * @param fields   the fields to search on
   * @param lat      the latitude of the location
   * @param long     the longitude of the location
   * @param radius   the radius of the circle
   * @param relation the relation of the query, defaulting to 'intersects', could also be 'contains', 'within' or 'disjoint'
   */
  withGeoCircle(fields, lat, long, radius, relation = 'intersects') {
    this._buildBoolShouldFilter();
    const should = this.q.query.bool.filter.bool.should;
    should.push(...QueryBuilder._buildGeoShapeCircleSubQuery(fields, lat, long, radius, relation));
  }

  /**
   * Method to build a geo_shape point query for items containing the provided location.
   *
   * @param fields the fields to search on
   * @param lat    the latitude of the location
   * @param long   the longitude of the location
   */
  withGeoLocation(fields, lat, long) {
    this._buildBoolShouldFilter();
    const should = this.q.query.bool.filter.bool.should;
    should.push(...QueryBuilder._buildGeoShapePointSubQuery(fields, lat, long));
  }

  /**
   *
   * @param fields
   * @param lat
   * @param lon
   * @param distance
   */
  withMustGeoDistance(fields, lat, lon, distance) {
    this._buildBoolMustFilter();
    this.q.query.bool.filter.bool.must.push(QueryBuilder._buildGeoPointDistanceSubQuery(fields, lat, lon, distance));
  }

  /**
   * Method to build a geo_shape circle query with a default 'intersects' relation.
   *
   * @param fields   the fields to search on
   * @param lat      the latitude of the location
   * @param long     the longitude of the location
   * @param radius   the radius of the circle
   * @param relation the relation of the query, defaulting to 'intersects', could also be 'contains', 'within' or 'disjoint'
   */
  withMustGeoCircle(fields, lat, long, radius, relation = 'intersects') {
    this._buildBoolMustFilter();
    const must = this.q.query.bool.filter.bool.must;
    must.push(...QueryBuilder._buildGeoShapeCircleSubQuery(fields, lat, long, radius, relation));
  }

  /**
   * Method to build a geo_shape point query for items containing the provided location.
   *
   * @param fields the fields to search on
   * @param lat    the latitude of the location
   * @param long   the longitude of the location
   */
  withMustGeoLocation(fields, lat, long) {
    this._buildBoolMustFilter();
    const must = this.q.query.bool.filter.bool.must;
    must.push(...QueryBuilder._buildGeoShapePointSubQuery(fields, lat, long));
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
      like: [ { _index: options._index, _id: id } ]
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

    if (!this.q.query.bool.filter.bool.should || !Array.isArray(this.q.query.bool.filter.bool.should)) {
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

    if (!this.q.query.bool.filter.bool.must_not || !Array.isArray(this.q.query.bool.filter.bool.must_not)) {
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

    if (!this.q.query.bool.filter.bool.must || !Array.isArray(this.q.query.bool.filter.bool.must)) {
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

    if (!this.q.query.bool.should || !Array.isArray(this.q.query.bool.should)) {
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

    if (!this.q.query.bool.must_not || !Array.isArray(this.q.query.bool.must_not)) {
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

    if (options.default_operator) {
      query.query_string.default_operator = options.default_operator;
    }

    if (options.type) {
      query.query_string.type = options.type;
    }

    return query;
  }

  /**
   *
   * @param fields the fields to query
   * @param lat the latitude of the circle centre
   * @param long the longitude of the circle centre
   * @param radius the circle radius
   * @param relation the geo relation e.g. 'intersects', 'contains', 'within', 'disjoint'
   * @returns {Array} of geo_shape queries
   * @private
   */
  static _buildGeoShapeCircleSubQuery(fields, lat, long, radius, relation) {
    if (!Array.isArray(fields)) {
      fields = [ fields ];
    }

    const subQuery = [];

    const circleQuery = {
      relation: relation,
      shape: {
        type: 'circle',
        coordinates: [long, lat],
        radius: radius
      }
    };

    fields.forEach((field) => {
      const q = {geo_shape: {}};
      q.geo_shape[field] = circleQuery;
      subQuery.push(q);
    });

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
  static _buildGeoPointDistanceSubQuery(fields, lat, lon, distance = DEFAULT_GEO_DISTANCE_KM) {
    if (!Array.isArray(fields)) {
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
   * @param fields the fields to query
   * @param lat the latitude of the circle centre
   * @param long the longitude of the circle centre
   * @returns {Array} of geo_shape queries
   * @private
   */
  static _buildGeoShapePointSubQuery(fields, lat, long) {
    if (!Array.isArray(fields)) {
      fields = [ fields ];
    }

    const subQuery = [];

    const pointQuery = {
      relation: 'contains',
      shape: {
        type: 'point',
        coordinates: [long, lat]
      }
    };

    fields.forEach((field) => {
      const q = {geo_shape: {}};
      q.geo_shape[field] = pointQuery;
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
    const type = options.subQueryType ? options.subQueryType : (Array.isArray(value)) ? "terms" : "match";

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
  static _buildSubQuery(field, value, options = {}) {
    const type = options.subQueryType ? options.subQueryType : (Array.isArray(value)) ? "terms" : "match";

    const subQuery        = {};
    subQuery[type]        = {};
    subQuery[type][field] = value;

    return subQuery;
  }
}

module.exports = new QueryBuilder();
