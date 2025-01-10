# Graph Functions

DuckPGQ provides a range of graph algorithms that allow you to conveniently analyze your data directly within DuckDB.

**Supported algorithms:**

- Local Clustering Coefficient
- Weakly Connected Component
- PageRank

On this page, we will use the `Person` and `Person_knows_Person` tables from the **LDBC Social Network Benchmark (SNB)** dataset. These tables represent individuals and their relationships within the network.

```sql
-- Create the Person table
CREATE TABLE Person AS 
SELECT * FROM 'https://gist.githubusercontent.com/Dtenwolde/2b02aebbed3c9638a06fda8ee0088a36/raw/8c4dc551f7344b12eaff2d1438c9da08649d00ec/person-sf0.003.csv';

-- Create the Person_knows_person table
CREATE TABLE Person_knows_person AS 
SELECT * FROM 'https://gist.githubusercontent.com/Dtenwolde/81c32c9002d4059c2c3073dbca155275/raw/8b440e810a48dcaa08c07086e493ec0e2ec6b3cb/person_knows_person-sf0.003.csv';

-- Create the property graph
CREATE PROPERTY GRAPH snb
  VERTEX TABLES (
    Person
  )
  EDGE TABLES (
    Person_knows_person 
      SOURCE KEY (Person1Id) REFERENCES Person (id)
      DESTINATION KEY (Person2Id) REFERENCES Person (id)
      LABEL Knows
  );
```

## Local Clustering Coefficient

The **Local Clustering Coefficient (LCC)** measures how closely a node's neighbours are connected, forming a local cluster. In this example, we calculate the LCC for each person in the graph.

The query syntax for calculating the local clustering coefficient is as follows:

```sql
SELECT * 
FROM local_clustering_coefficient(<property graph>, <vertex label>, <edge label>);
```

- `<property graph>`: The name of the property graph (e.g., `snb`).
- `<vertex label>`: The vertex label representing the nodes (e.g., `Person`).
- `<edge label>`: The edge label representing the relationship (e.g., `Person_knows_person`).

The query returns a result with two columns:

1. **the primary key** of the vertex table (in this schema the `id` of the person)
2. **local_clustering_coefficient** for each node (person), representing how interconnected their neighbours are.

The underlying graph is treated as undirected for the purposes of this calculation.

Example query:
```sql
SELECT *
FROM local_clustering_coefficient(snb, Person, Knows);
```

## Weakly Connected Component

The **Weakly Connected Component (WCC)** identifies groups of nodes where any two nodes are connected by a path, regardless of edge direction. In this example, we calculate the WCC for each person in the graph.

The query syntax for calculating the weakly connected components is as follows:

```sql
SELECT *
FROM weakly_connected_component(<property graph>, <vertex label>, <edge label>);
```

- `<property graph>`: The name of the property graph (e.g., `snb`).
- `<vertex label>`: The vertex label representing the nodes (e.g., `Person`).
- `<edge label>`: The edge label representing the relationships (e.g., `Knows`).

The query returns a result with two columns:

1. **primary key** of the vertex table (the `id` of the person in this schema)
2. **componentId**: the minimum `rowid` of all nodes in the connected component, where nodes with the same `componentId` are part of the same weakly connected component.

The underlying graph is treated as undirected during the calculation of weakly connected components.

Example query:

```sql
SELECT *
FROM weakly_connected_component(snb, Person, Knows);
```

## PageRank

The **PageRank** algorithm ranks nodes based on their importance in a directed graph, where a node's rank is determined by the ranks of the nodes linking to it. In this example, we calculate the PageRank for each person in the graph.

The query syntax for calculating PageRank is as follows:

```sql
SELECT *
FROM pagerank(<property graph>, <vertex label>, <edge label>);
```

- `<property graph>`: The name of the property graph (e.g., `snb`).
- `<vertex label>`: The vertex label representing the nodes (e.g., `Person`).
- `<edge label>`: The edge label representing the relationships (e.g., `Knows`).

The query returns a result with two columns:

1. **primary key** of the vertex table (the `id` of the person in this schema)
2. **PageRank** for each node, representing its importance in the graph.

This calculation assumes a directed edge table.
The algorithm uses a damping factor of 0.85 and a tolerance of 1e-6.

Example query:

```sql
SELECT *
FROM pagerank(snb, Person, Knows);
```