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

    const yearHeader = document.createElement('h4');
    yearHeader.className = 'year-header placeholder-glow';
    yearHeader.innerHTML = '<span class="placeholder" style="width: 60px;"></span>';
    container.appendChild(yearHeader);

    for (let i = 0; i < 3; i++) {
        container.appendChild(createPlaceholderCard());
    }

    fetch(apiUrl)
        .then(response => response.text())
        .then(xmlText => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
            const nodes = Array.from(xmlDoc.getElementsByTagName('node'));

            // Extract all data once per node
            const pubs = nodes.map(node => {
                const title = node.querySelector("attribute[name='title-contrib']")?.textContent || node.querySelector("attribute[name='reporttitle']")?.textContent || 'No title available';
                const rawAuthors = node.querySelector("attribute[name='author-contrib']")?.textContent || node.querySelector("attribute[name='author']")?.textContent || 'No authors available';
                const venue = node.querySelector("attribute[name='journal-title']")?.textContent ||
                    node.querySelector("attribute[name='congresstitle']")?.textContent ||
                    node.querySelector("attribute[name='contracting-organization']")?.textContent || 'No venue available';
                const year = node.querySelector("attribute[name='year']")?.textContent?.split('-')[0] || 'No year available';
                let doi = node.querySelector("attribute[name='doi']")?.textContent;
                if (doi) doi = `https://doi.org/${doi}`;
                let www = node.querySelector("attribute[name='www-address']")?.textContent;
                const pdf = node.querySelector("file[mime-type='application/pdf']")?.getAttribute('filename');
                const id = node.getAttribute('id');

                // Determine author priority:
                // 0 = sole first author, 1 = shared first author, 2 = remaining, 3 = competition report
                const isCompetition = /ARCH-COMP|VNN-COMP/i.test(title) || /ARCH-COMP|VNN-COMP/i.test(venue);
                const isArxiv = /arxiv/i.test(venue);
                let priority = 2;
                let isFirstAuthored = false;

                if (isCompetition) {
                    priority = 3;
                } else if (rawAuthors.includes(';')) {
                    const authorList = rawAuthors.split(';').map(a => a.trim());
                    const firstAuthor = authorList[0];
                    const hasAsterisk = authorList.some(a => a.includes('*'));
                    if (/Ladner/.test(firstAuthor) && /Tobias/.test(firstAuthor)) {
                        priority = hasAsterisk ? 1 : 0;
                        isFirstAuthored = true;
                    } else if (authorList.some(a => a.includes('*') && /Ladner/.test(a) && /Tobias/.test(a))) {
                        priority = 1;
                        isFirstAuthored = true;
                    }
                } else {
                    const firstPart = rawAuthors.split(',')[0].trim();
                    if (/Tobias\s+Ladner/.test(firstPart)) {
                        priority = rawAuthors.includes('*') ? 1 : 0;
                        isFirstAuthored = true;
                    } else if (/Tobias\s+Ladner\s*\*/.test(rawAuthors)) {
                        priority = 1;
                        isFirstAuthored = true;
                    }
                }

                // Format authors
                let authors = rawAuthors;
                if (authors.includes(';')) {
                    authors = authors.split(';').map(name => {
                        let [last, first] = name.trim().split(', ');
                        if (!first) return last;
                        return `${first} ${last}`;
                    }).join(', ');
                }
                authors = authors.split(',').map(name => {
                    return name.split('*').map(part => part.includes("Tobias Ladner") ? `<u>${part}</u>` : part).join('*');
                });
                if (authors.length === 2) {
                    authors = authors.join(' and ');
                } else {
                    authors = authors.join(', ').replace(/, ([^,]+)$/, ', and $1');
                }

                // Format links
                let openreview = undefined;
                if (www?.toLowerCase().includes('openreview')) {
                    openreview = www.split(';')[0];
                } else if (!doi && www) {
                    doi = www.split(';')[0];
                } else {
                    www = undefined;
                }

                return {
                    title, authors, venue, year,
                    yearNum: parseInt(year, 10) || 0,
                    doi, openreview, pdf, id,
                    priority, isArxiv: isArxiv ? 1 : 0,
                    isCompetition, isFirstAuthored,
                    isPreprint: isArxiv && !isCompetition,
                };
            });

            // Sort: year (desc), author priority, arxiv last, title (asc)
            pubs.sort((a, b) => {
                if (a.yearNum !== b.yearNum) return b.yearNum - a.yearNum;
                if (a.priority !== b.priority) return a.priority - b.priority;
                if (a.isArxiv !== b.isArxiv) return a.isArxiv - b.isArxiv;
                return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
            });

            // Clear placeholders and render
            container.innerHTML = '';
            let lastYear = null;

            pubs.forEach(pub => {
                if (pub.year !== lastYear) {
                    const yearHeader = document.createElement('h4');
                    yearHeader.className = 'year-header';
                    yearHeader.textContent = pub.year;
                    container.appendChild(yearHeader);
                    lastYear = pub.year;
                }

                const cardDiv = document.createElement('div');
                cardDiv.className = 'card mb-4';
                cardDiv.innerHTML = `
          <div class="card-body">
            <h5 class="card-title mb-3">${pub.title}</h5>
            <p class="card-text mb-2">${pub.authors}<br><small class="text-muted">${pub.venue}, ${pub.year}</small></p>
            <div>
              ${pub.doi ? `<a href="${pub.doi}" target="_blank" class="btn btn-outline-primary btn-sm me-2"><i class="bi bi-link-45deg"></i> DOI</a>` : ''}
              ${pub.openreview ? `<a href="${pub.openreview}" target="_blank" class="btn btn-outline-secondary btn-sm me-2"><i class="bi bi-search"></i> OpenReview</a>` : ''}
              ${pub.pdf ? `<a href="https://mediatum.ub.tum.de/doc/${pub.id}/${pub.pdf}" target="_blank" class="btn btn-outline-secondary btn-sm"><i class="bi bi-file-earmark-pdf"></i> PDF</a>` : ''}
            </div>
          </div>
        `;
                container.appendChild(cardDiv);
            });

            // Summary statistics
            const firstAuthoredCount = pubs.filter(p => p.isFirstAuthored).length;
            const preprintCount = pubs.filter(p => p.isPreprint).length;
            const competitionCount = pubs.filter(p => p.isCompetition).length;

            const summary = document.createElement('p');
            summary.className = 'text-center text-muted mt-3';
            summary.style.fontSize = '0.75rem';
            summary.textContent = `${pubs.length} publications · ${firstAuthoredCount} (co-)first-authored · ${preprintCount} preprints · ${competitionCount} competition reports`;
            container.appendChild(summary);
        })
        .catch(error => {
            console.error('Error fetching or parsing XML:', error);
            container.innerHTML = '<div class="alert alert-danger">Error loading publications. Please try again later.</div>';
        });
});
