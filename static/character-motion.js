(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const progressBar = document.querySelector('.reading-progress');
    const progressFill = progressBar && progressBar.querySelector('span');
    const sectionLinks = [...document.querySelectorAll('header nav a[href^="#"]')]
        .map(link => {
            const target = document.getElementById(link.getAttribute('href').slice(1));
            return target ? { link, target } : null;
        })
        .filter(Boolean);

    if (progressBar && progressFill) {
        let progressFrame = 0;
        const updateReadingState = () => {
            progressFrame = 0;
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollableHeight > 0
                ? Math.min(100, Math.max(0, window.scrollY / scrollableHeight * 100))
                : 0;

            progressFill.style.transform = `scaleX(${progress / 100})`;
            progressBar.setAttribute('aria-valuenow', String(Math.round(progress)));
            progressBar.setAttribute('aria-valuetext', `${Math.round(progress)}% leído`);

            const sectionMarker = window.scrollY + window.innerHeight * 0.32;
            let activeLink = null;
            sectionLinks.forEach(({ link, target }) => {
                if (target.getBoundingClientRect().top + window.scrollY <= sectionMarker) {
                    activeLink = link;
                }
            });
            sectionLinks.forEach(({ link }) => {
                if (link === activeLink) {
                    link.setAttribute('aria-current', 'location');
                } else if (link.getAttribute('aria-current') === 'location') {
                    link.removeAttribute('aria-current');
                }
            });
        };
        const scheduleReadingUpdate = () => {
            if (progressFrame) return;
            progressFrame = requestAnimationFrame(updateReadingState);
        };

        window.addEventListener('scroll', scheduleReadingUpdate, { passive: true });
        window.addEventListener('resize', scheduleReadingUpdate, { passive: true });
        updateReadingState();
    }

    const revealTargets = document.querySelectorAll(
        '.identity-item, .story-portrait, .story-copy, .lore-card, ' +
        '.info-card, .character-card, .game-card, .sword-image-wrap, ' +
        '.era-panel, .hyrule-map, .map-detail, .favorites-list, .favorite-chip, ' +
        '.gallery-item, .quiz-shell, .quiz-result, .archive-search-panel, .contact-section, ' +
        '.ganondorf-stat, .ganondorf-portrait, .ganondorf-copy, .ganondorf-card, ' +
        '.sword-fact, .sword-story-mark, .sword-story-copy, .sword-card'
    );

    if (!reduceMotion && 'IntersectionObserver' in window && revealTargets.length) {
        const observer = new IntersectionObserver((entries, activeObserver) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                activeObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

        revealTargets.forEach((target, index) => {
            target.classList.add('scroll-reveal');
            target.style.setProperty('--reveal-order', String(index % 4));
            observer.observe(target);
        });
    }

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (reduceMotion || !finePointer.matches) return;

    const tiltTargets = document.querySelectorAll(
        '.info-card, .character-card, .game-card, .lore-card, ' +
        '.story-portrait, .ganondorf-card, .ganondorf-portrait, .sword-card, .sword-art, ' +
        '.home-page .sword-image-wrap'
    );
    const addPointerTilt = (target, maxDegrees, maxShift) => {
        let frame = 0;

        const reset = () => {
            cancelAnimationFrame(frame);
            target.classList.remove('is-pointer-active');
            target.style.removeProperty('--tilt-x');
            target.style.removeProperty('--tilt-y');
        };

        target.addEventListener('pointermove', event => {
            if (event.pointerType !== 'mouse') return;
            const bounds = target.getBoundingClientRect();
            const normalizedX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
            const normalizedY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                target.style.setProperty('--tilt-x', `${-normalizedY * maxDegrees}deg`);
                target.style.setProperty('--tilt-y', `${normalizedX * maxDegrees}deg`);
                target.style.setProperty('--pointer-shift-x', `${normalizedX * maxShift}px`);
                target.style.setProperty('--pointer-shift-y', `${normalizedY * maxShift}px`);
                target.classList.add('is-pointer-active');
            });
        });

        target.addEventListener('pointerleave', reset);
        target.addEventListener('pointercancel', reset);
    };

    tiltTargets.forEach(target => addPointerTilt(target, 5, 3));

    const sceneConfigs = [
        {
            surface: document.querySelector('.home-page .hero, .link-site .hero'),
            layers: document.querySelectorAll('.home-page .hero-video, .home-page .hero-overlay, .link-site .hero-background, .link-site .hero-video, .link-site .hero-overlay'),
            foreground: document.querySelector('.home-page .hero-content, .link-site .hero-content')
        },
        {
            surface: document.querySelector('.zelda-site .hero'),
            layers: document.querySelectorAll('.zelda-site .hero-background'),
            foreground: document.querySelector('.zelda-site .hero-content')
        },
        {
            surface: document.querySelector('.ganondorf-page .ganondorf-hero'),
            layers: document.querySelectorAll('.ganondorf-page .ganondorf-backdrop'),
            foreground: document.querySelector('.ganondorf-page .ganondorf-hero-content')
        },
        {
            surface: document.querySelector('.sword-page .sword-hero'),
            layers: document.querySelectorAll('.sword-page .sword-backdrop'),
            foreground: document.querySelector('.sword-page .sword-copy')
        }
    ].filter(scene => scene.surface);

    sceneConfigs.forEach(({ surface, layers, foreground }) => {
        let frame = 0;
        const reset = () => {
            cancelAnimationFrame(frame);
            layers.forEach(layer => {
                layer.classList.remove('is-pointer-active');
                layer.style.removeProperty('--pointer-shift-x');
                layer.style.removeProperty('--pointer-shift-y');
            });
            if (foreground) {
                foreground.style.removeProperty('--pointer-shift-x');
                foreground.style.removeProperty('--pointer-shift-y');
            }
        };

        surface.addEventListener('pointermove', event => {
            if (event.pointerType !== 'mouse') return;
            const bounds = surface.getBoundingClientRect();
            const normalizedX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
            const normalizedY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                layers.forEach(layer => {
                    layer.style.setProperty('--pointer-shift-x', `${normalizedX * 9}px`);
                    layer.style.setProperty('--pointer-shift-y', `${normalizedY * 9}px`);
                    layer.classList.add('is-pointer-active');
                });
                if (foreground) {
                    foreground.style.setProperty('--pointer-shift-x', `${normalizedX * -4}px`);
                    foreground.style.setProperty('--pointer-shift-y', `${normalizedY * -4}px`);
                }
            });
        });

        surface.addEventListener('pointerleave', reset);
        surface.addEventListener('pointercancel', reset);
    });
})();
