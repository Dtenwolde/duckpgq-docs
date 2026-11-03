## Contributing

Want to contribute to the project? Great! Please refer to DuckDB's [development](https://github.com/duckdb/duckdb#development) and [contribution](https://github.com/duckdb/duckdb/blob/main/CONTRIBUTING.md) guides, which we follow to see how you can help us. If you are unsure, feel free to reach out.

For development, you generally want to build using `debug` mode:

```bash
make debug
make debug GEN=ninja
```

See [Building DuckPGQ](building_duckpgq.md) for the full build instructions.

## Running the tests

Different tests can be created for DuckDB extensions. The primary way of testing DuckDB extensions should be the SQL tests in `./test/sql`. These SQL tests can be run using:

```bash
make test_release
make test_debug
```

To run a specific test file, pass it with `T`:

```bash
make test T=test/sql/pattern_matching/undirected_edges.test
```

Alternatively, call the test runner directly from the root of the repository:

```bash
./build/debug/test/unittest test/sql/pattern_matching/undirected_edges.test
./build/debug/test/unittest 'test/sql/*'
```

### Writing tests

The SQL/PGQ grammar is activated per connection, so every test has to activate it right after its `require` lines, once for every connection it uses:

```
require duckpgq

statement ok
SET active_grammar_extensions = ['duckpgq'];

statement ok con1
SET active_grammar_extensions = ['duckpgq'];
```

## Code quality

Before opening a pull request, check the formatting and run clang-tidy:

```bash
make format-check
make tidy-check
```

`make format-fix` fixes the formatting.

## Changing the SQL/PGQ syntax

DuckPGQ uses the `GrammarExtension` API of DuckDB, so changes to the SQL/PGQ syntax do not require changes to DuckDB itself. The grammar is defined in the `.gram` files in `src/core/parser/grammar/`:

- `create_property_graph.gram`: `CREATE PROPERTY GRAPH`
- `graph_table.gram`: `GRAPH_TABLE` and the `MATCH` patterns
- `graph_management.gram`: `DROP`, `DESCRIBE`, `SHOW`, and `SUMMARIZE PROPERTY GRAPH`

Each grammar file has a matching `*_grammar.cpp` file in `src/core/parser/` that registers the rules and transforms them into DuckPGQ's parse data. CMake embeds the `.gram` files at configure time, so no generation script is needed. The tests for the grammar are in `test/sql/grammar_extension/`. See [`docs/GRAMMAR_EXTENSION.md`](https://github.com/cwida/duckpgq-extension/blob/main/docs/GRAMMAR_EXTENSION.md) in the extension repository for details.

## Setting up CLion

### Opening project

Configuring CLion with the extension template requires a little work. First, make sure to clone the DuckPGQ extension:

```bash
git clone --recurse-submodules https://github.com/cwida/duckpgq-extension.git
```

This will clone the DuckPGQ extension and add the upstream `duckdb/duckdb` repository as a submodule.

From CLion, open the `duckpgq-extension` directory as a project.

Then make sure to open`./duckdb/CMakeLists.txt`(so not the top-level `CMakeLists.txt` file from this repo) as a project in CLion by right-clicking (or ctrl + left-click on MacOS) and selecting `Load CMake Project`.

Now to fix your project path choose either way ([docs](https://www.jetbrains.com/help/clion/change-project-root-directory.html)):

1. Go to `tools->CMake->Change Project Root`
2. Select the CMake symbol in the bottom left → Select the cog symbol → `Change Project Root`

Then set the project root to the root directory of this repo (`duckpgq-extension` by default).

When reloading CMake, the output should say that `duckpgq` was linked into DuckDB:

```markdown
...
-- Extensions linked into DuckDB: [duckpgq, ...]
-- Tests loaded for extensions: [duckpgq]
...
```

### Debugging

To set up debugging in CLion, there are two required steps.

Firstly, in `CLion -> Settings / Preferences -> Build, Execution, Deploy -> CMake` you will need to add the desired builds (e.g. `debug`, `release`, `reldebug`, etc). There are different ways to configure this, but the easiest is to leave all empty, except the `build path`, which needs to be set to `../build/{build type}`.

Now on a clean repository, you will first need to run `make {build type}` from the command line (see above) to initialize the CMake build directory. After running `make`, you will be able to (re)build from CLion by using the build target we just created.

The second step is configuring the unittest runner as a run/debug configuration. To do this, go to `Run -> Edit Configurations` and click `+ -> Cmake Application`. The target and executable should be `unittest`. This will run all the DuckDB tests. To specify only running the extension-specific tests, add `--test-dir ../../.. [sql]` to the `Program Arguments`. Note that it is recommended to use the `unittest` executable for testing/development within CLion. The actual DuckDB CLI currently does not reliably work as a run target in CLion.
