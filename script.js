/* Premium cyber interactions + lightweight animations (no heavy deps). */

const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function isLightMode() {
    return document.body.classList.contains('light-mode');
}

function setTheme(theme) {
    const body = document.body;
    const icon = $('#theme-icon');
    const light = theme === 'light';

    body.classList.toggle('light-mode', light);
    localStorage.setItem('theme', light ? 'light' : 'dark');

    if (icon) {
        icon.classList.remove('fa-sun', 'fa-moon');
        icon.classList.add(light ? 'fa-sun' : 'fa-moon');
    }
}

function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
    } else {
        setTheme('dark');
    }

    const toggle = $('#theme-toggle');
    toggle?.addEventListener('click', () => setTheme(isLightMode() ? 'dark' : 'light'));
}

function initMobileMenu() {
    const btn = $('#mobile-toggle');
    const menu = $('#mobile-menu');

    btn?.addEventListener('click', () => {
        const open = !menu?.classList.contains('hidden');
        menu?.classList.toggle('hidden', open);
        btn.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });

    $all('#mobile-menu a[href^="#"]').forEach(a => {
        a.addEventListener('click', () => menu?.classList.add('hidden'));
    });
}

function initSmoothScroll() {
    $all('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#' || !href.startsWith('#')) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        });
    });
}

function initScrollProgress() {
    const bar = $('#scroll-progress');
    if (!bar) return;

    const update = () => {
        const doc = document.documentElement;
        const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
        const p = (doc.scrollTop / max) * 100;
        bar.style.width = `${Math.min(100, Math.max(0, p))}%`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
}

function initCursorGlow() {
    const glow = $('#cursor-glow');
    if (!glow) return;

    const canUse = window.matchMedia?.('(pointer: fine)')?.matches ?? true;
    if (!canUse || prefersReducedMotion) {
        glow.style.display = 'none';
        return;
    }

    let x = window.innerWidth * 0.5;
    let y = window.innerHeight * 0.3;
    let tx = x;
    let ty = y;
    let visible = false;

    const onMove = (e) => {
        tx = e.clientX;
        ty = e.clientY;
        if (!visible) {
            visible = true;
            glow.style.opacity = '1';
        }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', () => { glow.style.opacity = '0'; visible = false; });

    const tick = () => {
        x += (tx - x) * 0.14;
        y += (ty - y) * 0.14;
        glow.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function initTyping() {
    const el = $('#typed-role');
    const caret = $('#typed-caret');
    if (!el) return;

    const phrases = [
        'IT Engineer',
        'Linux System Administrator',
        'Cybersecurity Enthusiast'
    ];

    if (prefersReducedMotion) {
        el.textContent = phrases.join(' | ');
        if (caret) caret.style.display = 'none';
        return;
    }

    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;

    const speedType = 42;
    const speedDelete = 28;
    const pauseEnd = 980;
    const pauseStart = 340;

    const step = () => {
        const phrase = phrases[phraseIdx];
        if (!deleting) {
            charIdx++;
            el.textContent = phrase.slice(0, charIdx);
            if (charIdx >= phrase.length) {
                deleting = true;
                setTimeout(step, pauseEnd);
                return;
            }
            setTimeout(step, speedType);
            return;
        }

        charIdx--;
        el.textContent = phrase.slice(0, Math.max(0, charIdx));
        if (charIdx <= 0) {
            deleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
            setTimeout(step, pauseStart);
            return;
        }
        setTimeout(step, speedDelete);
    };

    step();

    if (caret) {
        let on = true;
        setInterval(() => {
            on = !on;
            caret.style.opacity = on ? '1' : '0';
        }, 520);
    }
}

function initReveal() {
    const targets = $all('[data-reveal]');
    if (!targets.length) return;

    if (prefersReducedMotion) {
        targets.forEach(t => t.classList.add('is-visible'));
        return;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

    targets.forEach(t => io.observe(t));
}

function initActiveNav() {
    const links = $all('a.navlink[href^="#"]');
    const linkById = new Map();
    links.forEach(a => {
        const id = (a.getAttribute('href') || '').slice(1);
        if (id) linkById.set(id, linkById.get(id) ? [...linkById.get(id), a] : [a]);
    });

    const sections = Array.from(linkById.keys())
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (!sections.length) return;

    const clear = () => links.forEach(a => a.classList.remove('active'));

    const io = new IntersectionObserver((entries) => {
        const visible = entries.filter(e => e.isIntersecting)
            .sort((a, b) => (b.intersectionRatio - a.intersectionRatio))[0];
        if (!visible?.target?.id) return;
        clear();
        (linkById.get(visible.target.id) || []).forEach(a => a.classList.add('active'));
    }, { threshold: [0.2, 0.35, 0.5], rootMargin: '-20% 0px -65% 0px' });

    sections.forEach(s => io.observe(s));
}

function animateBarsWhenVisible(containerSel, barSel, levelAttr = 'data-level') {
    const containers = $all(containerSel);
    if (!containers.length) return;

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const bars = entry.target.querySelectorAll(barSel);
            bars.forEach(bar => {
                const span = bar.querySelector('span');
                if (!span) return;

                const targetLevel = bar.getAttribute(levelAttr);
                const inlineWidth = span.style.width;
                const to = targetLevel ? `${Math.max(0, Math.min(100, Number(targetLevel)))}%` : inlineWidth;
                if (!to) return;

                span.style.width = '0%';
                requestAnimationFrame(() => {
                    span.style.transition = prefersReducedMotion ? 'none' : 'width 900ms cubic-bezier(.2,.9,.2,1)';
                    span.style.width = to;
                });
            });
            io.unobserve(entry.target);
        });
    }, { threshold: 0.25, rootMargin: '0px 0px -80px 0px' });

    containers.forEach(c => io.observe(c));
}

function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 3200);
}

