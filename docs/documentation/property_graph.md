# Create property graph

The first step in using SQL/PGQ is creating a property graph as a layer on top of your data. In DuckPGQ, property graphs are transient; they only exist as long as the connection to the database is open. 

As of community version `v0.1.0` released with DuckDB `v1.1.3` property graphs are persistent and are synchronised between connections. 

The tables will be divided into vertex tables and edge tables, having a primary key-foreign key relationship. An edge table should have a column defining the source node and a column describing the destination node.  

To create a property graph the syntax is as follows: 

```sql
CREATE [ OR REPLACE ] PROPERTY GRAPH (<property graph name> 
VERTEX TABLES (
	<vertex table>
[, <vertex table> ]
)
[ EDGE TABLES (	
	<edge table> 
[, <edge table ] ) ];
```

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

## Vertex table

```sql
<table name> [ AS <table name alias> ] [ <[properties](https://www.notion.so/Property-graph-05c1dffe3f2547f0abfa3ea5a2b4eae1?pvs=21)> ] [ LABEL <[label](https://www.notion.so/Property-graph-05c1dffe3f2547f0abfa3ea5a2b4eae1?pvs=21)> ] 
```

Only the table name is required for the vertex table; the table name alias, [properties](https://www.notion.so/Property-graph-05c1dffe3f2547f0abfa3ea5a2b4eae1?pvs=21), and [label](https://www.notion.so/Property-graph-05c1dffe3f2547f0abfa3ea5a2b4eae1?pvs=21) are optional. 

## Edge table

To define the edge table, it is necessary to specify the table name, along with the source and destination keys.

In the following example, the source of the edge references the `Person` table, where the primary key is `id` and the foreign key is `personId`. The destination references the `Message` table, where both the primary key and the foreign key are `id`.

```sql
Person_likes_Message  SOURCE KEY (PersonId) REFERENCES Person (id)
                      DESTINATION KEY (id) REFERENCES Message (id)
                      LABEL likes_Message
```

The `LABEL` and the `PROPERTIES` are optional. 

## Pre-defined PK-FK relations

If the PK-FK relationships have already been defined during table creation, it is not necessary to repeat them when creating a property graph, unless this leads to ambiguity. The system will automatically infer the relationships based on the existing PK-FK constraints.

**Simple Example**

For example, given the following schema:

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

For example, consider the following schema:

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
CREATE PROPERTY GRAPH (snb 
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

## Inheritance

Inheritance in relational databases can be achieved by using a special column that indicates the type of entity, allowing a single table to store multiple types of related entities. This approach is often referred to as single-table inheritance.

### Example

Consider a table called `Organisation` that can represent different types of organizations, such as companies and universities. We use a special column called `typemask` to indicate the type of organization.

| id | type | name | typeMask |
| --- | --- | --- | --- |
| 6466 | University | National_Chung_Hsing_University | 2  |
| 812 | Company | Tepavia_Trans | 1 |
| 7677 | University | University_of_Arkansas_Graduate_School | 2 |
| 5103 | University | Villahermosa_Institute_of_Technology | 2 |
| 231 | Company | Kivalliq_Air | 1 |

- **Table Name:** `Organisation`
- **Special Column:** `typemask` - This column indicates the type of organization. It can take values such as `company` and `university`.
- **Primary Key:** `OrganisationID` - This uniquely identifies each organization in the table.

In this example, the `Organisation` table can store different types of organizations by using the `typemask` column to distinguish between them. This approach allows for flexibility and avoids the need for multiple tables to represent each type of organization.

### Inheritance Definition

The inheritance is defined using the `typemask` column:

```sql
Organisation LABEL Organisation IN typemask(company, university)
```

Here, `LABEL Organisation` indicates that the table `Organisation` is being defined. The `IN typemask(company, university)` part specifies that the `typemask` column will be used to indicate whether a record is a `company` or a `university`.

By using this approach, you can efficiently manage different types of related entities within a single table, simplifying your database design and queries.

Within a `MATCH` statement, we can now use the labels `company` or `university` to create a filter on these types: 

```sql
FROM GRAPH_TABLE (snb
  MATCH (a:person)-[w:worksAt]->(c:company)
  COLUMNS (a.firstName, c.name)
)
```

## Properties

Properties can restrict the columns used in a SQL/PGQ query. 

The specifications allow several options: 

- `PROPERTIES (column [, <column>])`: List the columns allowed from the original table
- `PROPERTIES [ARE] ALL COLUMNS [EXCEPT (column [, column])]`: Allow all columns from the original table except the columns listed in the `EXCEPT` list.
- `NO PROPERTIES`: Allow no columns from the original table

## Label

The label can be used to reference the vertex or edge table in future PGQ queries. However, it is completely optional and when omitted the original table name can be used in PGQ queries. It can be useful to make abbreviations of table names. In the following example, no label is specified for `Person`, but for `Person_knows_Person` we create the label `Knows`.

```sql
import database 'duckdb-pgq/data/SNB0.003';

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
    MATCH (p:Person)-[k:knows]->(p2:Person)
    COLUMNS (p.id, p2.id)
    )
LIMIT 1;
```

```sql
┌───────┬────────────────┐
│  id   │      id_1      │
│ int64 │     int64      │
├───────┼────────────────┤
│    14 │ 10995116277782 │
└───────┴────────────────┘
```

# Describe property graph

Once you have created a property graph, you can use `DESCRIBE PROPERTY GRAPH` to show information about it, such as the table name, label, and in the case of edge tables their source and destination keys. For the property graph `snb` created above, the output will be: 

```sql
┌─────────────────────┬─────────┬─────────────────┬──────────────┬───────────┬─────────────┬───────────────────┬────────────────┬────────────────┬───────────────┬────────────┐
│     table_name      │  label  │ is_vertex_table │ source_table │ source_pk │  source_fk  │ destination_table │ destination_pk │ destination_fk │ discriminator │ sub_labels │
│       varchar       │ varchar │     boolean     │   varchar    │ varchar[] │  varchar[]  │      varchar      │   varchar[]    │   varchar[]    │    varchar    │ varchar[]  │
├─────────────────────┼─────────┼─────────────────┼──────────────┼───────────┼─────────────┼───────────────────┼────────────────┼────────────────┼───────────────┼────────────┤
│ Person              │ person  │ true            │              │           │             │                   │                │                │               │            │
│ Person_knows_person │ knows   │ false           │ Person       │ [id]      │ [Person1Id] │ Person            │ [id]           │ [Person2Id]    │               │            │
└─────────────────────┴─────────┴─────────────────┴──────────────┴───────────┴─────────────┴───────────────────┴────────────────┴────────────────┴───────────────┴────────────┘

```

# Drop property graph

Delete a property graph with the name `pg`

```sql
DROP PROPERTY GRAPH pg
```

Delete a property graph with the name `pg`; do not throw an error if the property graph does not exist: 

```sql
DROP IF EXISTS PROPERTY GRAPH pg
```

Adding `IF EXISTS` will not throw an error if `<property graph name>` does not exist. 
Omitting this will result in a `BinderException` if the `<property graph name>` does not exist. 

# Alter property graph
To be supported in a future version
For now, dropping and recreating the property graph is required if you wish to alter the property graph.
