# Elastibuild

Elastibuild, a fluent builder for creating ElasticSearch compatible query JSON.

Note: All constructed queries are compatible with Elastsearch 5.x only.


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

This example would produce the the following console output:

```js
{
  "query": {
  "filtered": {
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
    "filter": {}
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

### ElastiBuild.withQueryString(fields, queryString, options);

### ElastiBuild.withMustQueryString(fields, queryString, options);

### ElastiBuild.withShouldQueryString(fields, queryString, options);

### ElastiBuild.withMustFilter(field, values);

### ElastiBuild.withShouldFilter(field, values);

### ElastiBuild.withMustNotFilter(field, values);

### ElastiBuild.withRange(field, values);

### ElastiBuild.withSort(field, order);

### ElastiBuild.withSortUri(uris);

### ElastiBuild.withFieldExist(field, options);

### ElastiBuild.withMoreLikeThis(fields, id, options);

### ElastiBuild.build();






