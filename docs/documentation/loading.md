# Loading DuckPGQ

Starting from DuckDB `v1.0.0`, it is possible to load the **DuckPGQ** extension as a [community extension](https://community-extensions.duckdb.org/extensions/duckpgq.html). Please note that this version is not the latest. For instructions on loading the latest version, see [Loading the latest version](loading.md#loading-the-latest-version).

## Loading the Community Version

To install and load the community version of DuckPGQ, use the following SQL commands in the DuckDB CLI or within a DuckDB connection:

```sql
-- Install the DuckPGQ extension from the community repository
INSTALL 'duckpgq' FROM 'community';

-- Load the DuckPGQ extension
LOAD 'duckpgq';
```

## Loading the latest version

To use the latest version of **DuckPGQ**, you will need to enable the `unsigned` flag in DuckDB. This allows the installation of custom, unsigned extensions from external repositories.

### CLI

To load the latest version in the DuckDB CLI:

1. Start DuckDB with the `unsigned` flag:

```bash
duckdb -unsigned
```

1. Run the following commands to set up the custom extension repository and load the latest DuckPGQ version:

```sql
SET custom_extension_repository = 'http://duckpgq.s3.eu-north-1.amazonaws.com';
FORCE INSTALL 'duckpgq';
LOAD 'duckpgq';
```

### Python

To load the latest version of DuckPGQ within a Python environment, follow these steps:

Connect to DuckDB with the `allow_unsigned_extensions` flag enabled:

```sql
import duckdb

conn = duckdb.connect(config={"allow_unsigned_extensions": "true"})
```

Execute the following commands to load the latest version of DuckPGQ:

```sql
conn.execute("SET custom_extension_repository = 'http://duckpgq.s3.eu-north-1.amazonaws.com';")
conn.execute("FORCE INSTALL 'duckpgq';")
conn.execute("LOAD 'duckpgq';")
```

## Notes

- The **community version** of DuckPGQ is stable but may not include the latest features or fixes.
- The **latest version** from the custom repository contains the most up-to-date features and improvements, but it requires the use of the `unsigned` flag.
