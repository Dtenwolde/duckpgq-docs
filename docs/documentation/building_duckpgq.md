# Building DuckPGQ

## Installation instructions from source
```bash
git clone --recurse-submodules https://github.com/cwida/duckpgq-extension.git
```

Note that using `--recurse-submodules` will ensure that the correct version of DuckDB is pulled, allowing you to get started. If you already cloned the repository without it, initialize the submodules with:

```bash
git submodule update --init --recursive
```

The `duckdb` submodule points to upstream [duckdb/duckdb](https://github.com/duckdb/duckdb). DuckPGQ does not need a patched version of DuckDB.

## Building the extension

To build the extension, run the following command:
```bash
make release
```

For debug build:
```bash
make debug
```

Or, if you have Ninja installed:
```bash
make <debug|release> GEN=ninja
```

DuckPGQ uses the DuckDB extension build system. If dependency resolution fails, install and configure [vcpkg](https://vcpkg.io/en/getting-started), then set `VCPKG_TOOLCHAIN_PATH` to your vcpkg toolchain file.

The main binaries that will be built are:
```
./build/<build mode>/duckdb
./build/<build mode>/test/unittest
./build/<build mode>/extension/duckpgq/duckpgq.duckdb_extension
```

- `duckdb` is the binary for the DuckDB shell.
- `unittest` is the test runner of DuckDB, used to run the extension's SQL tests (see the [contribution guide](contribution_guide.md#running-the-tests)).
- `duckpgq.duckdb_extension` is the loadable binary as it would be distributed.

## Running the extension
Start the shell with `./build/<build mode>/duckdb -unsigned`, then load the extension you built and activate the SQL/PGQ syntax:

```sql
LOAD './build/release/extension/duckpgq/duckpgq.duckdb_extension';
SET active_grammar_extensions = ['duckpgq'];
```

The `-unsigned` flag is needed because locally built extensions are not signed.
