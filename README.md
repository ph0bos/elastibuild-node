# Elastibuild, A fluent builder for creating ElasticSearch compatible query JSON

Elastibuild, A fluent builder for creating ElasticSearch compatible query JSON.

## Basic Usage

```javascript
'use strict';

const QueryBuilder = require('../');

const builder = QueryBuilder.buildQuery();

builder.withMatch('my_field', 'field value');
builder.withSize(100);
builder.withFrom(0);

const query = builder.build();

console.log(JSON.stringify(query, null, '  '));

/*
prints...

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
*/
```
