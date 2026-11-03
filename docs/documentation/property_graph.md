# Property Graph

## CREATE

The first step in using SQL/PGQ is creating a property graph as a layer on top of your data. Property graphs are stored in the database, so they persist across sessions when you use a database file, and they are shared between connections. Like a view, a property graph does not copy any data: queries always read the current contents of the underlying tables.

!!! warning "Property graphs over attached databases"
    The definition of a property graph is stored in the database DuckDB was started with, even when you create the graph after `USE`-ing an attached database. A property graph defined on an attached database is therefore not saved in that database file. It is kept as long as the default database is: until the session ends for an in-memory database, or in the default database file otherwise.

The property graph statements on this page require the SQL/PGQ grammar to be active on the connection (see [Loading DuckPGQ](loading.md)):

```sql
SET active_grammar_extensions = ['duckpgq'];
```

The tables will be divided into vertex tables and edge tables, having a primary key-foreign key relationship. An edge table should have a column defining the source node and a column describing the destination node.

To create a property graph the syntax is as follows:

```sql
CREATE [ OR REPLACE ] PROPERTY GRAPH [ IF NOT EXISTS ] <property graph name>
VERTEX TABLES (
	<vertex table>
[, <vertex table> ]
)
[ EDGE TABLES (
	<edge table>
[, <edge table> ] ) ];
```

`OR REPLACE` and `IF NOT EXISTS` cannot be combined. Without either, creating a property graph with a name that already exists results in an error.

