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

## Install and Load DuckPGQ

=== "CLI"

    ```sql
    INSTALL duckpgq FROM community; 
    LOAD duckpgq; 
    ```

=== "Python"

    ```python
    import duckdb
    conn = duckdb.connect()
    conn.install_extension("duckpgq", repository="community")
    conn.load_extension("duckpgq")
    ```

=== "NodeJS"

    ```js
    import { DuckDBInstance } from '@duckdb/node-api';
    const instance = await DuckDBInstance.create();
    const connection = await instance.connect();
    await connection.run("INSTALL duckpgq FROM community");
    await connection.run("LOAD duckpgq");
    ```

=== "R"

    ```r
    library(duckdb)
    con <- dbConnect(duckdb())
    dbExecute(con, "INSTALL duckpgq FROM community")
    dbExecute(con, "LOAD duckpgq")
    ```

=== "Java"

    ```java
    Connection conn = DriverManager.getConnection("jdbc:duckdb:");
    Statement st = conn.createStatement();
    st.execute("INSTALL duckpgq FROM community");
    st.execute("LOAD duckpgq");
    ```

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



### Explore DuckPGQ Across Domains 

=== "Social Networks"
     
    ??? abstract "Setup"

        ```sql
        ATTACH 'https://github.com/Dtenwolde/duckpgq-docs/raw/refs/heads/main/datasets/snb.duckdb';

        use snb;
        install duckpgq from community; 
        load duckpgq;

        CREATE or replace PROPERTY GRAPH snb
        VERTEX TABLES (
          Person, Forum
        )
        EDGE TABLES (
          Person_knows_person     SOURCE KEY (Person1Id) REFERENCES Person (id)
                                  DESTINATION KEY (Person2Id) REFERENCES Person (id)
                                  LABEL knows,
          Forum_hasMember_Person  SOURCE KEY (ForumId) REFERENCES Forum (id)
                                  DESTINATION KEY (PersonId) REFERENCES Person (id)
                                  LABEL hasMember
        );
        ```

    === "Shortest Path Query"

          ```sql
          -- find the shortest path from one person to all other persons
          FROM GRAPH_TABLE (snb
            MATCH p = ANY SHORTEST (p1:person WHERE p1.id = 14)-[k:knows]->*(p2:person)
            COLUMNS (p1.id, p2.id as other_person_id, element_id(p), path_length(p))
          );
          ```

    === "Find Mutual Friends"

          ```sql    
          -- Find mutual friends between two users
          FROM GRAPH_TABLE (snb
            MATCH (p1:Person WHERE p1.id = 16)-[k:knows]->(p2:Person)<-[k2:knows]-(p3:Person WHERE p3.id = 32)
            COLUMNS (p2.firstName)
          );
          ```

    === "Most Popular People"

          ```sql
          -- Find the 3 most popular people 
          FROM GRAPH_TABLE (snb
            MATCH (follower:Person)-[follows:knows]->(person:Person)
            COLUMNS (person.id AS personID, person.firstname, person.lastname, follower.id AS followerID)
          )
          SELECT personID, firstname, lastname, COUNT(followerID) AS numFollowers
          GROUP BY ALL 
          ORDER BY numFollowers DESC 
          LIMIT 3;
          ```

    === "Forum count of the most-followed person"

        ```sql
        -- Number of forums posted on by the most followed person
        WITH
        mfp AS (
          FROM GRAPH_TABLE (snb
            MATCH (follower:Person)-[follows:knows]->(person:Person)
            COLUMNS (person.id AS personID, person.firstname, follower.id AS followerID)
          )
        SELECT personID, firstname, COUNT(followerID) AS numFollowers
        GROUP BY ALL ORDER BY numFollowers DESC LIMIT 1
        )
        FROM
          mfp,
          GRAPH_TABLE (snb
            MATCH (person:Person)<-[fhm:hasMember]-(f:Forum)
            COLUMNS (person.id AS personID, f.id as forumId)
        ) mem
        SELECT mfp.personID, mfp.firstname, mfp.numFollowers, count(mem.forumId) forumCount
        WHERE mfp.personID = mem.personID
        GROUP BY ALL;
        ```


=== "Airline Data"
    
    ??? abstract "Setup"
    
        ```sql
        ATTACH 'https://github.com/Dtenwolde/duckpgq-docs/raw/refs/heads/airline-data/datasets/airline-data-small.duckdb' as airline;

        use airline;
        install duckpgq from community; 
        load duckpgq; 

        CREATE PROPERTY GRAPH flight_graph
          VERTEX TABLES (
            aircrafts_data, airports_data,
            bookings, flights,
            tickets, seats
          )
          EDGE TABLES (
            route
              SOURCE KEY (departure_airport) REFERENCES airports_data(airport_code)
              DESTINATION KEY (arrival_airport) REFERENCES airports_data(airport_code),
            ticket_flights
              SOURCE KEY (ticket_no) REFERENCES tickets(ticket_no)
              DESTINATION KEY (flight_id) REFERENCES flights(flight_id),
            bookings_tickets
              SOURCE KEY (book_ref) REFERENCES bookings(book_ref)
              DESTINATION KEY (ticket_no) REFERENCES tickets(ticket_no),
            boarding_passes 
              SOURCE KEY (ticket_no) REFERENCES tickets(ticket_no)
              DESTINATION KEY (seat_no) REFERENCES seats(seat_no)
        );
        ```

    === "Most Expensive Seats on Average"

        ```sql
        FROM GRAPH_TABLE (
          flight_graph 
          MATCH (b:bookings)-[bt:bookings_tickets]->(t:tickets)-[bp:boarding_passes]->(s:seats)
        )
        SELECT round(avg(total_amount), 2) avg_amount, seat_no 
        GROUP BY seat_no 
        ORDER BY avg_amount DESC;
        ```

<h2 class="team-header">Behind DuckPGQ</h2>

<div class="team-section">
    <img src="assets/MK3_1748_square.JPG" alt="Daniel ten Wolde" class="team-photo">
    <h2>Daniël ten Wolde</h2>
     Lead Developer of DuckPGQ and PhD student at CWI specializing in graph analytics and database systems.

    <div class="team-links">
        <a href="https://github.com/Dtenwolde" target="_blank">GitHub</a>
        <a href="https://bsky.app/profile/dtenwolde.bsky.social" target="_blank">Bluesky</a>
        <a href="https://www.linkedin.com/in/dani%C3%ABl-ten-wolde/" target="_blank">LinkedIn</a>
    </div>
</div>




## WIP Disclaimer

DuckPGQ is currently a **research project** and still a **work in progress**. While we encourage you to explore and experiment with it, please be aware that there may be **bugs**, incomplete features, or unexpected behaviour.

We greatly appreciate any feedback or bug reports that help us improve and evolve the extension. Feel free to share your experiences!
