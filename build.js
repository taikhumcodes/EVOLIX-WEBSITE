#!/usr/bin/env node
/* ==========================================================================
   EVOLIX — build.js
   Dependency-free static site builder.

   What it does:
   - Reads partials/header.html and partials/footer.html once
   - Reads every page template in pages/**
   - Replaces @@HEADER@@ / @@FOOTER@@ tokens with the shared partials
   - Replaces @@ROOT@@ tokens everywhere with the correct relative path
     prefix ('' for root-level pages, '../' for pages one folder deep)
   - Replaces @@ACTIVE:key@@ tokens in the navbar with 'is-active' when
     that page's nav key matches, or '' otherwise
   - Writes the final, plain static HTML files to the project root —
     exactly the files you deploy, no server or framework required at runtime

   Run it any time you edit a partial or a page:
     node build.js

   Add a new page:
     1. Create pages/your-page.html (or pages/services/your-service.html)
     2. Add one entry to the PAGES array below
     3. Run: node build.js
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var ROOT_DIR = __dirname;
var PARTIALS_DIR = path.join(ROOT_DIR, 'partials');
var PAGES_DIR = path.join(ROOT_DIR, 'pages');

/* ---------------------------------------------------------------------
   Page manifest — every page the site builds, its nav key (for the
   active-link highlight), and its output path relative to project root.
--------------------------------------------------------------------- */
var PAGES = [
  { src: 'index.html', out: 'index.html', nav: 'home' },
  { src: 'services.html', out: 'services.html', nav: 'services' },
  { src: 'services/website-development.html', out: 'services/website-development.html', nav: 'services' },
  { src: 'services/branding.html', out: 'services/branding.html', nav: 'services' },
  { src: 'services/amazon-aplus-content.html', out: 'services/amazon-aplus-content.html', nav: 'services' },
  { src: 'services/product-photography.html', out: 'services/product-photography.html', nav: 'services' },
  { src: 'services/custom-software.html', out: 'services/custom-software.html', nav: 'services' },
  { src: 'services/digital-marketing.html', out: 'services/digital-marketing.html', nav: 'services' },
  { src: 'work.html', out: 'work.html', nav: 'work' },
  { src: 'about.html', out: 'about.html', nav: 'about' },
  { src: 'faq.html', out: 'faq.html', nav: 'faq' },
  { src: 'contact.html', out: 'contact.html', nav: 'contact' }
];

var ACTIVE_TOKEN_RE = /@@ACTIVE:([a-z]+)@@/g;
var ROOT_TOKEN_RE = /@@ROOT@@/g;

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function ensureDirExists(filePath) {
  var dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function rootPrefixFor(outPath) {
  var depth = outPath.split('/').length - 1; // e.g. 'services/foo.html' -> 1
  return depth > 0 ? '../'.repeat(depth) : '';
}

function resolveActiveTokens(html, navKey) {
  return html.replace(ACTIVE_TOKEN_RE, function (_, key) {
    return key === navKey ? 'is-active' : '';
  });
}

function build() {
  var headerRaw = readFile(path.join(PARTIALS_DIR, 'header.html'));
  var footerRaw = readFile(path.join(PARTIALS_DIR, 'footer.html'));

  var builtCount = 0;

  PAGES.forEach(function (page) {
    var srcPath = path.join(PAGES_DIR, page.src);
    if (!fs.existsSync(srcPath)) {
      console.warn('  ! Skipping missing page source: pages/' + page.src);
      return;
    }

    var rootPrefix = rootPrefixFor(page.out);

    var header = resolveActiveTokens(headerRaw, page.nav);
    header = header.replace(ROOT_TOKEN_RE, rootPrefix);

    var footer = footerRaw.replace(ROOT_TOKEN_RE, rootPrefix);

    var pageHtml = readFile(srcPath);
    pageHtml = pageHtml.replace('@@HEADER@@', header);
    pageHtml = pageHtml.replace('@@FOOTER@@', footer);
    pageHtml = pageHtml.replace(ROOT_TOKEN_RE, rootPrefix);

    var outPath = path.join(ROOT_DIR, page.out);
    ensureDirExists(outPath);
    fs.writeFileSync(outPath, pageHtml, 'utf8');

    builtCount++;
    console.log('  ✓ ' + page.out);
  });

  console.log('\nBuilt ' + builtCount + ' page(s).');
}

build();
