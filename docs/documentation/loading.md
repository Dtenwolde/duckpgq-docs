# Loading DuckPGQ

DuckPGQ is distributed as a [community extension](https://community-extensions.duckdb.org/extensions/duckpgq.html). It is built for DuckDB `v1.4`, `v1.5`, and `v2.0`.

## Installing and loading

To install and load DuckPGQ, run the following SQL commands in the DuckDB CLI or within a DuckDB connection:

```sql
-- Install the DuckPGQ extension from the community repository
INSTALL duckpgq FROM community;

-- Load the DuckPGQ extension
LOAD duckpgq;
```

`INSTALL` only needs to run once. `LOAD` needs to run in every new DuckDB process.

## Activating the SQL/PGQ syntax

Starting with DuckDB `v2.0`, DuckPGQ adds its syntax (`CREATE PROPERTY GRAPH`, `GRAPH_TABLE`, and the other property graph statements) through DuckDB's grammar extension API. Loading the extension registers the `duckpgq` grammar, but you have to activate it before using it:

```sql
SET active_grammar_extensions = ['duckpgq'];
```

A few things to keep in mind:

- **Activation is per connection.** Every new connection, for example a second `duckdb.connect()` or a connection from a pool, has to run the `SET` statement again.
- **Run it as a separate statement.** DuckDB parses a batch of statements before executing any of them, so the `SET` has to run before the batch that contains SQL/PGQ syntax. In the CLI, put it on its own line. In client APIs, run it in its own `execute` call.
- **Other grammar extensions.** If you also use other grammar extensions, list them in the same setting, for example `SET active_grammar_extensions = ['duckpgq', 'other_extension'];`.
- `RESET active_grammar_extensions;` restores the default grammar.
- **DuckDB `v1.4` and `v1.5`** do not have this setting. On those versions the SQL/PGQ syntax is available directly after `LOAD duckpgq;`, so skip the `SET` statement.

The [graph functions](graph_functions.md) and [pragmas](pragma.md) are regular functions, so they work without activating the grammar.

!!! warning "Syntax error at or near `PROPERTY` or `MATCH`"
    If a SQL/PGQ statement fails with an error such as

    ```
    Parser Error: syntax error at or near "PROPERTY"
    ```

    the grammar is not active on this connection, or the `SET` statement was sent in the same batch as the query. Run `SET active_grammar_extensions = ['duckpgq'];` on its own first.

## Client examples

=== "CLI"

    ```sql
    INSTALL duckpgq FROM community;
    LOAD duckpgq;
    SET active_grammar_extensions = ['duckpgq'];
    ```

=== "Python"

    ```python
    import duckdb

    conn = duckdb.connect()
    conn.install_extension("duckpgq", repository="community")
    conn.load_extension("duckpgq")
    conn.execute("SET active_grammar_extensions = ['duckpgq']")
    ```

=== "NodeJS"

    ```js
    import { DuckDBInstance } from '@duckdb/node-api';
    const instance = await DuckDBInstance.create();
    const connection = await instance.connect();
    await connection.run("INSTALL duckpgq FROM community");
    await connection.run("LOAD duckpgq");
    await connection.run("SET active_grammar_extensions = ['duckpgq']");
    ```

=== "R"

    ```r
    library(duckdb)
    con <- dbConnect(duckdb())
    dbExecute(con, "INSTALL duckpgq FROM community")
    dbExecute(con, "LOAD duckpgq")
    dbExecute(con, "SET active_grammar_extensions = ['duckpgq']")
    ```

=== "Java"

    ```java
    Connection conn = DriverManager.getConnection("jdbc:duckdb:");
    Statement st = conn.createStatement();
    st.execute("INSTALL duckpgq FROM community");
    st.execute("LOAD duckpgq");
    st.execute("SET active_grammar_extensions = ['duckpgq']");
    ```

## Updating

To get the most recent build of DuckPGQ for your DuckDB version, reinstall it from the community repository:

```sql
FORCE INSTALL duckpgq FROM community;
```

To use unreleased changes, [build DuckPGQ from source](building_duckpgq.md).
