# Settings

DuckPGQ adds the following settings to DuckDB. They control optimizations in the query plans for SQL/PGQ queries and are all enabled by default. You normally do not need to change them, but disabling one can help to narrow down a performance problem or a bug.

| Setting | Default | Description |
|---------|---------|-------------|
| `duckpgq_factorized_joins` | `true` | Pre-aggregate join sides that are only counted or summed above the join, so that path counts become degree products instead of enumerating every path. |
| `duckpgq_factorized_join_operator` | `true` | Use the `FACTORIZED_GROUP_JOIN` operator when both sides of a join are only counted or summed, instead of separate `GROUP BY` aggregates and a hash join. |
| `duckpgq_factorized_join_directory` | `true` | Let `FACTORIZED_GROUP_JOIN` count into a dense array indexed by the key when the key bounds are known, instead of a hash table. |
| `duckpgq_vertex_join_elimination` | `true` | Leave vertex tables out of the `MATCH` translation when the query only uses their key, joining the incident edge tables to each other instead. |

For example, to disable vertex join elimination:

```sql
SET duckpgq_vertex_join_elimination = false;
```

To list the settings and their current values:

```sql
SELECT name, value, description
FROM duckdb_settings()
WHERE name LIKE 'duckpgq%';
```

Vertex join elimination relies on every edge referencing an existing vertex. This is checked when the property graph is created (see [Edges must reference existing vertices](property_graph.md#edges-must-reference-existing-vertices)), but not for rows modified afterwards.

## Grammar

The SQL/PGQ syntax is enabled with DuckDB's `active_grammar_extensions` setting:

```sql
SET active_grammar_extensions = ['duckpgq'];
```

See [Loading DuckPGQ](loading.md#activating-the-sqlpgq-syntax) for details.
