# SQL/PGQ

SQL/PGQ is a graph query language built on top of SQL, designed to bring graph pattern matching capabilities to both seasoned SQL users and those new to graph technology. Standardized by the International Organization for Standardization (ISO), it offers a declarative approach to querying property graphs, which store nodes, edges, and properties.

The language features a visual graph syntax inspired by Cypher while also supporting traditional SQL syntax, easing the transition for SQL users. With SQL/PGQ, you can query property graphs to:

- Discover paths between nodes
- Identify specific graph patterns
- Calculate the shortest path between two nodes

See [here](https://github.com/szarnyasg/gql-sql-pgq-pointers) for a list of resources related to SQL/PGQ.

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
FROM GRAPH_TABLE(snb
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

The previous query featured a right-directed edge, `()-[]->()`, meaning that the left node pattern is the source, and the right is the destination. 

DuckPGQ also supports the following edge types:

- Left-directed edge:`()<-[]-()`
    - The source of the edge is on the right side, the destination is on the left side.
- Any-directed edge: `()-[]-()`
    - The relationship can exist in any direction.
- Left-right-directed edge: `()<-[]->()`
    - The relationship must exist in both directions.

`OPTIONAL MATCH` is currently not supported but will be in a future update.

## Path-finding
Another significant feature of SQL/PGQ is the introduction of a more concise syntax for path-finding within a query. This enables us to find the shortest path length between any pairs of nodes in the graph.

DuckPGQ only supports finding `ANY SHORTEST` path between nodes, which is non-deterministic.

To query the shortest path length between Jan and the first five persons sorted alphabetically, use the following query:

``` sql
FROM GRAPH_TABLE (snb
    MATCH p = ANY SHORTEST (a:Person WHERE a.firstName = 'Jan')-[k:knows]->+(b:Person)
    COLUMNS (path_length(p), b.firstName)
  )
ORDER BY firstName
LIMIT 5;
```

The result will be: 

```sql { .yaml .no-copy }
┌────────────────┬─────────────┐
│ path_length(p) │  firstName  │
│     int64      │   varchar   │
├────────────────┼─────────────┤
│              3 │ Abdul Haris │
│              2 │ Aleksandr   │
│              2 │ Alexei      │
│              2 │ Ali         │
│              1 │ Ali         │
└────────────────┴─────────────┘
```

The previous query showed the `+` syntax, which is syntactic sugar for finding the paths with a lower bound of 1, and no upper bound. This can also be denoted as `()-[]->{1,}()` .

Other options for path-finding are: 

- Kleene star `*` : Lower bound of 0, no upper bound.
- `{n, m}`: Lower bound of `n` (where `n > 0`) and upper bound of `m` (where `m ≥ n`).
- `{,m}`: Lower bound of 0, upper bound of `m` .
- `{n,}` : Lower bound of `n` , no upper bound.

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
    COLUMNS (element_id(p), vertices(p), edges(p), path_length(p), b.firstName)
  )
ORDER BY firstName
LIMIT 5;
```

The result will be: 

```sql { .yaml .no-copy }
┌───────────────────────────┬────────────────┬─────────────┬────────────────┬─────────────┐
│       element_id(p)       │  vertices(p)   │  edges(p)   │ path_length(p) │  firstName  │
│          int64[]          │    int64[]     │   int64[]   │     int64      │   varchar   │
├───────────────────────────┼────────────────┼─────────────┼────────────────┼─────────────┤
│ [1, 3, 5, 22, 26, 66, 44] │ [1, 5, 26, 44] │ [3, 22, 66] │              3 │ Abdul Haris │
│ [1, 5, 33, 79, 39]        │ [1, 33, 39]    │ [5, 79]     │              2 │ Aleksandr   │
│ [1, 3, 5, 24, 32]         │ [1, 5, 32]     │ [3, 24]     │              2 │ Alexei      │
│ [1, 3, 5, 21, 21]         │ [1, 5, 21]     │ [3, 21]     │              2 │ Ali         │
│ [1, 3, 5]                 │ [1, 5]         │ [3]         │              1 │ Ali         │
└───────────────────────────┴────────────────┴─────────────┴────────────────┴─────────────┘
```
