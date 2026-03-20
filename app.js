document.addEventListener('DOMContentLoaded', () => {
    const DATA_FILE = 'Untitled43_formatted.html';
    
    // State
    let allRowsData = [];
    let filteredRows = [];

    // DOM Elements
    const loader = document.getElementById('loader');
    const dataContainer = document.getElementById('dataContainer');
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');

    async function loadData() {
        try {
            const response = await fetch(DATA_FILE);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const htmlString = await response.text();
            
            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            
            // Extract rows from the tbody
            const rows = doc.querySelectorAll('tbody tr');
            
            allRowsData = Array.from(rows).map(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 13) return null;
                
                return {
                    id: cells[0].textContent.trim(),
                    contentHTML: row.innerHTML,
                    searchableText: row.textContent.toLowerCase()
                };
            }).filter(row => row !== null);

            filteredRows = [...allRowsData];
            
            // Hide loader, show data
            loader.style.display = 'none';
            dataContainer.style.display = 'block';
            
            renderAll();
        } catch (error) {
            console.error('Error loading data:', error);
            loader.innerHTML = `
                <div style="color: #ef4444; text-align: center;">
                    <h3>Error Loading Data</h3>
                    <p>Could not fetch ${DATA_FILE}.</p>
                    <p style="font-size: 0.85rem; margin-top: 1rem;">Note: If you are opening this directly from your file system (file://), your browser's CORS policy will block the fetch.<br>Please use a local server: <code>python3 -m http.server 8000</code></p>
                </div>
            `;
        }
    }

    let mathJaxTimeout;
    function renderAll() {
        // Build HTML for ALL rows
        tableBody.innerHTML = filteredRows.map(row => `<tr>${row.contentHTML}</tr>`).join('');
        
        // Trigger MathJax formatting (debounced to avoid multiple heavy passes if searching quickly)
        if (window.MathJax) {
            clearTimeout(mathJaxTimeout);
            mathJaxTimeout = setTimeout(() => {
                MathJax.typesetPromise([tableBody]).catch(err => console.error('MathJax error:', err));
            }, 300);
        }
    }

    // Debounced Search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.toLowerCase().trim();
        
        searchTimeout = setTimeout(() => {
            if (!query) {
                filteredRows = [...allRowsData];
            } else {
                filteredRows = allRowsData.filter(row => 
                    row.searchableText.includes(query)
                );
            }
            renderAll();
        }, 300);
    });

    // Initialize
    loadData();
});
