# ElasticSearch Query Builder

A builder for constructing ElasticSearch JSON queries via a fluent interface.

## Basic Usage

```javascript
'use strict';

const QueryBuilder = require('elasticsearch-query-builder');

const builder = QueryBuilder.buildQuery();

builder.withMatch('my_field', 'field value');
builder.withLimit(100);
builder.withOffset(0);

const query = builder.build();

console.log(query);
```
