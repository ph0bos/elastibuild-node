# Elastibuild, A fluent builder for creating ElasticSearch compatible query JSON

Elastibuild, A fluent builder for creating ElasticSearch compatible query JSON.

## Basic Usage

```javascript
'use strict';

const QueryBuilder = require('es-query-builder');

const builder = QueryBuilder.buildQuery();

builder.withMatch('my_field', 'field value');
builder.withLimit(100);
builder.withOffset(0);

const query = builder.build();

console.log(query);
```
