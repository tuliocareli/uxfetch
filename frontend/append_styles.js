const fs = require('fs');
const styles = `
/* Header Navigation */
.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo-link {
    display: flex;
    align-items: center;
}

.desktop-nav {
    display: flex;
    gap: 32px;
    align-items: center;
}

.nav-link {
    color: var(--text-dark);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
}

.nav-link:hover {
    color: var(--primary);
}

/* Mobile Menu Button */
.mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    width: 30px;
    height: 24px;
    flex-direction: column;
    justify-content: space-between;
    z-index: 1000;
}

.mobile-menu-btn span {
    display: block;
    width: 100%;
    height: 3px;
    background-color: var(--text-dark);
    border-radius: 3px;
    transition: all 0.3s ease;
}

/* Mobile Overlay */
.mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--primary);
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
}

.mobile-menu-overlay.active {
    opacity: 1;
    pointer-events: all;
}

.mobile-menu-content {
    text-align: center;
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.close-menu-btn {
    position: absolute;
    top: 24px;
    right: 24px;
    background: none;
    border: none;
    color: var(--white);
    font-size: 40px;
    cursor: pointer;
    line-height: 1;
}

.mobile-nav {
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.mobile-nav-link {
    color: var(--white);
    text-decoration: none;
    font-size: 2rem;
    font-weight: 700;
    transition: opacity 0.2s ease;
}

.mobile-nav-link:hover {
    opacity: 0.8;
}

/* Jobs Grid (Mural de Vagas) */
.jobs-hero {
    text-align: center;
    padding: 64px 24px 32px;
    max-width: 800px;
    margin: 0 auto;
}

.jobs-hero h1 {
    font-size: 3rem;
    font-weight: 700;
    color: var(--black);
    margin-bottom: 16px;
    line-height: 1.1;
    letter-spacing: -0.03em;
}

.jobs-hero p {
    font-size: 1.25rem;
    color: #4A5568;
}

.jobs-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px 64px;
}

.jobs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
}

.job-card {
    background: var(--white);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 12px rgba(0, 85, 255, 0.05);
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    height: 100%;
}

.job-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 85, 255, 0.1);
}

.job-badges {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.job-badge {
    background-color: var(--bg-blue-light);
    color: var(--primary);
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}

.job-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-dark);
    margin-bottom: 8px;
    line-height: 1.3;
}

.job-company {
    font-size: 1rem;
    color: #4A5568;
    margin-bottom: 8px;
    font-weight: 500;
}

.job-location {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.job-description {
    font-size: 0.875rem;
    color: #4A5568;
    line-height: 1.5;
    flex-grow: 1;
    margin-bottom: 24px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.job-btn {
    display: inline-block;
    background-color: var(--primary);
    color: var(--white);
    text-decoration: none;
    text-align: center;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: background-color 0.2s ease;
    width: 100%;
    margin-top: auto;
}

.job-btn:hover {
    background-color: var(--primary-dark);
}

.job-date {
    font-size: 0.75rem;
    color: #A0AEC0;
    text-align: right;
    margin-top: 16px;
}

/* Media Queries Updates */
@media (max-width: 768px) {
    .desktop-nav {
        display: none;
    }
    .mobile-menu-btn {
        display: flex;
    }
}
`;
fs.appendFileSync('e:/Scraper/frontend/styles.css', styles);
console.log('Appended successfully');
