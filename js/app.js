/* ============================================
   MaintainIQ - Home Page App Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    updateHeroStats();
    animateNumbers();
});

function updateHeroStats() {
    const assets = getAssets();
    const issues = getIssues();

    const totalAssets = assets.length;
    const pendingIssues = issues.filter(i => i.status === 'Pending').length;
    const resolvedIssues = issues.filter(i => i.status === 'Resolved').length;

    animateValue('hero-assets', 0, totalAssets, 1500);
    animateValue('hero-issues', 0, pendingIssues, 1500);
    animateValue('hero-resolved', 0, resolvedIssues, 1500);
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;

    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime > 0 ? stepTime : 10);

    if (range === 0) {
        element.textContent = end;
    }
}

function animateNumbers() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateHeroStats();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        observer.observe(heroSection);
    }
}