At least one `<vertex table>` must be specified to create a valid property graph. The `EDGE TABLES` are optional. For example to make a property graph over a subset of the [Social Network Benchmark dataset](https://ldbcouncil.org/benchmarks/snb/) from LDBC: 

```sql
CREATE PROPERTY GRAPH snb 
VERTEX TABLES (
  Person, 
  Message,
  Forum
) 
EDGE TABLES (
  Person_knows_person     SOURCE KEY (Person1Id) REFERENCES Person (id)
                          DESTINATION KEY (Person2Id) REFERENCES Person (id)
                          LABEL Knows,
  Forum_hasMember_Person  SOURCE KEY (ForumId) REFERENCES Forum (id)
                          DESTINATION KEY (PersonId) REFERENCES Person (id)
                          LABEL hasMember,
  Person_likes_Message    SOURCE KEY (PersonId) REFERENCES Person (id)
                          DESTINATION KEY (id) REFERENCES Message (id)
                          LABEL likes_Message
);
```

### Vertex table

```sql
<table name> [ AS <table name alias> ] [ PROPERTIES (<Properties>) ] [ LABEL <Label> ] 
```

Only the table name is required for the vertex table; the table name alias, [properties](property_graph.md#properties), and [label](property_graph.md#label) are optional. 

### Edge table

To define the edge table, it is necessary to specify the table name, along with the source and destination keys.

In the following example, the source of the edge references the `Person` table, where the primary key is `id` and the foreign key is `personId`. The destination references the `Message` table, where both the primary key and the foreign key are `id`.

```sql
Person_likes_Message  SOURCE KEY (PersonId) REFERENCES Person (id)
                      DESTINATION KEY (id) REFERENCES Message (id)
                      LABEL likes_Message
```

The `LABEL` and the `PROPERTIES` are optional.

### Composite keys

Source and destination keys can consist of multiple columns. List the columns in the same order on both sides of `REFERENCES`:

```sql
CREATE PROPERTY GRAPH travel
VERTEX TABLES (Passenger, Flight)
EDGE TABLES (
  books SOURCE KEY (passenger_id) REFERENCES Passenger (id)
        DESTINATION KEY (carrier, number) REFERENCES Flight (carrier, number)
        LABEL Books
);
```

### Edges must reference existing vertices

When creating a property graph, DuckPGQ checks that the source and destination key of every edge row references an existing row in the vertex table. If not, the statement fails and the property graph is not created:

```sql { .yaml .no-copy }
Constraint Error: Incomplete edge: a row of edge table e has destination key (dst) = (99), which references no row in vertex table v (id). Every edge key must reference an existing vertex; fix or remove the row before creating the property graph.
```

This check runs only when the property graph is created. Rows that are inserted or modified afterwards are not checked again. Queries rely on the edges being complete, so keep the edge and vertex tables consistent, for example with foreign key constraints.

### Pre-defined PK-FK relations

If the PK-FK relationships have already been defined during table creation, it is not necessary to repeat them when creating a property graph, unless this leads to ambiguity. The system will automatically infer the relationships based on the existing PK-FK constraints.

**Simple Example**

Given the following schema:

```sql
CREATE TABLE a (
  id BIGINT PRIMARY KEY,
  name VARCHAR
);
CREATE TABLE b (
  id BIGINT PRIMARY KEY,
  description VARCHAR
);
CREATE TABLE edge_ab (
  id BIGINT PRIMARY KEY,
  src BIGINT REFERENCES a(id),
  dst BIGINT REFERENCES b(id)
);
```

The following is sufficient during property graph creation:

```sql
CREATE PROPERTY GRAPH g_relationship
VERTEX TABLES (a, b)
EDGE TABLES (edge_ab SOURCE a DESTINATION b);
```

Here, the system can infer that the column src in edge_ab references the primary key in a, and dst references the primary key in b.

**Handling Ambiguity in PK-FK Relationships**

If an edge table has more than one PK-FK relationship defined with the same vertex table, it becomes ambiguous which relationship to use for the SOURCE and DESTINATION. In this case, you must explicitly define both the source and destination keys.

Consider the following schema:

```sql
CREATE TABLE Person(
	id BIGINT PRIMARY KEY
);

CREATE TABLE Person_knows_Person(
	Person1Id BIGINT REFERENCES Person (id), 
	Person2Id BIGINT REFERENCES Person (id)
);

```

Attempting to create the property graph without explicitly defining the primary and foreign keys will result in an error:

```sql
CREATE PROPERTY GRAPH snb
VERTEX TABLES (Person)
EDGE TABLES (Person_knows_Person SOURCE Person DESTINATION Person);
```

**Error**:

```sql
Invalid Error: Multiple primary key - foreign key relationships detected between Person_knows_Person and Person. Please explicitly define the primary key and foreign key columns using `SOURCE KEY <primary key> REFERENCES Person <foreign key>`
```

**Resolving Ambiguity**

To resolve this, you must explicitly define the primary and foreign key columns for the source and destination relationships, as follows:

```sql
CREATE PROPERTY GRAPH snb
VERTEX TABLES (Person)
EDGE TABLES (Person_knows_Person 
             SOURCE KEY (Person1Id) REFERENCES Person(id) 
             DESTINATION KEY (Person2Id) REFERENCES Person(id));
```

By specifying the KEY and REFERENCES clauses explicitly, you remove any ambiguity, allowing the graph creation to proceed successfully.

### Inheritance

Inheritance in relational databases can be achieved by using a special column that indicates the type of entity, allowing a single table to store multiple types of related entities. This approach is often referred to as single-table inheritance.

Consider a table called `Organisation` that can represent different types of organizations, such as companies and universities. We use a special column called `typemask` to indicate the type of organization.

| id | type | name | typeMask |
| --- | --- | --- | --- |
| 6466 | University | National_Chung_Hsing_University | 2  |
| 812 | Company | Tepavia_Trans | 1 |
| 7677 | University | University_of_Arkansas_Graduate_School | 2 |
| 5103 | University | Villahermosa_Institute_of_Technology | 2 |
| 231 | Company | Kivalliq_Air | 1 |

- **Table Name:** `Organisation`
- **Special Column:** `typemask` - This integer column (`INTEGER` or `BIGINT`) indicates the type of organization as a bitmask: `1` for a company and `2` for a university.
- **Primary Key:** `id` - This uniquely identifies each organization in the table.

In this example, the `Organisation` table can store different types of organizations by using the `typemask` column to distinguish between them. This approach allows for flexibility and avoids the need for multiple tables to represent each type of organization.

#### Inheritance Definition

The inheritance is defined using the `typemask` column:

```sql
Organisation LABEL Organisation IN typemask(company, university)
```

Here, `LABEL Organisation` indicates that the table `Organisation` is being defined. The `IN typemask(company, university)` part specifies that the `typemask` column will be used to indicate whether a record is a `company` or a `university`.

Each sublabel corresponds to one bit of the discriminator column, in the order they are listed: the first sublabel (`company`) matches rows where bit `1` is set, the second (`university`) matches rows where bit `2` is set, the third would match bit `4`, and so on. A row can have multiple sublabels, for example `typemask = 3` matches both `company` and `university`. The label `Organisation` itself matches all rows.

By using this approach, you can efficiently manage different types of related entities within a single table, simplifying your database design and queries.

Within a `MATCH` statement, we can now use the labels `company` or `university` to create a filter on these types: 

```sql
FROM GRAPH_TABLE (snb
  MATCH (a:person)-[w:worksAt]->(c:company)
  COLUMNS (a.firstName, c.name)
)
```

### Properties

Properties can restrict the columns used in a SQL/PGQ query. 

The specifications allow several options: 

- `PROPERTIES (column [, <column>])`: List the columns allowed from the original table
- `PROPERTIES [ARE] ALL COLUMNS [EXCEPT (column [, column])]`: Allow all columns from the original table except the columns listed in the `EXCEPT` list.
- `ALL PROPERTIES`: Allow all columns from the original table. This is the default when no properties are specified.
- `NO PROPERTIES`: Allow no columns from the original table

Referencing a column that is not a property results in an error, for example `Binder Error: Property x.email is never registered!`.

A property in a `PROPERTIES` list can be given an alias (`PROPERTIES (firstName AS name)`). The alias is stored, but queries cannot use it yet; refer to the property by its column name.

### Label

The label can be used to reference the vertex or edge table in future PGQ queries. However, it is completely optional and when omitted the original table name can be used in PGQ queries. It can be useful to make abbreviations of table names. In the following example, no label is specified for `Person`, but for `Person_knows_Person` we create the label `Knows`.

```sql
CREATE PROPERTY GRAPH snb
VERTEX TABLES (
  Person
)
EDGE TABLES (
	Person_knows_person SOURCE KEY (Person1Id) REFERENCES Person (id)
                      DESTINATION KEY (Person2Id) REFERENCES Person (id)
                      LABEL Knows
);

FROM GRAPH_TABLE (snb
    MATCH (p:Person)-[k:Knows]->(p2:Person)
    COLUMNS (p.id, p2.id)
    )
LIMIT 1;
```

```sql { .yaml .no-copy }
┌───────┬────────────────┐
│  id   │      id_1      │
│ int64 │     int64      │
├───────┼────────────────┤
│    14 │ 10995116277782 │
└───────┴────────────────┘
```

### Qualified names

Vertex and edge tables can be qualified with a schema or an attached database, for example `VERTEX TABLES (s.Person)`. The property graph name can be qualified too: `CREATE PROPERTY GRAPH s.snb ...` creates the graph in schema `s`. Unqualified graphs are created in the `main` schema.

Property graph names are unique within a database, so an unqualified name such as `snb` refers to the graph regardless of its schema. A qualified name, in `GRAPH_TABLE`, `DROP`, `DESCRIBE` or `SUMMARIZE`, has to match the catalog and schema the graph was created in.

Temporary property graphs (`CREATE TEMPORARY PROPERTY GRAPH`) are not supported.

## DESCRIBE

Once you have created a property graph, you can use `DESCRIBE PROPERTY GRAPH` to show information about it, such as the table name, label, and in the case of edge tables their source and destination keys. `DESC PROPERTY GRAPH` and `SHOW PROPERTY GRAPH` are equivalent. For the property graph `snb` created above, the output will be:

```sql { .yaml .no-copy }
┌────────────────┬─────────────────────┬─────────┬─────────────────┬──────────────┬───────────┬─────────────┬───────────────────┬────────────────┬────────────────┬───────────────┬────────────┬─────────┬─────────┐
│ property_graph │     table_name      │  label  │ is_vertex_table │ source_table │ source_pk │  source_fk  │ destination_table │ destination_pk │ destination_fk │ discriminator │ sub_labels │ catalog │ schema  │
│    varchar     │       varchar       │ varchar │     boolean     │   varchar    │ varchar[] │  varchar[]  │      varchar      │   varchar[]    │   varchar[]    │    varchar    │ varchar[]  │ varchar │ varchar │
├────────────────┼─────────────────────┼─────────┼─────────────────┼──────────────┼───────────┼─────────────┼───────────────────┼────────────────┼────────────────┼───────────────┼────────────┼─────────┼─────────┤
│ snb            │ Person              │ Person  │ true            │ NULL         │ NULL      │ NULL        │ NULL              │ NULL           │ NULL           │ NULL          │ NULL       │ NULL    │         │
│ snb            │ Person_knows_person │ Knows   │ false           │ Person       │ [id]      │ [Person1Id] │ Person            │ [id]           │ [Person2Id]    │ NULL          │ NULL       │ NULL    │         │
└────────────────┴─────────────────────┴─────────┴─────────────────┴──────────────┴───────────┴─────────────┴───────────────────┴────────────────┴────────────────┴───────────────┴────────────┴─────────┴─────────┘
```

The `DESCRIBE` statement can be used as a subquery, for example `FROM (DESCRIBE PROPERTY GRAPH snb) WHERE NOT is_vertex_table`. The same information is available through the table function `describe_property_graph('snb')`.

## SUMMARIZE

`SUMMARIZE PROPERTY GRAPH` computes statistics for every vertex and edge table in a property graph:

- Vertex tables: `vertex_count`.
- Edge tables: `edge_count`, the number of distinct sources and destinations (`unique_source_count`, `unique_destination_count`), the number of vertices without outgoing or incoming edges (`isolated_sources`, `isolated_destinations`), and the average, minimum, maximum, and quartiles of the in-degree and out-degree (`avg_in_degree`, `min_in_degree`, `max_in_degree`, `q25_in_degree`, `q50_in_degree`, `q75_in_degree`, and the same for `out_degree`).

Like `DESCRIBE`, it can be used as a subquery to select specific statistics:

```sql
SELECT table_name, vertex_count, edge_count, isolated_sources, avg_out_degree, max_out_degree
FROM (SUMMARIZE PROPERTY GRAPH snb);
```

```sql { .yaml .no-copy }
┌─────────────────────┬──────────────┬────────────┬──────────────────┬────────────────────┬────────────────┐
│     table_name      │ vertex_count │ edge_count │ isolated_sources │   avg_out_degree   │ max_out_degree │
│       varchar       │    int64     │   int64    │      int64       │       double       │     int64      │
├─────────────────────┼──────────────┼────────────┼──────────────────┼────────────────────┼────────────────┤
│ Person              │           50 │       NULL │             NULL │               NULL │           NULL │
│ Person_knows_person │         NULL │         83 │               22 │ 2.9642857142857144 │             13 │
└─────────────────────┴──────────────┴────────────┴──────────────────┴────────────────────┴────────────────┘
```

The table function `summarize_property_graph('snb')` returns the same result.

## DROP

Delete a property graph with the name `pg`

```sql
DROP PROPERTY GRAPH pg
```

Delete a property graph with the name `pg`; do not throw an error if the property graph does not exist: 

```sql
DROP PROPERTY GRAPH IF EXISTS pg
```

Adding `IF EXISTS` will not throw an error if `<property graph name>` does not exist.
Omitting this will result in a `Binder Error` if the `<property graph name>` does not exist.

## ALTER
To be supported in a future version.
For now, use `CREATE OR REPLACE PROPERTY GRAPH` to change the definition of a property graph.

## Listing property graphs

To list the property graphs in the database, use the [`show_property_graphs`](pragma.md#show_property_graphs) pragma:

```sql
PRAGMA show_property_graphs;
```
