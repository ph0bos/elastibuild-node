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
console.log(builder.build());
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


### ElastiBuild.withMatchAll(value);

Constructs a simple match all query. Matches all documents that match the value provided:

* `value` (`Object`)

Match all documents example:

```js
builder.withMatchAll({});
```

Boost parameter example:

```js
builder.withMatchAll({ "boost" : 1.2 });
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

Return documents where the geo distance matches the provided values, based on a geo_point circle query:

* `fields` (`Array`)
* `lat` (`Number`)
* `long` (`Number`)
* `distance` (`String`)

### ElastiBuild.withGeoCircle(fields, lat, long, radius, relation);

Return documents where the shape or location fields matche a geo_shape circle query, where the default relation is `intersects`.
This default relation matches all documents whose geo_shape indexed location or shape intersects with the submitted circle.

* `fields` (`Array`)
* `lat` (`Number`)
* `long` (`Number`)
* `radius` (`String`)
* `relation` (`String`)

The `radius` value defaults to metres so a unit can be omitted, but other units are supported by ES such as "100km".

The `relation` value defaults to "intersects", but can also be:

* `intersects` - Matches documents whose location or shape intersects with the circle
* `within` - Matches documents whose location or shape is within the circle
* `contains` - Matches documents whose location or shape contains the circle
* `disjoint` - Matches document whose location or shape has nothing in common with the circle e.g. outside or does not contain 

A geo circle example:

```js
builder.withGeoCircle(['my_field1', 'my_field2'], 12.45, 45.65, '1000');
```

A geo circle example with alternative radius units:

```js
builder.withGeoCircle(['my_field1', 'my_field2'], 12.45, 45.65, '1000km');
```

A geo circle example with a within relation:

```js
builder.withGeoCircle(['my_field1', 'my_field2'], 12.45, 45.65, '1000', 'within');
```

### ElastiBuild.withGeoLocation(fields, lat, long);

Return documents where the indexed geo_shape fields contain the provided location.

* `fields` (`Array`)
* `lat` (`Number`)
* `long` (`Number`)

A simple geo location example:

```js
builder.withGeoLocation(['my_field1', 'my_field2'], 12.45, 45.65);
```

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

* `fields` (`Array`)
* `queryString` (`String`)
* `options` (`Object`)

An example usage is as follows:

```js
builder.withQueryString(['my_field_1', 'my_field_2'], 'foo AND bar', { boost: 100, use_dis_max: true });
```


### ElastiBuild.withMustQueryString(fields, queryString, options);

Returns documents which must match the provided query_string.

* `fields` (`Array`)
* `queryString` (`String`)
* `options` (`Object`)

An example usage is as follows:

```js
builder.withMustQueryString(['my_field_1', 'my_field_2'], 'foo AND bar', { boost: 100, use_dis_max: true });
```


### ElastiBuild.withShouldQueryString(fields, queryString, options);

Returns documents which should match the provided query_string.

* `fields` (`Array`)
* `queryString` (`String`)
* `options` (`Object`)

An example usage is as follows:

```js
builder.withShouldQueryString(['my_field_1', 'my_field_2'], 'foo AND bar', { boost: 100, use_dis_max: true });
```


### ElastiBuild.withMustFilter(field, values);

Applies a must filter to the query.

* `field` (`String`)
* `values` (`Array` || `String`)

A single value example:

```js
builder.withMustFilter('my_field', 'my_value');
```


### ElastiBuild.withMustFilterObject(partialQueryObject);

Applies a complex must filter to the query.

* `partialQueryObject` (`Object`)

A complex nested sub-query example:

```js
builder.withMustFilterObject({
  bool: {
    should: [
      {
        terms: {
          fooProp: [ "barValue" ]
        }
      },
      {
        bool: {
          must_not: {
            match: {
              bazProp: [ "barValue" ]
            }
          }
        }
      }
    ]
  }
});
```


### ElastiBuild.withShouldFilter(field, values);

Applies a should filter to the query.

* `field` (`String`)
* `values` (`Array` || `String`)

A single value example:

```js
builder.withShouldFilter('my_field', 'my_value');
```


### ElastiBuild.withMustNotFilter(field, values);

Applies a must_not filter to the query.

* `field` (`String`)
* `values` (`Array` || `String`)

A single value example:

```js
builder.withMustNotFilter('my_field', 'my_value');
```


### ElastiBuild.withRange(field, values);

Returns documents within the provided range.

* `field` (`String`)
* `range` (`Object`)

A single value example:

```js
builder.withRange("timestamp", { gte: "1970-01-01", lte: "1970-01-01" });
```
### ElastiBuild.withSearchAfter(values);

Sets the search after values for scrolling pages.

* `values` (`Array`)

```js
builder.withSearchAfter(["first_value", 12345]);
```

### ElastiBuild.withSort(field, order);

Sorts the returned documents using the provided field and direction.

* `field` (`String`)
* `order` (`Object`)

```js
builder.withSort("my_field", "desc");
```

### ElastiBuild.withSortUri(uris);

Sorts the returned documents using the provided sort uri.

* `uris` (`Array`)

Example with a field and order:

```js
builder.withSortUri("my_field:desc");
```

Example with a field, order and mode:

```js
builder.withSortUri("my_field:desc:min");
```


### ElastiBuild.withSortObject(sortObject);

Sorts the returned documents using the provided sort object (for complex queries).

* `sortObject` (`Array/Object`)

Example with an array:

```js
builder.withSortObject([{ post_date : {order : "asc"}}]);
```

Example with an object:

```js
let inputObject = {
      "_script": {
        "type": "number",
        "order": "desc",
        "script": {
          "lang": "eng",
          "inline": "if (doc['version'].value > 0) { doc['version'].value } else { doc['firstcreated'].value }"
        }
      }
    };
```

```js
builder.withSortObject(inputObject);
```

This example would produce the following console output:

```js
{
  "query": {
    "bool": {
      "must": {
        "match_all": {}
      }
    }
  },
  "sort": {
    "my_type": {
      "_source": {
        "includes": [
          "path1.*",
          "path2.*"
        ],
        "excludes": [
          "path3.*"
        ]
      }
    }
  }
}
```

### ElastiBuild.withFieldExist(field, options);

Returns documents containing the provided field.

* `field` (`String`)
* `options` (`Object`)

```js
builder.withFieldExist("my_field");
```


### ElastiBuild.withField(field, value);

Allowing further customisation, appends additional field to the query. Returns documents containing the provided field. 

* `field` (`String`)
* `options` (`Any`)

```js
builder.withField("my_field", {value: 'some_value'});
```


### ElastiBuild.withMoreLikeThis(fields, id, options);

Returns documents that are "like" the provided document id.

* `fields` (`Array`)
* `id` (`String`)
* `options` (`Object`)

```js
builder.withMoreLikeThis(["my_field_1", "my-field-2"], "my-id", { min_term_freq: 4, minimum_should_match: "90%" });
```



