<div class="md-typeset" style="border: 1px solid var(--md-primary-fg-color); border-radius: 8px; padding: 10px; background-color: var(--md-overlay-bg-color); margin: 20px 0;">
  <a href="#" id="report-issue-link" class="externallink" target="_blank" style="text-decoration: none; font-weight: bold; color: var(--md-primary-fg-color);">
    📢 Report a Documentation Issue
  </a>
</div>

<script>
  document.addEventListener("DOMContentLoaded", () => {
    const pageUrl = window.location.href;
    const issueUrl = `https://github.com/dtenwolde/duckpgq-docs/issues/new?title=Issue%20found%20in%20documentation&body=Please%20describe%20the%20problem%20and%20include%20the%20URL%20of%20this%20page:%20${encodeURIComponent(pageUrl)}`;
    document.getElementById("report-issue-link").href = issueUrl;
  });
</script>