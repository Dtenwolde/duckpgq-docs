# Pragmas

## show_property_graphs

The `show_property_graphs` pragma lists all currently registered property graphs in the DuckPGQ extension.

Property graphs are registered via the `CREATE PROPERTY GRAPH` statement, and this pragma allows you to inspect which graphs are available in the current database session.

### Syntax
`PRAGMA show_property_graphs;`

### Example

```sql
CREATE PROPERTY GRAPH my_graph (
  VERTEX TABLE people KEY (id),
  EDGE TABLE knows SOURCE people KEY (source_id) DESTINATION people KEY (target_id)
);

PRAGMA show_property_graphs;
```

Output:
```
property_graph
---------------
my_graph
```

### Notes
- This pragma internally runs:
`SELECT DISTINCT property_graph FROM __duckpgq_internal;`


## create_vertex_table

The `create_vertex_table` pragma in DuckPGQ generates a vertex table based on the distinct vertex identifiers found in the source and destination columns of an edge table. This is useful when your graph model is defined by an edge table, and you want to derive a vertex table automatically.

### Syntax
`PRAGMA create_vertex_table(‘edge_table’, ‘source_column’, ‘destination_column’, ‘vertex_table_name’, ‘id_column_name’);`

### Parameters

| Parameter            | Description                                                               |
|----------------------|---------------------------------------------------------------------------|
| `edge_table`         | Name of the edge table                                                    |
| `source_column`      | Column in the edge table representing the source vertex                   |
| `destination_column` | Column in the edge table representing the destination vertex              |
| `vertex_table_name`  | Name of the new vertex table to be created                                |
| `id_column_name`     | Name of the column to be used for vertex IDs in the new table             |

### Example

Given an edge table like:

```sql
CREATE TABLE edges (src INT, dst INT);
```

You can create a vertex table from it:
```sql
PRAGMA create_vertex_table('edges', 'src', 'dst', 'vertices', 'id');
```

This will generate and execute the following SQL under the hood:

```sql
CREATE TABLE vertices AS
SELECT DISTINCT id FROM (
  SELECT src AS id FROM edges
  UNION ALL
  SELECT dst AS id FROM edges
);
```

### Notes
- Both source and destination values are combined and deduplicated using DISTINCT.
- The resulting vertex_table_name will have a single column named id_column_name, containing all unique vertex IDs.
- This pragma is a utility to simplify building a property graph schema from existing relational data.

