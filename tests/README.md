Tests live under this directory.

Structure
---------
- `unit/` – fast, isolated tests for individual modules.
- `integration/` – reserved for multi-module flows or parser → renderer tests.

Running tests
-------------
All tests use Node’s built-in runner. From the project root:

```
node --test
```

You can target a subset (for example, just the unit suite) with:

```
node --test tests/unit
```
