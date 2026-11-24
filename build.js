import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

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

// Build timestamp fallback for assets generated after this script (e.g., tailwind.css)
const BUILD_VERSION = String(Date.now());

// In-memory cache of SHA-256 content hashes (canonicalPath -> 8-char hex digest)
const ASSET_HASH_CACHE = new Map();

// Tracks referenced local assets that do not exist in `public/` (causes build failure)
const MISSING_ASSETS = new Set();

// Assets generated after `build.js` completes (e.g., Tailwind CLI step in `npm run build`)
const POST_BUILD_ASSETS = new Set([
    '/css/tailwind.css'
]);

// Load package metadata
const PACKAGE_JSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const APP_VERSION = PACKAGE_JSON.version || '2.0.0';

// Global App Config from JSON
const APP_CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const SUPPORTED_LANGS = APP_CONFIG.supportedLangs;
const SUPPORTED_LANG_CODES = Object.keys(SUPPORTED_LANGS);
const DEFAULT_LANG = APP_CONFIG.defaultLang;

// DOM Selectors
const LANG_SWITCHERS = ['#language-switcher', '#language-switcher-mobile'];

// Project Pages & SEO Config
const BASE_URL = 'https://hearme.tech';
const PAGES_TO_BUILD = [
    'index.html',
    'invest.html',
    'waitlist.html',
    'testing.html',
    '404.html'
];

const SEO_PAGES = [
    { file: 'index.html', path: '', priority: '1.00', changefreq: 'weekly' },
    { file: 'invest.html', path: 'invest', priority: '0.80', changefreq: 'monthly' },
    { file: 'waitlist.html', path: 'waitlist', priority: '0.20', changefreq: 'monthly' },
    { file: 'testing.html', path: 'testing', priority: '0.90', changefreq: 'monthly' }
];

// Exclusions
const EXCLUDED_SCRIPTS = ['maintenance.js'];
const EXCLUDED_STYLES = ['input.css'];
const ROBOTS_DISALLOW_PATHS = ['/404.html', '/maintenance.html'];

// Selectors for local static assets that should receive automatic `?v=<hash>` versioning
const VERSIONED_LINK_SELECTOR = [
    'link[rel="stylesheet"][href]',
    'link[rel="icon"][href]',
    'link[rel="shortcut icon"][href]',
    'link[rel="apple-touch-icon"][href]',
    'link[rel="manifest"][href]'
].join(', ');


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
    ASSET_HASH_CACHE.clear();
    MISSING_ASSETS.clear();
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
    return pagePath === '' ? `${BASE_URL}/${lang}/` : `${BASE_URL}/${lang}/${pagePath}`;
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
 * Returns an 8-character SHA-256 content hash for a built file in `public/`.
 * Falls back to `BUILD_VERSION` only for whitelisted post-build assets (e.g., tailwind.css).
 * Records any other missing local asset so the build fails loudly.
 *
 * @param {string} rootRelativePath - e.g. '/images/logo-full.png'
 * @returns {string}
 */
function getAssetVersion(rootRelativePath) {
    const normalizedPath = rootRelativePath.replace(/^\/+/, '');
    const canonicalPath = `/${normalizedPath}`;

    if (ASSET_HASH_CACHE.has(canonicalPath)) {
        return ASSET_HASH_CACHE.get(canonicalPath);
    }

    const fullPath = path.join(PUBLIC_DIR, normalizedPath);
    let version = BUILD_VERSION;

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const fileBuffer = fs.readFileSync(fullPath);
        version = crypto.createHash('sha256').update(fileBuffer).digest('hex').slice(0, 8);
    } else if (!POST_BUILD_ASSETS.has(canonicalPath)) {
        MISSING_ASSETS.add(canonicalPath);
    }

    ASSET_HASH_CACHE.set(canonicalPath, version);
    return version;
}

/**
 * Throws a consolidated error if any HTML template referenced a missing local asset.
 */
function assertNoMissingAssets() {
    if (MISSING_ASSETS.size === 0) return;

    const missingList = Array.from(MISSING_ASSETS)
        .sort()
        .map((assetPath) => `  - ${assetPath}`)
        .join('\n');

    throw new Error(`Missing static assets referenced in HTML templates:\n${missingList}`);
}

