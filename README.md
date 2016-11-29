# Elastibuild, A fluent builder for creating ElasticSearch compatible query JSON

Elastibuild, A fluent builder for creating ElasticSearch compatible query JSON.

## Basic Usage

```javascript
'use strict';

const QueryBuilder = require('elastibuild');

const builder = QueryBuilder.buildQuery();

builder.withMatch('my_field', 'field value');
builder.withSize(100);
builder.withFrom(0);

const query = builder.build();

console.log(query);
```
