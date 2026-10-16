(() => {
    const favoriteButton = document.querySelector('[data-favorite-id]');
    const galleryButton = document.querySelector('[data-profile-gallery-open]');
    const pageTitle = favoriteButton?.dataset.favoriteTitle || 'Hyrule';
    let status = document.querySelector('#interaction-status');

    if (!status) {
        status = document.createElement('p');
        status.id = 'interaction-status';
        status.className = 'interaction-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        document.body.append(status);
    }

    let statusTimeout = 0;
    const announce = message => {
        status.textContent = message;
        status.classList.add('is-visible');
        window.clearTimeout(statusTimeout);
        statusTimeout = window.setTimeout(() => status.classList.remove('is-visible'), 3000);
    };

    const readFavorites = () => {
        try {
            const saved = JSON.parse(localStorage.getItem('hyrule-favorites') || '[]');
            if (!Array.isArray(saved)) throw new TypeError('La colección guardada no tiene un formato válido.');
            return saved.filter(id => typeof id === 'string');
        } catch (error) {
            announce('No se pudieron leer los favoritos guardados en este navegador.');
            return [];
        }
    };

    const renderFavorite = () => {
        if (!favoriteButton) return;
        const selected = readFavorites().includes(favoriteButton.dataset.favoriteId);
        favoriteButton.setAttribute('aria-pressed', String(selected));
        favoriteButton.textContent = selected ? '♥ GUARDADO EN FAVORITOS' : '♡ GUARDAR EN FAVORITOS';
    };

    favoriteButton?.addEventListener('click', () => {
        const favorites = readFavorites();
        const id = favoriteButton.dataset.favoriteId;
        const selected = favorites.includes(id);
        const nextFavorites = selected
            ? favorites.filter(favoriteId => favoriteId !== id)
            : [...favorites, id];
        try {
            localStorage.setItem('hyrule-favorites', JSON.stringify(nextFavorites));
            renderFavorite();
            announce(selected ? `${pageTitle} se quitó de tus favoritos.` : `${pageTitle} se guardó en tus favoritos.`);
        } catch (error) {
            announce('No se pudieron guardar los favoritos en este navegador.');
        }
    });
    window.addEventListener('storage', event => {
        if (event.key === 'hyrule-favorites') renderFavorite();
    });
    renderFavorite();

    if (!galleryButton) return;
    const mainImage = document.querySelector('.story-portrait img, .ganondorf-portrait img, .sword-art img');
    if (!mainImage) return;

    const galleryItems = [
        {
            src: mainImage.currentSrc || mainImage.src,
            alt: mainImage.alt,
            caption: `${pageTitle} · Imagen principal`
        },
        {
            src: galleryButton.dataset.galleryExtra,
            alt: galleryButton.dataset.galleryExtraAlt || '',
            caption: galleryButton.dataset.galleryExtraCaption || pageTitle
        }
    ].filter(item => item.src);
    let galleryIndex = 0;
    let touchStartX = null;

    const dialog = document.createElement('dialog');
    dialog.className = 'profile-gallery-dialog';
    dialog.setAttribute('aria-label', `Galería de ${pageTitle}`);
    dialog.innerHTML = `
        <button class="profile-gallery-close" type="button" aria-label="Cerrar galería">×</button>
        <button class="profile-gallery-nav profile-gallery-prev" type="button" aria-label="Imagen anterior">←</button>
        <figure><img alt=""><figcaption></figcaption></figure>
        <p class="profile-gallery-count" aria-live="polite"></p>
        <button class="profile-gallery-nav profile-gallery-next" type="button" aria-label="Siguiente imagen">→</button>`;
    document.body.append(dialog);

    const image = dialog.querySelector('img');
    const caption = dialog.querySelector('figcaption');
    const count = dialog.querySelector('.profile-gallery-count');
    const closeButton = dialog.querySelector('.profile-gallery-close');
    const previousButton = dialog.querySelector('.profile-gallery-prev');
    const nextButton = dialog.querySelector('.profile-gallery-next');
    const renderGalleryItem = index => {
        galleryIndex = (index + galleryItems.length) % galleryItems.length;
        const item = galleryItems[galleryIndex];
        image.src = item.src;
        image.alt = item.alt;
        caption.textContent = item.caption;
        count.textContent = `${galleryIndex + 1} / ${galleryItems.length}`;
    };

    galleryButton.addEventListener('click', () => {
        renderGalleryItem(0);
        dialog.showModal();
        closeButton.focus();
    });
    closeButton.addEventListener('click', () => dialog.close());
    previousButton.addEventListener('click', () => renderGalleryItem(galleryIndex - 1));
    nextButton.addEventListener('click', () => renderGalleryItem(galleryIndex + 1));
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            renderGalleryItem(galleryIndex - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            renderGalleryItem(galleryIndex + 1);
        }
    });
    image.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch') touchStartX = event.clientX;
    }, { passive: true });
    image.addEventListener('pointerup', event => {
        if (touchStartX === null) return;
        const swipeDistance = event.clientX - touchStartX;
        touchStartX = null;
        if (Math.abs(swipeDistance) < 45) return;
        renderGalleryItem(galleryIndex + (swipeDistance < 0 ? 1 : -1));
    }, { passive: true });
    image.addEventListener('pointercancel', () => {
        touchStartX = null;
    }, { passive: true });
})();
