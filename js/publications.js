document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = 'https://mediatum.ub.tum.de/services/export/node/670506/allchildren?q=author=ladner%20or%20author-contrib=ladner';
    const container = document.getElementById('publication-container');

    // Show placeholder cards while loading
    function createPlaceholderCard() {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card mb-4';
        cardDiv.innerHTML = `
          <div class="card-body placeholder-glow">
            <h5 class="card-title mb-3"><span class="placeholder col-8"></span></h5>
            <p class="card-text mb-2"><span class="placeholder col-6"></span><br><small class="text-muted"><span class="placeholder col-4"></span></small></p>
            <div>
              <a class="btn btn-outline-primary btn-sm me-2 disabled"><i class="bi bi-link-45deg"></i> <span class="placeholder placeholder-sm" style="width: 25px;"></span></a>
              <a class="btn btn-outline-secondary btn-sm me-2 disabled"><i class="bi bi-search"></i> <span class="placeholder placeholder-sm" style="width: 70px;"></span></a>
              <a class="btn btn-outline-secondary btn-sm disabled"><i class="bi bi-file-earmark-pdf"></i> <span class="placeholder placeholder-sm" style="width: 25px;"></span></a>
            </div>
          </div>
        `;
        return cardDiv;
    }

    for (let i = 0; i < 3; i++) {
        container.appendChild(createPlaceholderCard());
    }

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

            // Clear placeholders
            container.innerHTML = '';

            let lastYear = null;

            nodes.forEach(node => {
                const title = node.querySelector("attribute[name='title-contrib']")?.textContent || 'No title available';
                let authors = node.querySelector("attribute[name='author-contrib']")?.textContent || 'No authors available';
                const venue = node.querySelector("attribute[name='journal-title']")?.textContent ||
                    node.querySelector("attribute[name='congresstitle']")?.textContent || 'No venue available';
                const year = node.querySelector("attribute[name='year']")?.textContent?.split('-')[0] || 'No year available';
                const doi = node.querySelector("attribute[name='doi']")?.textContent;
                let www = node.querySelector("attribute[name='www-address']")?.textContent;
                const pdf = node.querySelector("file[mime-type='application/pdf']")?.getAttribute('filename');
                const id = node.getAttribute('id')

                // Format the authors string
                if (authors.includes(';')) {
                    // change lastname; firstname -> firstname lastname
                    authors = authors.split(';').map(name => {
                        let [last, first] = name.trim().split(', ');
                        if (!first) return last;
                        return `${first} ${last}`;
                    }).join(', ');
                }
                // underline my name
                authors = authors.split(',').map(name => {
                    return name.split('*').map(name => name.includes("Tobias Ladner") ? `<u>${name}</u>` : name).join('*');
                });
                // combine authors
                if (authors.length === 2) {
                    authors = authors.join(' and ');
                } else {
                    authors = authors.join(', ').replace(/, ([^,]+)$/, ', and $1');
                }

                // Insert a year header if the year changes
                if (year !== lastYear) {
                    const yearHeader = document.createElement('h4');
                    yearHeader.className = 'year-header';
                    yearHeader.textContent = year;
                    container.appendChild(yearHeader);
                    lastYear = year;
                }

                // format www
                if (www.toLowerCase().includes('openrevie')) {
                    www = www.split(';')[0];
                } else {
                    www = undefined
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
              ${www ? `<a href="${www}" target="_blank" class="btn btn-outline-secondary btn-sm me-2"><i class="bi bi-search"></i> OpenReview</a>` : ''}
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