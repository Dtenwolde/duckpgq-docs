# SQL/PGQ

SQL/PGQ is a graph query language built on top of SQL, designed to bring graph pattern matching capabilities to both seasoned SQL users and those new to graph technology. Standardized by the International Organization for Standardization (ISO), it offers a declarative approach to querying property graphs, which store nodes, edges, and properties.

The language features a visual graph syntax inspired by Cypher while also supporting traditional SQL syntax, easing the transition for SQL users. With SQL/PGQ, you can query property graphs to:

- Discover paths between nodes
- Identify specific graph patterns
- Calculate the shortest path between two nodes

See [here](https://github.com/szarnyasg/gql-sql-pgq-pointers) for a list of resources related to SQL/PGQ.

## Loading DuckPGQ

Load the extension and activate the SQL/PGQ syntax on your connection. The `SET` statement has to run on every connection, before any query that uses SQL/PGQ syntax. See [Loading DuckPGQ](loading.md) for details.

```sql
INSTALL duckpgq FROM community;
LOAD duckpgq;
SET active_grammar_extensions = ['duckpgq'];
```

## Loading data
Starting with an empty DuckDB database, load the `Person` and `Person_knows_person` tables from the LDBC SNB dataset using the following commands:
```sql
CREATE TABLE Person AS SELECT * FROM 'https://gist.githubusercontent.com/Dtenwolde/2b02aebbed3c9638a06fda8ee0088a36/raw/8c4dc551f7344b12eaff2d1438c9da08649d00ec/person-sf0.003.csv';
CREATE TABLE Person_knows_person AS SELECT * FROM 'https://gist.githubusercontent.com/Dtenwolde/81c32c9002d4059c2c3073dbca155275/raw/8b440e810a48dcaa08c07086e493ec0e2ec6b3cb/person_knows_person-sf0.003.csv';
```

## Creating the property graph

Next, create a property graph, which is persistent across database sessions and automatically reflects changes made to the underlying data. Similar to a `VIEW`, the property graph provides a layer for querying graph structures, ensuring that updates to the base tables are immediately reflected in the graph representation. For more details, refer to [Property graph](property_graph.md).

Use the following command to define the property graph:

```sql
CREATE PROPERTY GRAPH snb
VERTEX TABLES (
    Person
  )
EDGE TABLES (
    Person_knows_person
        SOURCE KEY ( person1id ) REFERENCES Person ( id )
        DESTINATION KEY ( person2id ) REFERENCES Person ( id )
        LABEL Knows
  );
```

If successful, you will see the following confirmation, allowing you to execute queries using SQL/PGQ syntax on the created property graph:
```sql { .yaml .no-copy }
┌─────────┐
│ Success │
│ boolean │
├─────────┤
│ 0 rows  │
└─────────┘
```

## Pattern matching queries

SQL/PGQ uses a visual graph syntax, inspired by Cypher. Vertex elements are denoted by `()` and edge elements are denoted by `[]`. Here is an example of a pattern-matching query where we find friends of Jan and return their first names.

```sql
FROM GRAPH_TABLE (snb
  MATCH (a:Person WHERE a.firstName = 'Jan')-[k:Knows]->(b:Person)
  COLUMNS (b.firstName)
);
```

The result will be:

```sql { .yaml .no-copy }
┌───────────┐
│ firstName │
│  varchar  │
├───────────┤
│ Ali       │
│ Otto      │
│ Bryn      │
│ Hans      │
└───────────┘
```

Thanks to DuckDB’s friendlier syntax ([blog post 1](https://duckdb.org/2022/05/04/friendlier-sql.html), [blog post 2](https://duckdb.org/2023/08/23/even-friendlier-sql.html)) we can omit the `SELECT` and instead use the `COLUMNS` clause.

A `GRAPH_TABLE` can be used anywhere DuckDB accepts a table: in joins, subqueries, CTEs, `CREATE TABLE AS`, `INSERT INTO ... SELECT`, and `COPY`. The keyword can also be written as two words, `GRAPH TABLE`.

### Element syntax

Each vertex `(a:Person)` and edge `[k:Knows]` consists of a variable name and an optional label:

- The variable name (`a`, `k`) is required. Anonymous elements such as `(:Person)` or `[]` are not supported.
- The label is written as `:label` or `IS label`, for example `(a IS Person)`. Labels are case-insensitive.
- A `WHERE` clause inside the element filters that element, for example `(a:Person WHERE a.firstName = 'Jan')` or `[k:Knows WHERE k.creationDate > '2012-01-01']`.

### Edge directions

The previous query featured a right-directed edge, `()-[]->()`, meaning that the left node pattern is the source, and the right is the destination.

DuckPGQ also supports the following edge types:

- Left-directed edge: `()<-[]-()`
    - The source of the edge is on the right side, the destination is on the left side.
- Any-directed edge: `()-[]-()`
    - The relationship can exist in any direction.
- Left-right-directed edge: `()<-[]->()`
    - The relationship must exist in both directions.

### Filtering on the whole pattern

Besides the element-local `WHERE`, a `WHERE` clause after the pattern can refer to all variables in the pattern, including edges:

```sql
FROM GRAPH_TABLE (snb
  MATCH (a:Person)-[k:Knows]->(b:Person)
  WHERE a.firstName = 'Jan' AND b.firstName <> 'Ali'
  COLUMNS (b.firstName, k.creationDate)
);
```

```sql { .yaml .no-copy }
┌───────────┬────────────────────────────┐
│ firstName │        creationDate        │
│  varchar  │  timestamp with time zone  │
├───────────┼────────────────────────────┤
│ Otto      │ 2012-06-14 14:43:25.817+02 │
│ Bryn      │ 2012-09-23 01:53:26.452+02 │
│ Hans      │ 2012-06-30 02:45:34.905+02 │
└───────────┴────────────────────────────┘
```

### Longer and multiple patterns

Patterns can chain any number of edges. Several patterns can also be listed in one `MATCH`, separated by commas. Variables that appear in more than one pattern refer to the same element. The following two queries both return the friends of friends of Jan:

```sql
FROM GRAPH_TABLE (snb
  MATCH (a:Person WHERE a.firstName = 'Jan')-[k:Knows]->(b:Person)-[k2:Knows]->(c:Person)
  COLUMNS (b.firstName AS friend, c.firstName AS friend_of_friend)
);

FROM GRAPH_TABLE (snb
  MATCH (a:Person WHERE a.firstName = 'Jan')-[k:Knows]->(b:Person),
        (b:Person)-[k2:Knows]->(c:Person)
  COLUMNS (b.firstName AS friend, c.firstName AS friend_of_friend)
);
```

### The COLUMNS clause

`COLUMNS` selects the columns returned by the `GRAPH_TABLE` and accepts any expression over the pattern variables, including aliases (`b.firstName AS friend`) and stars (`b.*`).

The `COLUMNS` clause is optional. Without it, the columns of every vertex in the pattern are returned. Duplicate column names get a suffix, for example `firstName` and `firstName_1`.

`OPTIONAL MATCH` is currently not supported but will be in a future update.

## Path-finding
Another significant feature of SQL/PGQ is the introduction of a more concise syntax for path-finding within a query. This enables us to find the shortest path length between any pairs of nodes in the graph.

DuckPGQ supports finding `ANY SHORTEST` path between nodes, which is non-deterministic: when several shortest paths exist, any one of them is returned.

To query the shortest path length between Jan and the first five persons sorted alphabetically, use the following query:

``` sql
FROM GRAPH_TABLE (snb
    MATCH p = ANY SHORTEST (a:Person WHERE a.firstName = 'Jan')-[k:knows]->+(b:Person)
    COLUMNS (path_length(p) AS length, b.firstName)
  )
ORDER BY firstName, length
LIMIT 5;
```

The result will be:

```sql { .yaml .no-copy }
┌────────┬─────────────┐
│ length │  firstName  │
│ int64  │   varchar   │
├────────┼─────────────┤
│      3 │ Abdul Haris │
│      2 │ Aleksandr   │
│      2 │ Alexei      │
│      1 │ Ali         │
│      2 │ Ali         │
└────────┴─────────────┘
```

There are two persons named Ali in the dataset, which is why the name appears twice.

### Quantifiers

The previous query showed the `+` syntax, which is syntactic sugar for finding the paths with a lower bound of 1, and no upper bound. This can also be denoted as `()-[]->{1,}()`.

The supported quantifiers are:

| Quantifier | Lower bound | Upper bound |
|------------|-------------|-------------|
| `*`        | 0           | none        |
| `+`        | 1           | none        |
| `?`        | 0           | 1           |
| `{n}`      | `n`         | `n`         |
| `{n,m}`    | `n`         | `m`         |
| `{n,}`     | `n`         | none        |
| `{,m}`     | 0           | `m`         |

Quantifiers can be used on edges with any direction, for example `-[k:Knows]-*` to search the graph as undirected.

A lower bound of 0 also matches the source vertex itself as a path of length 0. Quantifiers with an upper bound of 1 (`?`, `{0,1}`, `{,1}`) currently match only paths of length 1.

DuckPGQ returns one row for each pair of matched source and destination vertices, and the bounds apply to the length of the shortest path between them. For example, with `{2,3}` a pair is returned if its shortest path has length 2 or 3:

```sql
FROM GRAPH_TABLE (snb
    MATCH p = ANY SHORTEST (a:Person WHERE a.firstName = 'Jan')-[k:knows]->{2,3}(b:Person)
    COLUMNS (b.firstName, path_length(p) AS length)
  )
ORDER BY firstName, length
LIMIT 3;
```

```sql { .yaml .no-copy }
┌─────────────┬────────┐
│  firstName  │ length │
│   varchar   │ int64  │
├─────────────┼────────┤
│ Abdul Haris │      3 │
│ Aleksandr   │      2 │
│ Alexei      │      2 │
└─────────────┴────────┘
```

A quantifier with an upper bound can also be used without `ANY SHORTEST`. A quantifier without an upper bound (`*`, `+`, `{n,}`) requires `ANY SHORTEST`, since otherwise the number of results could be infinite.

### Path modes and search prefixes

The parser accepts the full set of SQL/PGQ search prefixes and path modes, but only the following are implemented:

| Syntax | Supported |
|--------|-----------|
| `ANY SHORTEST` | Yes |
| `WALK` (the default path mode) | Yes |
| `ALL SHORTEST` | Not yet |
| `SHORTEST k` | Not yet |
| `TRAIL`, `SIMPLE`, `ACYCLIC` | Not yet |

Using a prefix or path mode that is not implemented yet results in a `Not implemented Error`.

### Retrieving the path

DuckPGQ also allows you to retrieve the `rowid`’s of the nodes and edges that are on the shortest path by adding `element_id(<path variable>)` in the `COLUMNS` clause.

Other options are:

- `vertices(<path variable>)` : Returns the `rowid` ’s of the vertices on the shortest path.
- `edges(<path variable>)` : Returns the `rowid` ’s of the edges on the shortest path.
- `path_length(<path variable>)`: Returns the path length of the shortest path.

The following query shows an example:

``` sql
FROM GRAPH_TABLE (snb
    MATCH p = ANY SHORTEST (a:Person WHERE a.firstName = 'Jan')-[k:knows]->+(b:Person)
    COLUMNS (element_id(p), vertices(p), edges(p), path_length(p) AS length, b.firstName)
  )
ORDER BY firstName, length
LIMIT 5;
```

The result will be:

```sql { .yaml .no-copy }
┌───────────────────────────┬────────────────┬─────────────┬────────┬─────────────┐
│       element_id(p)       │  vertices(p)   │  edges(p)   │ length │  firstName  │
│          int64[]          │    int64[]     │   int64[]   │ int64  │   varchar   │
├───────────────────────────┼────────────────┼─────────────┼────────┼─────────────┤
│ [1, 3, 5, 22, 26, 66, 44] │ [1, 5, 26, 44] │ [3, 22, 66] │      3 │ Abdul Haris │
│ [1, 5, 33, 79, 39]        │ [1, 33, 39]    │ [5, 79]     │      2 │ Aleksandr   │
│ [1, 3, 5, 24, 32]         │ [1, 5, 32]     │ [3, 24]     │      2 │ Alexei      │
│ [1, 3, 5]                 │ [1, 5]         │ [3]         │      1 │ Ali         │
│ [1, 3, 5, 21, 21]         │ [1, 5, 21]     │ [3, 21]     │      2 │ Ali         │
└───────────────────────────┴────────────────┴─────────────┴────────┴─────────────┘
```

To turn the `rowid`'s back into rows, `unnest` the list and join it with the vertex or edge table on `rowid`. See the *Shortest Route Between Airports* example on the [home page](../index.md).

## Views and prepared statements

- `GRAPH_TABLE` queries can be prepared, with SQL `PREPARE` or through the prepared statements of a client API, and can take parameters such as `(a:Person WHERE a.id = $1)`.
- `CREATE PROPERTY GRAPH` and the other property graph statements cannot be prepared.
- Views over a `GRAPH_TABLE` can only be created in an in-memory database. In a file-backed database, `CREATE VIEW` fails with `Cannot serialize a table function with process-local bind input`. Queries that read the view also need the grammar to be active.
