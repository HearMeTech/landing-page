import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import process from 'node:process';

/**
 * ==========================================
 * CONFIGURATION & CONSTANTS
 * ==========================================
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory paths
const SRC_DIR = path.join(__dirname, 'src');
const PUBLIC_DIR = path.join(__dirname, 'public');
const LOCALES_DIR = path.join(SRC_DIR, 'locales');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

// Build hash for cache-busting
const BUILD_VERSION = Date.now();

// Global App Config from JSON
const APP_CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const SUPPORTED_LANGS = APP_CONFIG.supportedLangs;
const DEFAULT_LANG = APP_CONFIG.defaultLang;
const BASE_URL = 'https://hearme.tech';

// Project Pages & SEO Config
const PAGES_TO_BUILD = ['index.html', 'invest.html', 'waitlist.html', '404.html'];

const SEO_PAGES = [
    { file: 'index.html', path: '', priority: '1.00', changefreq: 'weekly' },
    { file: 'invest.html', path: 'invest', priority: '0.80', changefreq: 'monthly' },
    { file: 'waitlist.html', path: 'waitlist', priority: '0.20', changefreq: 'monthly' }
];

// Exclusions
const EXCLUDED_SCRIPTS = ['maintenance.js'];
const EXCLUDED_STYLES = ['input.css'];
const ROBOTS_DISALLOW_PATHS = ['/404.html', '/maintenance.html'];


/**
 * ==========================================
 * UTILITY FUNCTIONS
 * ==========================================
 */

/**
 * Safely removes the public directory to ensure a clean build.
 */
function cleanPublicDir() {
    console.log('🧹 Cleaning public directory...');
    if (fs.existsSync(PUBLIC_DIR)) {
        fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
        console.log('✅ Public directory cleaned.');
    }
}

/**
 * Extracts the relative path from a filename (e.g., 'invest.html' -> 'invest').
 */
function getPagePath(pageFileName) {
    return pageFileName === 'index.html' ? '' : pageFileName.replace('.html', '');
}

/**
 * Constructs the absolute localized URL for a given page and language.
 */
function getPageUrl(lang, pagePath) {
    const langPart = lang === DEFAULT_LANG ? '' : `${lang}/`;
    return pagePath === '' ? `${BASE_URL}/${langPart}` : `${BASE_URL}/${langPart}${pagePath}`;
}

/**
 * Creates a directory recursively if it doesn't exist.
 */
function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Appends the current build version to asset queries to bust browser cache.
 */
