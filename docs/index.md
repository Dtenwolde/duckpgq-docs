---
hide:
  - navigation
  - toc
---

<div style="text-align: center; padding: 20px;">
  <h1 style="font-size: 2.5em; font-weight: bold; margin-bottom: 10px;">DuckPGQ</h1>
  <p style="font-size: 1.2em; color: var(--md-primary-fg-color);">
    DuckPGQ is a DuckDB community extension for graph workloads that supports the SQL/PGQ standard.
  </p>
  <p style="font-size: 1.1em; color: var(--md-default-fg-color); margin-top: 10px; font-style: italic;">
    Leveraging the power of DuckDB to bring high-performance, SQL-based graph query capabilities directly to your analytical workflows.
  </p>
</div>

<div style="display: flex; justify-content: center; margin: 40px 0;">
  <div class="highlight" style="border: 2px solid var(--md-accent-fg-color); border-radius: 12px; padding: 20px; background-color: var(--md-overlay-bg-color); box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2); max-width: 600px; width: 100%;">
    <p style="font-size: 1.2em; font-weight: bold; color: var(--md-accent-fg-color); margin-bottom: 15px; text-align: center;">
      🚀 Install DuckPGQ and Load the Extension:
    </p>
    <div style="text-align: center; margin-bottom: 15px;">
      <select id="version-dropdown" style="
        padding: 0.4em 0.6em; 
        border: 0.08em solid var(--md-accent-fg-color); 
        border-radius: 0.4em; 
        background-color: var(--md-overlay-bg-color); 
        color: var(--md-default-fg-color); 
        font-size: 0.9rem; 
        line-height: 1.4; 
        max-width: 10rem; 
        width: 100%; 
        appearance: none;
        background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"%3E%3Cpath fill="%23ccc" d="M2 0L0 2h4z" /%3E%3C/svg%3E');
        background-repeat: no-repeat;
        background-position: right 0.6em center;
        background-size: 0.8em;
        padding-right: 2em;
        box-sizing: border-box;">
        <option value="CLI">CLI</option>
        <option value="Python">Python</option>
        <option value="NodeJS">NodeJS</option>        
        <option value="R">R</option>
        <option value="Java">Java</option>
      </select>
    </div>
    <pre id="install-instructions" style="background-color: var(--md-code-bg-color); padding: 10px; border-radius: 8px; color: var(--md-default-fg-color); margin: 0; text-align: left;">
<code><span style="color: var(--md-accent-fg-color); font-weight: bold;">INSTALL</span> duckpgq <span style="color: var(--md-accent-fg-color); font-weight: bold;">FROM</span> community;
<span style="color: var(--md-accent-fg-color); font-weight: bold;">LOAD</span> duckpgq;
</code></pre>
  </div>
</div>

## Key Features

<div class="grid cards" markdown style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">

- :material-database-search: **SQL/PGQ Standard**  
  Supports graph pattern matching with SQL/PGQ, following the SQL:2023 standard.
- :material-rocket-launch: **High Performance**  
  Leverages DuckDB for efficient, in-process graph analytics.
- :material-chart-bar: **Easy To Install**  
  Seamlessly integrate with DuckDB through a simple setup process, requiring no dependencies.
- :material-lock-open-variant-outline: **Open Source**  
  Community-driven, extensible, and free to use.

</div>



## Getting Started
As of DuckDB v1.0.0, DuckPGQ is available as a community extension. From any DuckDB instance, the following two commands allow you to install and load DuckPGQ:

```SQL
install duckpgq from community;
load duckpgq; 
```

See the official [DuckPGQ community page](https://community-extensions.duckdb.org/extensions/duckpgq.html) for more information.

For older DuckDB versions, please see [Loading DuckPGQ](documentation/loading.md).

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

For more information on SQL/PGQ, please see the dedicated page explaining [SQL/PGQ](documentation/sql_pgq.md) in more detail.

## WIP Disclaimer

DuckPGQ is currently a **research project** and still a **work in progress**. While we encourage you to explore and experiment with it, please be aware that there may be **bugs**, incomplete features, or unexpected behaviour.

We greatly appreciate any feedback or bug reports that help us improve and evolve the extension. Feel free to share your experiences!
