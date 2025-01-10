## Contributing

Want to contribute to the project? Great! Please refer to DuckDB's [development](https://github.com/duckdb/duckdb#development) and [contribution](https://github.com/duckdb/duckdb/blob/main/CONTRIBUTING.md) guides, which we follow to see how you can help us. If you are unsure, feel free to reach out.

For development, you generally want to build using `debug` mode:

```jsx
make debug
make debug GEN=ninja
```

## Running the tests

Different tests can be created for DuckDB extensions. The primary way of testing DuckDB extensions should be the SQL tests in `./test/sql`. These SQL tests can be run using:

```jsx
make test
```

Alternatively, if you want to run a specific test file you can use the following commands: 

```bash
cd build/debug/test
./unittest --test-dir ../../.. test/sql/<path_to_specific_test_file>
```

Running all SQL tests using the CLI:

```bash
./unittest --test-dir ../../.. test/sql/*
```

Whenever your changes require changes to the parser of DuckDB, you will need to create a branch in the `duckdb-pgq` repository, as well as in the `duckpgq-extension` repository.

## Setting up CLion

### Opening project

Configuring CLion with the extension template requires a little work. First, make sure to clone the DuckPGQ extension:

```bash
git clone --recurse-submodules https://github.com/cwida/duckpgq-extension.git
```

This will clone the DuckPGQ extension and add the `cwida/duckdb-pgq` repository as a submodule. This is a fork of `duckdb/duckdb` with modifications to the parser and transformer to support the SQL/PGQ syntax.

From CLion, open the `duckpgq-extension` directory as a project. 

Then make sure to open`./duckdb/CMakeLists.txt`(so not the top-level `CMakeLists.txt` file from this repo) as a project in CLion by right-clicking (or ctrl + left-click on MacOS) and selecting `Load CMake Project`. 

Now to fix your project path choose either way ([docs](https://www.jetbrains.com/help/clion/change-project-root-directory.html)): 

1. Go to `tools->CMake->Change Project Root`
2. Select the CMake symbol in the bottom left → Select the cog symbol → `Change Project Root`

Then set the project root to the root directory of this repo (`duckpgq-extension` by default).

When reloading CMake, the output should say that `duckpgq` and `parquet` were linked into DuckDB:

```markdown
...
-- Extensions linked into DuckDB: [duckpgq, parquet]
-- Tests loaded for extensions: [duckpgq]
...
```

### Debugging

To set up debugging in CLion, there are two required steps. 

Firstly, in `CLion -> Settings / Preferences -> Build, Execution, Deploy -> CMake` you will need to add the desired builds (e.g. `debug`, `release`, `reldebug`, etc). There are different ways to configure this, but the easiest is to leave all empty, except the `build path`, which needs to be set to `../build/{build type}`. 

Now on a clean repository, you will first need to run `make {build type}` from the command line (see above) to initialize the CMake build directory. After running `make`, you will be able to (re)build from CLion by using the build target we just created.

The second step is configuring the unittest runner as a run/debug configuration. To do this, go to `Run -> Edit Configurations` and click `+ -> Cmake Application`. The target and executable should be `unittest`. This will run all the DuckDB tests. To specify only running the extension-specific tests, add `--test-dir ../../.. [sql]` to the `Program Arguments`. Note that it is recommended to use the `unittest` executable for testing/development within CLion. The actual DuckDB CLI currently does not reliably work as a run target in CLion.