/**
 * Appends or replaces the `?v=` query parameter on a root-relative asset URL.
 * External URLs, protocol-relative URLs, data URIs, and relative paths are untouched.
 *
 * @param {string} rawUrl
 * @returns {string}
 */
function versionAssetUrl(rawUrl) {
    if (!rawUrl || !rawUrl.startsWith('/') || rawUrl.startsWith('//')) {
        return rawUrl;
    }

    let parsed;
    try {
        parsed = new URL(rawUrl, 'http://local.build');
    } catch {
        return rawUrl;
    }

    const version = getAssetVersion(parsed.pathname);
    parsed.searchParams.set('v', version);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

/**
 * Versions every URL inside an HTML `srcset` attribute while preserving descriptors (e.g., 1x, 2x, 480w).
 *
 * @param {string} srcsetValue
 * @returns {string}
 */
function versionSrcset(srcsetValue) {
    if (!srcsetValue) return srcsetValue;

    return srcsetValue
        .split(',')
        .map((candidate) => {
            const parts = candidate.trim().split(/\s+/);
            if (parts.length === 0 || !parts[0]) return candidate;
            parts[0] = versionAssetUrl(parts[0]);
            return parts.join(' ');
        })
        .join(', ');
}

/**
 * Automatically applies content-hash cache-busting to all local static assets in the DOM.
 * Eliminates the need for manual `?v=1` query strings in source HTML templates.
 *
 * @param {import('cheerio').CheerioAPI} $
 */
function applyAssetVersioning($) {
    $('script[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src) $(el).attr('src', versionAssetUrl(src));
    });

    $(VERSIONED_LINK_SELECTOR).each((_, el) => {
        const href = $(el).attr('href');
        if (href) $(el).attr('href', versionAssetUrl(href));
    });

    $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src) $(el).attr('src', versionAssetUrl(src));
    });

    $('source[srcset]').each((_, el) => {
        const srcset = $(el).attr('srcset');
        if (srcset) $(el).attr('srcset', versionSrcset(srcset));
    });

    $('[data-svg-src]').each((_, el) => {
        const svgSrc = $(el).attr('data-svg-src');
        if (svgSrc) $(el).attr('data-svg-src', versionAssetUrl(svgSrc));
    });
}

/**
 * Appends the current build version to relative local ES module imports inside JS files
 * (e.g., `from './firebase-init.js'` -> `from './firebase-init.js?v=...'`).
 * External CDN imports (https://...) remain untouched.
 */
