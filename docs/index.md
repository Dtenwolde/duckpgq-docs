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

<div style="display: flex; justify-content: center; margin: 40px 0;">
  <div class="highlight" style="border: 2px solid var(--md-accent-fg-color); border-radius: 12px; padding: 20px; background-color: var(--md-overlay-bg-color); box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2); max-width: 600px; width: 100%;">
    <p style="font-size: 1.2em; font-weight: bold; color: var(--md-accent-fg-color); margin-bottom: 15px; text-align: center;">
      🚀 Install DuckPGQ and Load the Extension:
    </p>
    <div style="text-align: center; margin-bottom: 15px;">
      <select id="version-dropdown" style="
        padding: 0.4em 0.6em; 
        border: 0.08em solid var(--md-accent-fg-color); 
        border-radius: 0.4em; 
        background-color: var(--md-overlay-bg-color); 
        color: var(--md-default-fg-color); 
        font-size: 0.9rem; 
        line-height: 1.4; 
        max-width: 10rem; 
        width: 100%; 
        appearance: none;
        background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"%3E%3Cpath fill="%23ccc" d="M2 0L0 2h4z" /%3E%3C/svg%3E');
        background-repeat: no-repeat;
        background-position: right 0.6em center;
        background-size: 0.8em;
        padding-right: 2em;
        box-sizing: border-box;">
        <option value="CLI">CLI</option>
        <option value="Python">Python</option>
        <option value="NodeJS">NodeJS</option>        
        <option value="R">R</option>
        <option value="Java">Java</option>
      </select>
    </div>
    <pre id="install-instructions" style="background-color: var(--md-code-bg-color); padding: 10px; border-radius: 8px; color: var(--md-default-fg-color); margin: 0; text-align: left;">
<code><span style="color: var(--md-accent-fg-color); font-weight: bold;">INSTALL</span> duckpgq <span style="color: var(--md-accent-fg-color); font-weight: bold;">FROM</span> community;
<span style="color: var(--md-accent-fg-color); font-weight: bold;">LOAD</span> duckpgq;
</code></pre>
  </div>
</div>

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
