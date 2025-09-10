// =========================================
// DARKX — main.js (polished CTI popup)
// =========================================
document.addEventListener('DOMContentLoaded', function() {
    // Helpers
    function qs(sel, root) { return (root || document).querySelector(sel); }

    function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function esc(s) { return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

    // Year
    var yearEl = qs('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Theme
    var THEME_KEY = 'theme';

    function getStoredTheme() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }

    function setStoredTheme(v) { try { localStorage.setItem(THEME_KEY, v); } catch (e) {} }

    function prefersDark() { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }

    function currentTheme() { return getStoredTheme() || (prefersDark() ? 'dark' : 'light'); }

    function updateThemeIcons(t) { qsa('.theme-toggle i').forEach(i => { i.className = (t === 'light') ? 'ri-sun-line' : 'ri-moon-line'; }); }

    function applyTheme(t) {
        var v = (t === 'light') ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', v);
        setStoredTheme(v);
        updateThemeIcons(v);
    }

    function toggleTheme() { applyTheme((getStoredTheme() || currentTheme()) === 'light' ? 'dark' : 'light'); }
    applyTheme(currentTheme());
    var themeBtn = qs('#themeToggle'),
        themeBtn2 = qs('#themeToggleMobile');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (themeBtn2) themeBtn2.addEventListener('click', toggleTheme);

    // Mobile menu
    var hamburger = qs('.hamburger'),
        mobileMenu = qs('#mobileMenu');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            var open = mobileMenu && mobileMenu.style.display === 'flex';
            if (mobileMenu) mobileMenu.style.display = open ? 'none' : 'flex';
            hamburger.setAttribute('aria-expanded', String(!open));
        });
    }
    if (mobileMenu) { qsa('a', mobileMenu).forEach(a => a.addEventListener('click', function() { mobileMenu.style.display = 'none'; if (hamburger) hamburger.setAttribute('aria-expanded', 'false'); })); }

    // Smooth scroll
    qsa('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            var id = this.getAttribute('href').slice(1),
                t = qs('#' + id);
            if (t) {
                e.preventDefault();
                t.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    function updateBrandLogo(theme) {
        var img = document.getElementById('brandLogo') || document.querySelector('.brand-logo img');
        if (!img) return;
        var darkSrc = img.getAttribute('data-logo-dark');
        var lightSrc = img.getAttribute('data-logo-light');
        var desired = (theme === 'light') ? (lightSrc || img.src) : (darkSrc || img.src);
        // Avoid unnecessary reloads
        var abs = desired ? new URL(desired, location.href).href : '';
        if (abs && img.src !== abs) img.src = abs;
    }

    function applyTheme(t) {
        var val = (t === 'light') ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', val);
        try { localStorage.setItem('theme', val); } catch (e) {}
        document.querySelectorAll('.theme-toggle i').forEach(function(el) {
            el.className = (val === 'light') ? 'ri-sun-line' : 'ri-moon-line';
        });
        updateBrandLogo(val); // <— call here
    }
    var initialTheme = currentTheme ? currentTheme() : (localStorage.getItem('theme') || 'dark');
    applyTheme(initialTheme);
    updateBrandLogo(initialTheme);

    // Scroll spy
    var sections = qsa('section[id]');
    var navLinks = qsa('header .menu a[href^="#"]').concat(qsa('#mobileMenu a[href^="#"]')).concat(qsa('.footer-nav a[href^="#"]'));

    function setActive(id) {
        navLinks.forEach(a => {
            var h = a.getAttribute('href').slice(1);
            if (h === id) a.classList.add('active');
            else a.classList.remove('active');
        });
    }

    function updateActive() {
        if (!sections.length) return;
        var mid = window.innerHeight / 2,
            cur = sections[0];
        for (var i = 0; i < sections.length; i++) { var r = sections[i].getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) { cur = sections[i]; break; } }
        setActive(cur.id);
    }
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    updateActive();

    // Filters + See more
    function initSection(sectionEl) {
        var chips = qsa('.chip[data-filter]', sectionEl),
            items = qsa('.masonry .box', sectionEl),
            btn = qs('.see-more-btn', sectionEl);
        var limit = parseInt(sectionEl.getAttribute('data-limit') || '9999', 10),
            step = parseInt(sectionEl.getAttribute('data-step') || String(limit), 10);
        var state = { limit: limit, step: step, shown: limit };

        function applyClamp() {
            items.forEach(it => it.classList.remove('is-clamped'));
            var vis = items.filter(it => !it.classList.contains('is-hidden'));
            vis.forEach((it, idx) => { if (idx >= state.shown) it.classList.add('is-clamped'); });
            if (btn) {
                var hidden = Math.max(vis.length - state.shown, 0);
                if (vis.length > state.limit) {
                    btn.style.display = 'inline-flex';
                    btn.textContent = hidden > 0 ? ('See more (' + hidden + ')') : 'Show less';
                    btn.setAttribute('aria-expanded', hidden <= 0 ? 'true' : 'false');
                } else btn.style.display = 'none';
            }
        }

        function applyFilter(cat) {
            items.forEach(it => {
                var cats = (it.getAttribute('data-category') || '').split(',').map(s => s.trim());
                if (cat === 'all' || cats.includes(cat)) it.classList.remove('is-hidden');
                else it.classList.add('is-hidden');
            });
            state.shown = state.limit;
            applyClamp();
        }
        chips.forEach(c => c.addEventListener('click', function() {
            chips.forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            applyFilter(this.getAttribute('data-filter'));
        }));
        if (btn) {
            btn.addEventListener('click', function() {
                var vis = items.filter(it => !it.classList.contains('is-hidden'));
                if (state.shown < vis.length) state.shown += state.step;
                else state.shown = state.limit;
                applyClamp();
            });
        }
        var init = (qs('.chip.active', sectionEl) || qs('.chip[data-filter="all"]', sectionEl));
        applyFilter(init ? init.getAttribute('data-filter') : 'all');
    }
    qsa('.section').forEach(sec => { if (qs('.filters', sec) && qs('.masonry', sec)) initSection(sec); });

    // ---------- CTI PDF Viewer ----------
    var pdfViewer = qs('#pdfViewer'),
        pdfFrame = qs('#pdfFrame'),
        pdfTitle = pdfViewer ? qs('.pdf-title', pdfViewer) : null,
        pdfOpenTab = qs('#pdfOpenTab'),
        pdfDownload = qs('#pdfDownload'),
        pdfClose = qs('#pdfClose');

    function hostLabel(u) { var h = new URL(u, location.href).hostname; return h.includes('drive.google.com') ? 'Google Drive' : 'original site'; }

    function canEmbed(u) { return (new URL(u, location.href)).origin === location.origin; }

    function clearNotice() { if (!pdfViewer) return; var n = qs('.pdf-notice', pdfViewer); if (n) n.remove(); }

    function showNotice(html) {
        if (!pdfViewer) return;
        clearNotice();
        var div = document.createElement('div');
        div.className = 'pdf-notice';
        div.innerHTML = html;
        pdfViewer.appendChild(div);
    }

    function summaryCardHTML(title, summary, url, tags, cover, fallbackImgSrc, ctaLabel) {
        var parts = String(summary || '').split('|').map(s => s.trim()).filter(Boolean);
        var lead = parts.shift() || ('This report is hosted externally and can be viewed on ' + hostLabel(url) + '.');
        var bulletsHTML = parts.length ? ('<ul class="pdf-bullets">' + parts.map(li => '<li>' + esc(li) + '</li>').join('') + '</ul>') : '';
        var chips = (tags || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 8).map(t => '<span class="chip">' + esc(t) + '</span>').join('');
        var coverSrc = cover || fallbackImgSrc || '';
        var coverHTML = coverSrc ? ('<div class="pdf-cover"><img src="' + esc(coverSrc) + '" alt="Cover"></div>') : '<div class="pdf-cover" style="display:none"></div>';
        var btnText = ctaLabel || 'Open PDF';

        return (
            '<div class="pdf-card">' +
            '<div class="pdf-meta">' +
            coverHTML +
            '<div class="pdf-content">' +
            '<h3>' + esc(title || 'CTI Report') + '</h3>' +
            (chips ? '<div class="pdf-tags">' + chips + '</div>' : '') +
            '<p class="pdf-lead">' + esc(lead) + '</p>' +
            bulletsHTML +
            '<div class="pdf-actions">' +
            '<a href="' + url + '" target="_blank" rel="noopener" class="btn"><i class="ri-file-pdf-2-line"></i>&nbsp;' + esc(btnText) + '</a>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>'
        );
    }

    function openPdfViewer(url, title, summary, tags, cover, fallbackImg, ctaLabel) {
        var absolute = new URL(url, location.href).href;
        if (!pdfViewer) { window.open(absolute, '_blank'); return; }

        if (pdfTitle) pdfTitle.textContent = title || 'CTI Report';
        if (pdfOpenTab) pdfOpenTab.href = absolute;
        if (pdfDownload) {
            pdfDownload.href = absolute;
            pdfDownload.setAttribute('download', (absolute.split('/').pop() || 'report.pdf'));
        }

        pdfViewer.classList.add('open');
        document.body.style.overflow = 'hidden';

        var sameOrigin = (new URL(absolute)).origin === location.origin;

        if (!sameOrigin) {
            showNotice(summaryCardHTML(title, summary, absolute, tags, cover, fallbackImg, ctaLabel));
            if (pdfFrame) pdfFrame.src = '';
            return;
        }

        showNotice('<div class="pdf-card" style="text-align:center;color:#c9d6ea;">Loading report…</div>');
        var loaded = false;

        function onLoad() {
            loaded = true;
            clearNotice();
        }

        function onFail() {
            if (loaded) return;
            if (summary || cover || fallbackImg) showNotice(summaryCardHTML(title, summary, absolute, tags, cover, fallbackImg, ctaLabel));
            else showNotice('<div class="pdf-card" style="text-align:center;color:#c9d6ea;">Could not load the PDF. <a class="icon-btn" href="' + absolute + '" target="_blank" rel="noopener" style="width:auto;height:auto;padding:.5rem .8rem;margin-left:.4rem;">Open in new tab</a></div>');
        }

        if (pdfFrame) {
            if (window.fetch) {
                fetch(absolute, { method: 'HEAD' }).then(function(res) {
                    if (!res.ok) throw new Error('not found');
                    pdfFrame.onload = onLoad;
                    pdfFrame.src = absolute;
                    setTimeout(onFail, 7000);
                }).catch(onFail);
            } else {
                pdfFrame.onload = onLoad;
                pdfFrame.src = absolute;
                setTimeout(onFail, 7000);
            }
        }
    }



    function closePdfViewer() {
        if (!pdfViewer) return;
        pdfViewer.classList.remove('open');
        document.body.style.overflow = '';

        // Clear iframe and notices
        if (pdfFrame) pdfFrame.src = '';
        var n = qs('.pdf-notice', pdfViewer);
        if (n) n.remove();

        // NEW: restore document title and remove #pdf=… from URL
        setPdfDocTitle(null);
        clearPdfHash();
    }



    // Close interactions
    function closePdfViewer() {
        if (!pdfViewer) return;
        pdfViewer.classList.remove('open');
        document.body.style.overflow = '';
        if (pdfFrame) pdfFrame.src = '';
        clearNotice();
    }
    var pdfClose = qs('#pdfClose');
    if (pdfClose) pdfClose.addEventListener('click', closePdfViewer);
    if (pdfViewer) { pdfViewer.addEventListener('click', function(e) { if (e.target === pdfViewer) closePdfViewer(); }); }
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && pdfViewer && pdfViewer.classList.contains('open')) closePdfViewer(); });

    // CTI: open viewer with summary (cover + custom CTA)
    qsa('.masonry .item img[data-link]').forEach(function(img) {
        var fallback = img.getAttribute('src');
        var link = img.getAttribute('data-link');
        var summary = img.getAttribute('data-summary') || '';
        var tags = img.getAttribute('data-tags') || '';
        var cover = img.getAttribute('data-cover') || '';
        var cta = img.getAttribute('data-cta') || 'Open PDF';

        var overlay = img.closest('.item') ? qs('.overlay', img.closest('.item')) : null;
        if (overlay && !qs('.dl-btn', overlay)) {
            var a = document.createElement('a');
            a.href = link;
            a.className = 'dl-btn';
            a.innerHTML = '<i class="ri-eye-line"></i> View PDF';
            overlay.appendChild(a);
            a.addEventListener('click', function(e) {
                e.preventDefault();
                openPdfViewer(link, img.alt || 'CTI Report', summary, tags, cover, fallback, cta);
            });
        }
        img.addEventListener('click', function(e) {
            e.preventDefault();
            openPdfViewer(link, img.alt || 'CTI Report', summary, tags, cover, fallback, cta);
        });

    });


    // Projects → GitHub
    qsa('.masonry .item img[data-repo]').forEach(function(img) {
        var repo = img.getAttribute('data-repo');
        var overlay = img.closest('.item') ? qs('.overlay', img.closest('.item')) : null;
        if (overlay && !qs('.repo-btn', overlay)) {
            var a = document.createElement('a');
            a.href = repo;
            a.target = '_blank';
            a.rel = 'noopener';
            a.className = 'repo-btn';
            a.innerHTML = '<i class="ri-github-fill"></i> View Repo';
            overlay.appendChild(a);
            a.addEventListener('click', function(e) { e.stopPropagation(); });
        }
        img.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(repo, '_blank', 'noopener');
        });
    });

    // Lightbox for non-CTI/non-repo images
    var lightbox = qs('#lightbox'),
        lbImg = lightbox ? qs('img', lightbox) : null,
        lbCaption = lightbox ? qs('.caption', lightbox) : null,
        btnClose = lightbox ? qs('.close', lightbox) : null,
        btnPrev = lightbox ? qs('.prev', lightbox) : null,
        btnNext = lightbox ? qs('.next', lightbox) : null;
    var currentIndex = 0,
        currentScope = null;

    function visibleImages(scope) { var root = scope || document; return qsa('.masonry .item:not(.is-hidden):not(.is-clamped) img:not([data-link]):not([data-repo])', root); }

    function openLightbox(img) {
        if (!lightbox || !lbImg) return;
        var full = img.getAttribute('data-full') || img.getAttribute('src');
        lbImg.src = full;
        lbImg.alt = img.alt || '';
        if (lbCaption) lbCaption.textContent = img.alt || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox || !lbImg) return;
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        lbImg.src = '';
    }

    function showByIndex(idx) {
        var list = visibleImages(currentScope);
        if (!list.length) return;
        currentIndex = (idx + list.length) % list.length;
        openLightbox(list[currentIndex]);
    }
    qsa('.masonry .item img:not([data-link]):not([data-repo])').forEach(function(img) {
        img.addEventListener('click', function(e) {
            currentScope = this.closest('.section');
            var list = visibleImages(currentScope);
            var idx = Math.max(0, list.indexOf(e.currentTarget));
            currentIndex = idx;
            openLightbox(e.currentTarget);
        });
    });
    if (btnClose) btnClose.addEventListener('click', closeLightbox);
    if (btnPrev) btnPrev.addEventListener('click', function() { showByIndex(currentIndex - 1); });
    if (btnNext) btnNext.addEventListener('click', function() { showByIndex(currentIndex + 1); });
    if (lightbox) { lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLightbox(); }); }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightbox && lightbox.classList.contains('open')) closeLightbox();
        if (lightbox && lightbox.classList.contains('open')) { if (e.key === 'ArrowLeft') showByIndex(currentIndex - 1); if (e.key === 'ArrowRight') showByIndex(currentIndex + 1); }
    });

    // Back to top
    var toTop = qs('#toTop');
    if (toTop) {
        window.addEventListener('scroll', function() {
            var y = window.scrollY || document.documentElement.scrollTop || 0;
            if (y > 600) toTop.classList.add('show');
            else toTop.classList.remove('show');
        }, { passive: true });
        toTop.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }
});

function sendMail() {
    let parms = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        subject: document.getElementById("subject").value,
        message: document.getElementById("message").value
    }

    emailjs.send("service_bmnmuyw", "template_94m9tja", parms).then(alert("Email has been sent !!!"))
}