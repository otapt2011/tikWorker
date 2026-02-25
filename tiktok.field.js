// ============================================================
// tiktok.field.js – Generic field analyzer for TikTok sections
// ============================================================

(function(global) {
  /**
   * Analyze the content of a specific field across an array of objects.
   * @param {Array} dataArray - Array of objects
   * @param {string} fieldName - Field to analyze
   * @returns {Object} Counts per type
   */
  function analyzeField(dataArray, fieldName) {
    const counts = {
      string: 0,
      boolean: 0,
      number: 0,
      url: 0,
      emoji: 0,
      filePath: 0,
      longString: 0,
      other: 0
    };
    
    if (!Array.isArray(dataArray)) return counts;
    
    dataArray.forEach(item => {
      const raw = item?.[fieldName];
      if (raw === undefined || raw === null) return;
      
      const str = String(raw).trim();
      if (str === '') return; // skip empty
      
      // Order matters: more specific first
      if (/^https?:\/\//i.test(str)) {
        counts.url++;
      } else if (/^(true|false)$/i.test(str)) {
        counts.boolean++;
      } else if (/^-?\d+(\.\d+)?$/.test(str)) {
        counts.number++;
      } else if (/^[\p{Emoji}\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(str)) {
        counts.emoji++;
      } else if (/^(\/|\.\/|[a-zA-Z]:\\)/.test(str) || /\.[a-zA-Z0-9]{2,4}$/.test(str)) {
        counts.filePath++;
      } else if (str.length > 100) {
        counts.longString++;
      } else {
        counts.string++;
      }
    });
    
    return counts;
  }
  
  /**
   * Render analysis results in a neomorphic table.
   * @param {string} containerId - ID of container element
   * @param {Object} counts - Output from analyzeField
   * @param {string} title - Optional title above table
   */
  function renderFieldTable(containerId, counts, title = 'Field Analysis') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = `
      <div class="section-header"><i class="fas fa-chart-pie"></i> ${title}</div>
      <table style="width:100%; border-collapse: collapse; font-size:0.6rem; background:#e0e5ec; border-radius:12px; overflow:hidden; box-shadow: inset 2px 2px 5px #babecc, inset -2px -2px 5px #ffffff;">
        <thead>
          <tr>
            <th style="padding:6px; border-bottom:1px solid #babecc;">Type</th>
            <th style="padding:6px; border-bottom:1px solid #babecc;">Count</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    for (const [type, count] of Object.entries(counts)) {
      html += `
        <tr>
          <td style="padding:4px 6px; border-top:1px solid #babecc;">${type}</td>
          <td style="padding:4px 6px; border-top:1px solid #babecc;">${count}</td>
        </tr>
      `;
    }
    
    html += `</tbody></table>`;
    container.innerHTML = html;
  }
  
  /**
   * Populate a dropdown with section names (keys of data object that are arrays).
   * @param {string} selectId - ID of <select> element
   * @param {Object} data - this.lastSqlData.data
   */
  function populateSectionDropdown(selectId, data) {
    const select = document.getElementById(selectId);
    if (!select || !data) return;
    
    select.innerHTML = '<option value="">-- Select Section --</option>';
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${key} (${data[key].length} items)`;
        select.appendChild(option);
      }
    });
  }
  
  /**
   * Populate field dropdown based on first object of the selected section.
   * @param {string} selectId - ID of <select> element
   * @param {Array} sectionArray - The array of objects for the selected section
   */
  function populateFieldDropdown(selectId, sectionArray) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Choose Field --</option>';
  if (!Array.isArray(sectionArray) || sectionArray.length === 0) return;
  
  const firstItem = sectionArray[0];
  if (!firstItem || typeof firstItem !== 'object') return;
  
  Object.keys(firstItem).forEach(field => {
    const option = document.createElement('option');
    option.value = field;
    option.textContent = field;
    select.appendChild(option);
  });
  
  // Auto‑select the first field
  if (select.options.length > 1) {
    select.selectedIndex = 1; // first real option
  }
}
  // Expose to global scope
  global.analyzeField = analyzeField;
  global.renderFieldTable = renderFieldTable;
  global.populateSectionDropdown = populateSectionDropdown;
  global.populateFieldDropdown = populateFieldDropdown;
  
})(typeof window !== 'undefined' ? window : self);