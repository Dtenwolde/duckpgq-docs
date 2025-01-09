# DuckPGQ
DuckPGQ is a DuckDB extension for graph workloads that supports the SQL/PGQ standard. 

DuckPGQ leverages the power of DuckDB to bring high-performance, SQL-based graph query capabilities directly to your analytical workflows.

[View DuckPGQ on GitHub](https://github.com/cwida/duckpgq-extension)

## Getting Started
As of DuckDB v1.0.0, DuckPGQ is available as a community extension. From any DuckDB instance, the following two commands allow you to install and load DuckPGQ:

```SQL
install duckpgq from community;
load duckpgq; 
```

See the official [DuckPGQ community page](https://community-extensions.duckdb.org/extensions/duckpgq.html) for more information.

For older DuckDB versions, please see [Loading DuckPGQ](https://www.notion.so/Loading-DuckPGQ-29eda93a97b140e1861614cce1f5498c?pvs=21).

## SQL/PGQ

The extension implements the SQL/PGQ syntax defined by ISO in SQL:2023. PGQ introduces a visual syntax to easily express graph patterns and path-finding queries in SQL. 

We will use the LDBC SNB dataset which defines Person and Person_knows_person tables. 

```sql
CREATE TABLE Person as select * from 'https://gist.githubusercontent.com/Dtenwolde/2b02aebbed3c9638a06fda8ee0088a36/raw/8c4dc551f7344b12eaff2d1438c9da08649d00ec/person-sf0.003.csv';
CREATE TABLE Person_knows_person as select * from 'https://gist.githubusercontent.com/Dtenwolde/81c32c9002d4059c2c3073dbca155275/raw/8b440e810a48dcaa08c07086e493ec0e2ec6b3cb/person_knows_person-sf0.003.csv';
```

The first step of SQL/PGQ is to create a `PROPERTY GRAPH` as a layer on top of our data:
```SQL
CREATE PROPERTY GRAPH snb
  VERTEX TABLES (
    Person
  )
  EDGE TABLES (
    Person_knows_person SOURCE KEY (Person1Id) REFERENCES Person (id)
                        DESTINATION KEY (Person2Id) REFERENCES Person (id)
    LABEL Knows
);
```
The table `Person_knows_person` is given the label `Knows` as a shorthand for future queries.


Now, we can write SQL/PGQ `MATCH` queries using the visual graph syntax:

```sql
FROM GRAPH_TABLE (snb
  MATCH (a:Person)-[k:knows]->(b:Person)
  COLUMNS (a.id, b.id)
)
LIMIT 1;

FROM GRAPH_TABLE (snb 
  MATCH p = ANY SHORTEST (a:person)-[k:knows]->{1,3}(b:Person) 
  COLUMNS (a.id, b.id, path_length(p))
) 
LIMIT 1;
```
We use [DuckDB’s friendlier SQL](https://duckdb.org/docs/sql/dialect/friendly_sql.html) syntax and omit the `SELECT` clause.

DuckPGQ also supports various graph functions such as Local Clustering Coefficient:

```sql
FROM local_clustering_coefficient(snb, person, knows);
```

Finally, once we are done with our property graph, we can drop it: 

```sql
DROP PROPERTY GRAPH snb; 
```

For more information on SQL/PGQ, please see the dedicated page explaining [SQL/PGQ](https://www.notion.so/SQL-PGQ-5016889634db44c99cd607205bfbf68a?pvs=21) in more detail.

## WIP Disclaimer

DuckPGQ is currently a **research project** and still a **work in progress**. While we encourage you to explore and experiment with it, please be aware that there may be **bugs**, incomplete features, or unexpected behaviour.

We greatly appreciate any feedback or bug reports that help us improve and evolve the extension. Feel free to share your experiences!
