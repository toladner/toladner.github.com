// Set theme immediately to prevent flash of wrong theme
(function () {
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const storedTheme = localStorage.getItem('theme');
    const theme = storedTheme || (systemPrefersLight ? 'light' : 'dark');
    document.documentElement.setAttribute('data-bs-theme', theme);
})();

document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (!darkModeToggle) return;
    const toggleIcon = darkModeToggle.querySelector('i');

    // Update icon to match current theme
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    toggleIcon.className = currentTheme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';

    function setTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        toggleIcon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
        localStorage.setItem('theme', theme);
    }

    darkModeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
    });
});

// enable tooltips
document.addEventListener("DOMContentLoaded", function () {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});
