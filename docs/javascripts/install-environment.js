const instructions = {
  "CLI": `<span style="color: var(--md-accent-fg-color); font-weight: bold;">INSTALL</span> duckpgq <span style="color: var(--md-accent-fg-color); font-weight: bold;">FROM</span> community;<br><span style="color: var(--md-accent-fg-color); font-weight: bold;">LOAD</span> duckpgq;`,
  "Python": `conn = duckdb.connect()<br>conn.execute("<span style='color: var(--md-accent-fg-color); font-weight: bold;'>INSTALL</span> duckpgq <span style='color: var(--md-accent-fg-color); font-weight: bold;'>FROM</span> community")<br>conn.execute("<span style='color: var(--md-accent-fg-color); font-weight: bold;'>LOAD</span> duckpgq")`,
  "NodeJS": `import { DuckDBInstance } from '@duckdb/node-api';<br>const instance = await DuckDBInstance.create();<br>const connection = await instance.connect();<br>await connection.run("<span style='color: var(--md-accent-fg-color); font-weight: bold;'>INSTALL</span> duckpgq <span style='color: var(--md-accent-fg-color); font-weight: bold;'>FROM</span> community");<br>await connection.run("<span style='color: var(--md-accent-fg-color); font-weight: bold;'>LOAD</span> duckpgq");`};

// Observe changes in the DOM
const observer = new MutationObserver(() => {
  const dropdown = document.getElementById("version-dropdown");
  const installInstructions = document.getElementById("install-instructions");

  if (dropdown && installInstructions) {
    observer.disconnect(); // Stop observing once the elements are found

    dropdown.addEventListener("change", (event) => {
      const selectedVersion = event.target.value;
      installInstructions.innerHTML = `<code>${instructions[selectedVersion]}</code>`;
    });
  }
});

// Start observing the document body for changes
observer.observe(document.body, { childList: true, subtree: true });