function applyCacheBusting(htmlContent) {
    return htmlContent.replace(/(\?v=)[^"']+/g, `$1${BUILD_VERSION}`);
}

/**
 * Safely retrieves a nested value from an object using a dot-notation path.
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Recursively copies a directory, skipping files listed in the exclude array.
 */
function copyDirectory(src, dest, exclude = []) {
    if (!fs.existsSync(src)) return;
    
    ensureDirExists(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        if (exclude.includes(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, exclude);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}


/**
 * ==========================================
 * CORE BUILD FUNCTIONS
 * ==========================================
 */

/**
 * Copies all static assets (scripts, images, styles) to the public folder.
 */
function copyAssets() {
    console.log('📦 Copying assets...');
    
    copyDirectory(path.join(SRC_DIR, 'scripts'), path.join(PUBLIC_DIR, 'js'), EXCLUDED_SCRIPTS);
    console.log(`✅ Scripts copied to /js (excluded: ${EXCLUDED_SCRIPTS.join(', ')})`);

    copyDirectory(path.join(SRC_DIR, 'assets'), path.join(PUBLIC_DIR, 'images'));
    console.log('✅ Assets copied to /images');

    copyDirectory(path.join(SRC_DIR, 'styles'), path.join(PUBLIC_DIR, 'css'), EXCLUDED_STYLES);
    console.log(`✅ Custom styles copied to /css (excluded: ${EXCLUDED_STYLES.join(', ')})`);
}

/**
 * Processes HTML: injects components, translations, SEO metadata, and updates links.
 */
function translateHTML(html, translations, lang, components, pagePath) {
    const $ = cheerio.load(html);

    $('html').attr('lang', lang);

    // Inject partials
    if (components.header) $('#header-placeholder').replaceWith(components.header);
    if (components.footer) $('#footer-placeholder').replaceWith(components.footer);

    // Remove obsolete SPA scripts
    $('script[src*="anti-fouc.js"]').remove();
    $('script[src*="i18n.js"]').remove();

    // Update Canonical and Open Graph URLs
    const pageUrl = getPageUrl(lang, pagePath);
    $('link[rel="canonical"]').attr('href', pageUrl);
    $('meta[property="og:url"]').attr('content', pageUrl);
    $('meta[name="twitter:url"]').attr('content', pageUrl);

    // Inject hreflang alternatives
    let hreflangTags = '\n    \n';
    SUPPORTED_LANGS.forEach(altLang => {
        const altUrl = getPageUrl(altLang, pagePath);
        hreflangTags += `    <link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
    });
    const defaultUrl = getPageUrl(DEFAULT_LANG, pagePath);
    hreflangTags += `    <link rel="alternate" hreflang="x-default" href="${defaultUrl}" />\n`;
    $('head').append(hreflangTags);

    // Inject global configuration
    const configScript = `\n    \n    <script>window.APP_CONFIG = ${JSON.stringify(APP_CONFIG)};</script>\n`;
    $('head').prepend(configScript);

    // Translate contents based on data-i18n attributes
    $('[data-i18n]').each((i, el) => {
        const key = $(el).attr('data-i18n');
        const text = getNestedValue(translations, key);

        if (text) {
            const tagName = el.tagName.toLowerCase();

            if (tagName === 'input' || tagName === 'textarea') {
                $(el).attr('placeholder', text);
            } else if (tagName === 'meta') {
                $(el).attr('content', text);
            } else if (tagName === 'title') {
                $(el).text(text);
            } else if (tagName === 'script') {
                $(el).html(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
            } else {
                $(el).html(text);
            }
            
            $(el).removeAttr('data-i18n');
        } else {
            console.warn(`⚠️ Missing translation: [${key}] for language [${lang}]`);
        }
    });

    // Update internal links for localization and anchor behavior
    const langPrefix = lang === 'en' ? '' : `/${lang}`;
    $('a[href^="/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href.startsWith('//')) return; // Ignore external protocol-relative links

        if (href === '/') {
            $(el).attr('href', langPrefix === '' ? '/' : `${langPrefix}/`);
        } else if (href.startsWith('/#')) {
            if (pagePath === '') {
                $(el).attr('href', href.substring(1)); // Convert to pure anchor on home page
            } else {
                $(el).attr('href', `${langPrefix}${href}`);
            }
        } else {
            $(el).attr('href', `${langPrefix}${href}`);
        }
    });

    return $.html();
}

/**
 * Main build process for generating HTML files for all languages.
 */
function buildPages() {
    ensureDirExists(PUBLIC_DIR);

    const components = {
        header: fs.existsSync(path.join(COMPONENTS_DIR, 'header.html')) 
            ? fs.readFileSync(path.join(COMPONENTS_DIR, 'header.html'), 'utf8') : '',
        footer: fs.existsSync(path.join(COMPONENTS_DIR, 'footer.html')) 
            ? fs.readFileSync(path.join(COMPONENTS_DIR, 'footer.html'), 'utf8') : ''
    };

    SUPPORTED_LANGS.forEach(lang => {
        const localePath = path.join(LOCALES_DIR, `${lang}.json`);
        let translations = {};
        
        if (fs.existsSync(localePath)) {
            translations = JSON.parse(fs.readFileSync(localePath, 'utf8'));
        }

        const outputDir = lang === DEFAULT_LANG ? PUBLIC_DIR : path.join(PUBLIC_DIR, lang);
        ensureDirExists(outputDir);

        PAGES_TO_BUILD.forEach(page => {
            const templatePath = path.join(SRC_DIR, page);
            
            if (fs.existsSync(templatePath)) {
                let html = fs.readFileSync(templatePath, 'utf8');
                const pagePath = getPagePath(page);

                html = translateHTML(html, translations, lang, components, pagePath);
                html = applyCacheBusting(html);

                const outputPath = path.join(outputDir, page);
                fs.writeFileSync(outputPath, html, 'utf8');
                
                console.log(`✅ Generated: /${path.relative(PUBLIC_DIR, outputPath)}`);
            } else {
                console.warn(`⚠️ Template not found: ${templatePath}`);
            }
        });
    });
}

/**
 * Generates dynamic sitemap.xml and robots.txt based on the configuration.
 */
function generateSEOFiles() {
    console.log('🗺️ Generating sitemap.xml and robots.txt...');
    
    const today = new Date().toISOString().split('T')[0];
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

    SEO_PAGES.forEach(page => {
        SUPPORTED_LANGS.forEach(lang => {
            const pageUrl = getPageUrl(lang, page.path);

            sitemapContent += `  <url>\n`;
            sitemapContent += `    <loc>${pageUrl}</loc>\n`;
            sitemapContent += `    <lastmod>${today}</lastmod>\n`;
            sitemapContent += `    <changefreq>${page.changefreq}</changefreq>\n`;
            sitemapContent += `    <priority>${page.priority}</priority>\n`;
            
            SUPPORTED_LANGS.forEach(altLang => {
                const altUrl = getPageUrl(altLang, page.path);
                sitemapContent += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
            });
            
            const defaultUrl = getPageUrl(DEFAULT_LANG, page.path);
            sitemapContent += `    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultUrl}" />\n`;
            sitemapContent += `  </url>\n`;
        });
    });

    sitemapContent += `</urlset>`;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapContent, 'utf8');

    // Generate robots.txt
    const baseDisallowRules = ROBOTS_DISALLOW_PATHS.map(path => `Disallow: ${path}`).join('\n');
    const localized404Rules = SUPPORTED_LANGS
        .filter(lang => lang !== DEFAULT_LANG)
        .map(lang => `Disallow: /${lang}/404.html`)
        .join('\n');

    const robotsContent = `User-agent: *
Allow: /

${baseDisallowRules}
${localized404Rules}

Sitemap: ${BASE_URL}/sitemap.xml
`;
    
    fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsContent.trim() + '\n', 'utf8');
    console.log('✅ sitemap.xml and robots.txt generated successfully!');
}


/**
 * ==========================================
 * EXECUTION PIPELINE
 * ==========================================
 */
try {
    console.log(`🚀 Starting build... Version Hash: ${BUILD_VERSION}`);
    cleanPublicDir();
    copyAssets();
    buildPages();
    generateSEOFiles();
    console.log('🎉 Build completed successfully!');
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1); // Ensures CI/CD pipelines fail immediately if an error occurs
}
