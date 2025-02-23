document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = 'https://mediatum.ub.tum.de/services/export/node/670506/allchildren?q=author=ladner%20or%20author-contrib=ladner';
    const container = document.getElementById('publication-container');

    fetch(apiUrl)
        .then(response => response.text())
        .then(xmlText => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
            const nodes = Array.from(xmlDoc.getElementsByTagName('node'));

            // Sort nodes by year (most recent first)
            nodes.sort((a, b) => {
                const yearA = parseInt(a.querySelector("attribute[name='year']")?.textContent?.split('-')[0] || "0", 10);
                const yearB = parseInt(b.querySelector("attribute[name='year']")?.textContent?.split('-')[0] || "0", 10);
                return yearB - yearA;
            });

            let lastYear = null;

            nodes.forEach(node => {
                const title = node.querySelector("attribute[name='title-contrib']")?.textContent || 'No title available';
                let authors = node.querySelector("attribute[name='author-contrib']")?.textContent || 'No authors available';
                const venue = node.querySelector("attribute[name='journal-title']")?.textContent ||
                    node.querySelector("attribute[name='congresstitle']")?.textContent || 'No venue available';
                const year = node.querySelector("attribute[name='year']")?.textContent?.split('-')[0] || 'No year available';
                const doi = node.querySelector("attribute[name='doi']")?.textContent;
                const pdf = node.querySelector("file[mime-type='application/pdf']")?.getAttribute('filename');
                const id = node.getAttribute('id')

                // Format the authors string
                authors = authors.split(';').map(name => {
                    let [last, first] = name.trim().split(', ');
                    if (!first) return last;
                    let formattedName = `${first} ${last}`;
                    return formattedName.includes("Tobias Ladner") ? `<u>${formattedName}</u>` : formattedName;
                }).join(', ').replace(/, ([^,]+)$/, ', and $1');

                // Insert a year header if the year changes
                if (year !== lastYear) {
                    const yearHeader = document.createElement('h4');
                    yearHeader.className = 'year-header';
                    yearHeader.textContent = year;
                    container.appendChild(yearHeader);
                    lastYear = year;
                }

                // Create the publication card
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card mb-4';
                cardDiv.innerHTML = `
          <div class="card-body">
            <h5 class="card-title mb-3">${title}</h5>
            <p class="card-text mb-2">${authors}<br><small class="text-muted">${venue}, ${year}</small></p>
            <div>
              ${doi ? `<a href="https://doi.org/${doi}" target="_blank" class="btn btn-outline-primary btn-sm me-2"><i class="bi bi-link-45deg"></i> DOI</a>` : ''}
              ${pdf ? `<a href="https://mediatum.ub.tum.de/doc/${id}/${pdf}" target="_blank" class="btn btn-outline-secondary btn-sm"><i class="bi bi-file-earmark-pdf"></i> PDF</a>` : ''}
            </div>
          </div>
        `;
                container.appendChild(cardDiv);
            });
        })
        .catch(error => {
            console.error('Error fetching or parsing XML:', error);
            container.innerHTML = '<div class="alert alert-danger">Error loading publications. Please try again later.</div>';
        });
});