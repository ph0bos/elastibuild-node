# Elastibuild

Elastibuild, a fluent builder for creating ElasticSearch compatible query JSON.


## Compatibility

* Targets Node 6.x and above.
* All constructed queries are compatible with Elasticsearch 5.x and above.


## Installing

To utilize elastibuild for node.js install the the `npm` module:

```bash
$ npm install elastibuild
```

After installing the `npm` package you can now building queries like so:

```js
const ElastiBuild = require('elastibuild');
```

## Building Queries

You're probably wondering how using **Elastbuild** makes creating Elasticsearch queries easier. Well, it simply provides a fluent way of constructing Elasticsearch queries.

Let's start with a basic working example:


```js
'use strict';

const ElastiBuild = require('../');

const builder = ElastiBuild.buildQuery();

builder.withMatch('my_field', 'field value');
builder.withSize(100);
builder.withFrom(0);

const query = builder.build();

console.log(query);
```

This example would produce the following console output:

```js
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "my_field": "field value"
          }
        }
      ]
    }
  },
  "size": 100,
  "from": 0
}
```

## API Documentation

### ElastiBuild.buildQuery();

Returns a builder object to allow you to fluently build a query.

```js
const builder = ElastiBuild.buildQuery();
```

### ElastiBuild.build();

Build the actual JSON query using the provided parameters. This method returns Elasticsearch compatible JSON.

```js
const builder = ElastiBuild.buildQuery();

// Some building...

// Dump out the Elasticsearch query to console.
console.log(buildder.build());
```


### ElastiBuild.withFrom(fromValue);

The from parameter defines the offset from the first result you want to fetch.

Pagination of results can be done by using the withFrom and withSize functionality:

* `fromValue` (`Number`)

```js
builder.withFrom(1);
```


### ElastiBuild.withSize(sizeValue);

The size parameter allows you to configure the maximum amount of hits to be returned:

Pagination of results can be done by using the withFrom and withSize functionality:

* `sizeValue` (`Number`)

```js
builder.withSize(10);
```


### ElastiBuild.withMinScore(minScore);

Exclude documents which have a _score less than the minimum specified in min_score:

* `minScore` (`Number`)

```js
builder.withMinScore(0.5);
```


### ElastiBuild.withMatch(field, values);

Return documents where the field value matches the provided values:

* `field` (`String`)
* `values` (`Array` || `String`)

A single value example:

```js
builder.withMatch('my_field', 'my_value');
```

An array of values example:

```js
builder.withMatch('my_field_2', ['my_value_1', 'my_value_2']);
```


### ElastiBuild.withMustMatch(field, values);

Return documents where the field values must match the provided values:

* `field` (`String`)
* `values` (`Array` || `String`)

A single value example:

```js
builder.withMustMatch('my_field', 'my_value');
```

An array of values example:

```js
builder.withMustMatch('my_field_2', ['my_value_1', 'my_value_2']);
```


### ElastiBuild.withShouldMatch(field, values);

Return documents where the field value should match the provided values:

* `field` (`String`)
* `values` (`Array` || `String`)

A single value example:

```js
builder.withShouldMatch('my_field', 'my_value');
```

An array of values example:

```js
builder.withShouldMatch('my_field_2', ['my_value_1', 'my_value_2']);
```


### ElastiBuild.withNotMatch(field, values);

Return documents where the field value does not match the provided values:

* `field` (`String`)
* `values` (`Array` || `String`)

A single value example:

```js
builder.withNotMatch('my_field', 'my_value');
```

An array of values example:

```js
builder.withNotMatch('my_field_2', ['my_value_1', 'my_value_2']);
```


### ElastiBuild.withGeoDistance(fields, lat, long, distance);

Return documents where the geo distance matches the provided values:

* `fields` (`Array`)
* `lat` (`Number`)
* `long` (`Number`)
* `distance` (`String`)


### ElastiBuild.withTerms(field, values);

Return documents where the field value matches the provided values:

* `field` (`String`)
* `values` (`Array` || `String`)

A single value example:

```js
builder.withTerms('my_field', 'my_value');
```


### ElastiBuild.withQueryString(fields, queryString, options);

Returns documents matching the provided query_string.


### ElastiBuild.withMustQueryString(fields, queryString, options);

Returns documents which must match the provided query_string.


### ElastiBuild.withShouldQueryString(fields, queryString, options);

Returns documents which should match the provided query_string.


### ElastiBuild.withMustFilter(field, values);

Applies a must filter to the query.


### ElastiBuild.withShouldFilter(field, values);

Applies a should filter to the query.


### ElastiBuild.withMustNotFilter(field, values);

Applies a must_not filter to the query.


### ElastiBuild.withRange(field, values);

Returns documents within the provided range.


### ElastiBuild.withSort(field, order);

Sorts the returned documents using the provided field and direction.


### ElastiBuild.withSortUri(uris);

Sorts the returned documents using the provided sort uri.


### ElastiBuild.withFieldExist(field, options);

Returns documents containing the provided field.


### ElastiBuild.withMoreLikeThis(fields, id, options);

Returns documents that are "like" the provided document id.