function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = /** @type {HTMLInputElement|null} */($('#name'))?.value?.trim() || '';
        const email = /** @type {HTMLInputElement|null} */($('#email'))?.value?.trim() || '';
        const subject = /** @type {HTMLInputElement|null} */($('#subject'))?.value?.trim() || 'Portfolio Contact';
        const message = /** @type {HTMLTextAreaElement|null} */($('#message'))?.value?.trim() || '';

        const body = [
            `Name: ${name}`,
            `Email: ${email}`,
            '',
            message
        ].join('\n');

        const mailto = `mailto:aayushghising482@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        showToast('Opening your email client…');
        window.location.href = mailto;
        form.reset();
    });
}

/* Background: lightweight network particles */
function initBackgroundCanvas() {
    const canvas = /** @type {HTMLCanvasElement|null} */($('#bg-canvas'));
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const particleCount = 70;
    const maxLinkDist = 165;

    /** @type {{x:number,y:number,vx:number,vy:number,r:number}[]} */
    let particles = [];

    const resize = () => {
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
        particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.55,
            vy: (Math.random() - 0.5) * 0.55,
            r: Math.random() * 2 + 0.6
        }));
    };

    const draw = () => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const dot = isLightMode() ? 'rgba(0, 194, 255, 0.28)' : 'rgba(0, 194, 255, 0.36)';
        const linkBase = isLightMode() ? '0, 194, 255' : '0, 194, 255';

        // update
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
            if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
        }

        // links
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i], b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > maxLinkDist) continue;
                const alpha = (1 - dist / maxLinkDist) * 0.55;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${linkBase}, ${alpha})`;
                ctx.lineWidth = 0.6;
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }

        // dots
        ctx.fillStyle = dot;
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(draw);
    };

    resize();
    seed();
    draw();

    window.addEventListener('resize', () => { resize(); seed(); }, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileMenu();
    initSmoothScroll();
    initScrollProgress();
    initCursorGlow();
    initTyping();
    initReveal();
    initActiveNav();
    initContactForm();
    initBackgroundCanvas();

    // Animate hero “console” bars + skill bars on view
    animateBarsWhenVisible('#hero', '.metric .bar');
    animateBarsWhenVisible('#skills', '.skillbar', 'data-level');
});
