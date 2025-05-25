document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const toggleIcon = darkModeToggle.querySelector('i');

    function setTheme(theme) {
        document.body.setAttribute('data-bs-theme', theme);
        toggleIcon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
        localStorage.setItem('theme', theme);
    }

    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
        setTheme(storedTheme);
    } else {
        setTheme(systemPrefersDark ? 'dark' : 'light');
    }

    darkModeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-bs-theme');
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
    });
});

// enable tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))