function applyJsImportCacheBusting(jsContent) {
    // Handles static imports/re-exports (`from './...'`, `import './...'`) and dynamic `import('./...')`
    return jsContent.replace(
        /(\b(?:from|import)\s*\(?\s*['"])(\.\.?\/[^'"?]+\.js)(?:\?v=[^'"]*)?(['"])/g,
        `$1$2?v=${BUILD_VERSION}$3`
    );
}

/**
 * Safely retrieves a nested value from an object using a dot-notation path.
 */
function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Recursively copies a directory, skipping files listed in the exclude array.
 * Optionally applies cache-busting to local ES module imports inside `.js` files.
 */
function copyDirectory(src, dest, exclude = [], options = {}) {
    if (!fs.existsSync(src)) return;

    const { versionJsImports = false } = options;
    ensureDirExists(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        if (exclude.includes(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, exclude, options);
        } else if (versionJsImports && entry.name.endsWith('.js')) {
            const rawJs = fs.readFileSync(srcPath, 'utf8');
            const versionedJs = applyJsImportCacheBusting(rawJs);
            fs.writeFileSync(destPath, versionedJs, 'utf8');
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

    copyDirectory(
        path.join(SRC_DIR, 'scripts'),
        path.join(PUBLIC_DIR, 'js'),
        EXCLUDED_SCRIPTS,
        { versionJsImports: true }
    );
    console.log(`✅ Scripts copied to /js with versioned ES imports (excluded: ${EXCLUDED_SCRIPTS.join(', ')})`);

    copyDirectory(path.join(SRC_DIR, 'assets'), path.join(PUBLIC_DIR, 'images'));
    console.log('✅ Assets copied to /images');

    copyDirectory(path.join(SRC_DIR, 'styles'), path.join(PUBLIC_DIR, 'css'), EXCLUDED_STYLES);
    console.log(`✅ Custom styles copied to /css (excluded: ${EXCLUDED_STYLES.join(', ')})`);
}

/**
 * Processes HTML: injects components, translations, SEO metadata, links, and asset hashes.
 */
function translateHTML(html, translations, lang, components, pagePath) {
    const $ = cheerio.load(html);

    $('html').attr('lang', lang);

    // Inject partials
    if (components.header) $('#header-placeholder').replaceWith(components.header);
    if (components.footer) $('#footer-placeholder').replaceWith(components.footer);

    // --- Language Switcher ---
    const optionsHtml = SUPPORTED_LANG_CODES.map((code) => {
        const selected = code === lang ? 'selected' : '';
        return `<option value="${code}" ${selected}>${SUPPORTED_LANGS[code]}</option>`;
    }).join('\n                ');

    LANG_SWITCHERS.forEach((selector) => {
        $(selector).html(`\n                ${optionsHtml}\n            `);
    });
    // ------------------------

    // Update Canonical and Open Graph URLs
    const pageUrl = getPageUrl(lang, pagePath);
    $('link[rel="canonical"]').attr('href', pageUrl);
    $('meta[property="og:url"]').attr('content', pageUrl);
    $('meta[name="twitter:url"]').attr('content', pageUrl);

    // Inject hreflang alternatives
    let hreflangTags = '\n    \n';
    SUPPORTED_LANG_CODES.forEach((altLang) => {
        const altUrl = getPageUrl(altLang, pagePath);
        hreflangTags += `    <link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
    });
    const defaultUrl = `${BASE_URL}/en/${pagePath ? pagePath : ''}`;
    hreflangTags += `    <link rel="alternate" hreflang="x-default" href="${defaultUrl}" />\n`;
    $('head').append(hreflangTags);

    // Inject global configuration
    const configScript = `\n    \n    <script>window.APP_CONFIG = ${JSON.stringify(APP_CONFIG)};</script>\n`;
    $('head').prepend(configScript);

    // Inject synchronous theme initializer at the top of <head> to prevent FOUC
    const themeInitScript = `
    <script>
        (function() {
            try {
                var savedTheme = localStorage.getItem('theme');
                var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (e) {}
        })();
    </script>`;
    $('head').prepend(themeInitScript);

    // Translate contents based on data-i18n attributes
    $('[data-i18n]').each((_, el) => {
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
            } else if (tagName === 'iframe') {
                $(el).attr('src', text);
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

    $('[data-i18n-href]').each((_, el) => {
        const key = $(el).attr('data-i18n-href');
        const link = getNestedValue(translations, key);
        if (link) {
            $(el).attr('href', link);
            $(el).removeAttr('data-i18n-href');
        }
    });

    // Update internal links for localization and anchor behavior
    const langPrefix = `/${lang}`;
    $('a[href^="/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href.startsWith('//')) return; // Ignore external protocol-relative links

        if (href === '/') {
            $(el).attr('href', `${langPrefix}/`);
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

    // Automatically append the current language parameter to all alpha.hearme.tech links
    $('a[href^="https://alpha.hearme.tech"]').each((_, el) => {
        const rawHref = $(el).attr('href');
        if (!rawHref) return;

        try {
            const targetUrl = new URL(rawHref);
            targetUrl.searchParams.set('lang', lang);
            $(el).attr('href', targetUrl.toString());
        } catch {
            // If URL parsing fails, leave the original link unchanged
        }
    });

    // Inject BreadcrumbList JSON-LD for secondary pages
    if (pagePath !== '') {
        const pageTitle = $('title').text() || pagePath;
        const breadcrumbs = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'HearMe',
                    item: `${BASE_URL}/${lang}/`
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: pageTitle,
                    item: pageUrl
                }
            ]
        };
        $('head').append(`\n    <script type="application/ld+json">\n${JSON.stringify(breadcrumbs, null, 2)}\n    </script>\n`);
    }

    // Apply SHA-256 content-hash versioning to all local static assets (including partials)
    applyAssetVersioning($);

    return $.html();
}

/**
 * Generates a zero-flicker root redirector index.html in the public directory.
 */
function generateRootRedirector() {
    const defaultLocalePath = path.join(LOCALES_DIR, `${DEFAULT_LANG}.json`);
    const enTranslations = fs.existsSync(defaultLocalePath)
        ? JSON.parse(fs.readFileSync(defaultLocalePath, 'utf8'))
        : {};

    const title = getNestedValue(enTranslations, 'meta.title') || 'HearMe — AI Speech Recognition';
    const desc = getNestedValue(enTranslations, 'meta.desc') || 'HearMe provides personalized speech recognition for individuals with speech impairments.';
    const ogImageAlt = getNestedValue(enTranslations, 'meta.ogImageAlt') || 'HearMe mobile app interface';
    const ogImage = `${BASE_URL}/images/og-image.png`;
    const schemaData = enTranslations.schema || {};

    const supportedCodes = JSON.stringify(SUPPORTED_LANG_CODES);

    let hreflangTags = '';
    SUPPORTED_LANG_CODES.forEach((lang) => {
        hreflangTags += `    <link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${lang}/" />\n`;
    });
    hreflangTags += `    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/en/" />\n`;

    const rootHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <link rel="canonical" href="${BASE_URL}/" />
${hreflangTags}
    <!-- Open Graph / Facebook / Telegram / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="HearMe">
    <meta property="og:url" content="${BASE_URL}/">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:alt" content="${ogImageAlt}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${BASE_URL}/">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="twitter:image:alt" content="${ogImageAlt}">
    <meta name="twitter:domain" content="hearme.tech">

<script type="application/ld+json">${JSON.stringify(schemaData, null, 2)}</script>

    <script>
        (function() {
            var supported = ${supportedCodes};
            var defaultLang = "${DEFAULT_LANG}";
            var targetLang = null;
            try {
                targetLang = localStorage.getItem('app_lang');
            } catch (e) {}
            if (!targetLang || supported.indexOf(targetLang) === -1) {
                var navLang = (navigator.language || navigator.userLanguage || '').split('-')[0].toLowerCase();
                targetLang = supported.indexOf(navLang) !== -1 ? navLang : defaultLang;
            }
            var destination = '/' + targetLang + '/' + location.search + location.hash;
            location.replace(destination);
        })();
    </script>
    <noscript>
        <meta http-equiv="refresh" content="0; url=/en/">
    </noscript>
</head>
<body style="background-color:#0d1117;margin:0;"></body>
</html>`;

    fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), rootHtml, 'utf8');
    console.log('✅ Root zero-flicker index.html generated!');
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

    SUPPORTED_LANG_CODES.forEach((lang) => {
        const localePath = path.join(LOCALES_DIR, `${lang}.json`);
        let translations = {};

        if (fs.existsSync(localePath)) {
            translations = JSON.parse(fs.readFileSync(localePath, 'utf8'));
        }

        const outputDir = path.join(PUBLIC_DIR, lang);
        ensureDirExists(outputDir);

        PAGES_TO_BUILD.forEach((page) => {
            const templatePath = path.join(SRC_DIR, page);

            if (fs.existsSync(templatePath)) {
                let html = fs.readFileSync(templatePath, 'utf8');
                const pagePath = getPagePath(page);

                html = translateHTML(html, translations, lang, components, pagePath);

                const outputPath = path.join(outputDir, page);
                fs.writeFileSync(outputPath, html, 'utf8');

                console.log(`✅ Generated: /${path.relative(PUBLIC_DIR, outputPath)}`);
            } else {
                console.warn(`⚠️ Template not found: ${templatePath}`);
            }
        });

        // Fallback: Copy English 404 to root /404.html for Firebase rewrite handling
        if (lang === DEFAULT_LANG && fs.existsSync(path.join(outputDir, '404.html'))) {
            let root404Html = fs.readFileSync(path.join(outputDir, '404.html'), 'utf8');

            // Inject an instant redirect script at the top of <head>
            const supportedCodes = JSON.stringify(SUPPORTED_LANG_CODES);
            const smart404Script = `
    <script>
        (function() {
            var supported = ${supportedCodes};
            var defaultLang = "${DEFAULT_LANG}";
            var targetLang = defaultLang;
            try {
                var saved = localStorage.getItem('app_lang');
                if (saved && supported.indexOf(saved) !== -1) {
                    targetLang = saved;
                }
            } catch (e) {}
            if (targetLang !== defaultLang) {
                location.replace('/' + targetLang + '/404');
            }
        })();
    </script>`;

            root404Html = root404Html.replace('<head>', `<head>${smart404Script}`);
            fs.writeFileSync(path.join(PUBLIC_DIR, '404.html'), root404Html, 'utf8');
            console.log('✅ Fallback /404.html created in root public directory');
        }
    });
}

/**
 * Generates dynamic sitemap.xml and robots.txt based on the configuration.
 */
function generateSEOFiles() {
    console.log('🗺️ Generating sitemap.xml and robots.txt...');

    const today = new Date().toISOString().split('T')[0];
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

    // Root domain entry pointing to language alternatives
    sitemapContent += `  <url>\n`;
    sitemapContent += `    <loc>${BASE_URL}/</loc>\n`;
    sitemapContent += `    <lastmod>${today}</lastmod>\n`;
    sitemapContent += `    <changefreq>weekly</changefreq>\n`;
    sitemapContent += `    <priority>1.00</priority>\n`;
    SUPPORTED_LANG_CODES.forEach((altLang) => {
        const altUrl = getPageUrl(altLang, '');
        sitemapContent += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${altUrl}" />\n`;
    });
    sitemapContent += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en/" />\n`;
    sitemapContent += `  </url>\n`;

    SEO_PAGES.forEach((page) => {
        SUPPORTED_LANG_CODES.forEach((lang) => {
            const pageUrl = getPageUrl(lang, page.path);

            sitemapContent += `  <url>\n`;
            sitemapContent += `    <loc>${pageUrl}</loc>\n`;
            sitemapContent += `    <lastmod>${today}</lastmod>\n`;
            sitemapContent += `    <changefreq>${page.changefreq}</changefreq>\n`;
            sitemapContent += `    <priority>${page.priority}</priority>\n`;

            SUPPORTED_LANG_CODES.forEach((altLang) => {
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
    const baseDisallowRules = ROBOTS_DISALLOW_PATHS
        .map((disallowPath) => `Disallow: ${disallowPath}`)
        .join('\n');
    const localized404Rules = SUPPORTED_LANG_CODES
        .map((lang) => `Disallow: /${lang}/404.html`)
        .join('\n');

    const robotsContent = `User-agent: *
Allow: /

${baseDisallowRules}
${localized404Rules}

Sitemap: ${BASE_URL}/sitemap.xml
`;

    fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), `${robotsContent.trim()}\n`, 'utf8');
    console.log('✅ sitemap.xml and robots.txt generated successfully!');
}

/**
 * Generates health.json with deployment and build metadata.
 */
function generateHealthFile() {
    console.log('🩺 Generating health.json...');

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');

    const buildTimeFormatted = `${year}-${month}-${day} ${hours}:${minutes} UTC`;

    const healthData = {
        name: 'hearme-landing-page',
        status: 'ok',
        version: `${APP_VERSION} (build time: ${buildTimeFormatted})`,
        environment: 'production'
    };

    ensureDirExists(PUBLIC_DIR);
    fs.writeFileSync(path.join(PUBLIC_DIR, 'health.json'), `${JSON.stringify(healthData, null, 2)}\n`, 'utf8');
    console.log('✅ health.json generated successfully!');
}

/**
 * EXECUTION PIPELINE
 * ==========================================
 */
try {
    console.log(`🚀 Starting build... Version Hash: ${BUILD_VERSION}`);
    cleanPublicDir();
    copyAssets();
    buildPages();
    assertNoMissingAssets();
    generateRootRedirector();
    generateSEOFiles();
    generateHealthFile();
    console.log(`🎉 Build completed successfully! (${ASSET_HASH_CACHE.size} assets versioned)`);
} catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1); // Ensures CI/CD pipelines fail immediately if an error occurs
}
