# Building DuckPGQ

## Installation instructions from source
```bash
git clone --recurse-submodules https://github.com/cwida/duckpgq-extension.git
```

Note that using `--recurse-submodules` will ensure that the correct version of DuckDB is pulled, allowing you to get started.

## Building the extension

To build the extension, run the following command:
```bash
make release
```

For debug build:
```python
make debug
```

Or, if you have Ninja installed:
```bash
make <debug> GEN=ninja
```

The main binaries that will be built are:
```
./build/<build mode>/duckdb
./build/<build mode>/test/unittest
./build/<build mode>/extension/duckpgq/duckpgq.duckdb_extension
```

- `duckdb`is the binary for the DuckDB shell with the extension code automatically loaded.
- `unittest`is the test runner of DuckDB. Again, the extension is already linked into the binary.
- `duckpgq.duckdb_extension`is the loadable binary as it would be distributed.

## Running the extension
Start the shell by executing `./build/<build mode>/duckdb` to run the extension code.