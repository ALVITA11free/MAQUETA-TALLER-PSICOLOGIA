/**
 * Historicus Tuluá - Plataforma de Memoria Histórica Local
 * Lógica de Navegación, Galería Flotante con Deep-Linking,
 * Edición Wiki en Vivo y Formulario Comunitario de Tuluá
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. GESTIÓN DE NAVEGACIÓN (Home, Monuments, Add Monument)
    // =========================================================================
    const navHome = document.getElementById('nav-home');
    const navMonuments = document.getElementById('nav-monuments');
    const navAddMonument = document.getElementById('nav-add-monument');

    const viewHome = document.getElementById('view-home');
    const viewMonuments = document.getElementById('view-monuments');
    const viewAddMonument = document.getElementById('view-add-monument');

    const allNavLinks = [navHome, navMonuments, navAddMonument];
    const allViews = [viewHome, viewMonuments, viewAddMonument];

    function switchView(viewName, targetScrollId = null) {
        allNavLinks.forEach(link => {
            if (link) link.classList.remove('active');
        });
        allViews.forEach(view => {
            if (view) {
                view.classList.add('hidden');
                view.classList.remove('active');
            }
        });

        if (viewName === 'monuments') {
            if (navMonuments) navMonuments.classList.add('active');
            if (viewMonuments) {
                viewMonuments.classList.remove('hidden');
                viewMonuments.classList.add('active');
            }
            window.location.hash = targetScrollId ? `monuments&target=${targetScrollId}` : 'monuments';

            if (targetScrollId) {
                setTimeout(() => {
                    scrollToAndHighlightMonument(targetScrollId);
                }, 120);
            }
        } else if (viewName === 'add-monument') {
            if (navAddMonument) navAddMonument.classList.add('active');
            if (viewAddMonument) {
                viewAddMonument.classList.remove('hidden');
                viewAddMonument.classList.add('active');
            }
            window.location.hash = 'add-monument';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            if (navHome) navHome.classList.add('active');
            if (viewHome) {
                viewHome.classList.remove('hidden');
                viewHome.classList.add('active');
            }
            window.location.hash = 'home';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        updateWordCounts();
        hideToolbar();
    }

    function scrollToAndHighlightMonument(elementId) {
        const targetEl = document.getElementById(elementId);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetEl.classList.remove('monument-highlight-pulse');
            void targetEl.offsetWidth; // Trigger reflow
            targetEl.classList.add('monument-highlight-pulse');
        }
    }

    if (navHome) {
        navHome.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('home');
        });
    }

    if (navMonuments) {
        navMonuments.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('monuments');
        });
    }

    if (navAddMonument) {
        navAddMonument.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('add-monument');
        });
    }

    const btnQuickAdd = document.getElementById('btn-quick-add-monument');
    if (btnQuickAdd) {
        btnQuickAdd.addEventListener('click', () => switchView('add-monument'));
    }

    const btnCancelAdd = document.getElementById('btn-cancel-add');
    if (btnCancelAdd) {
        btnCancelAdd.addEventListener('click', () => switchView('monuments'));
    }

    // =========================================================================
    // 2. REDIRECCIÓN DESDE TARJETAS/IMÁGENES FLOTANTES DE LA HOME
    // =========================================================================
    function bindFloatingCardClicks() {
        const floatingCards = document.querySelectorAll('.floating-monument-card');
        floatingCards.forEach(card => {
            const targetId = card.getAttribute('data-monument-target');
            if (!targetId) return;

            card.onclick = () => {
                switchView('monuments', targetId);
            };

            card.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    switchView('monuments', targetId);
                }
            };
        });
    }

    // =========================================================================
    // 3. FORMULARIO 'ADD MONUMENT' Y CARGA DE IMÁGENES
    // =========================================================================
    const formAddMonument = document.getElementById('form-add-monument');
    const dropzone = document.getElementById('monument-dropzone');
    const fileInput = document.getElementById('monument-image-input');
    const dropzoneIdle = document.getElementById('dropzone-idle-content');
    const dropzonePreview = document.getElementById('dropzone-preview-content');
    const imagePreview = document.getElementById('image-preview');
    const previewFilename = document.getElementById('preview-filename');
    const btnRemoveImage = document.getElementById('btn-remove-image');
    const btnBrowseFile = document.getElementById('btn-browse-file');

    let currentImageDataUrl = '';

    if (btnBrowseFile && fileInput) {
        btnBrowseFile.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => {
            if (!currentImageDataUrl) {
                fileInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                processImageFile(files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                processImageFile(e.target.files[0]);
            }
        });
    }

    function processImageFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast('⚠️ Por favor selecciona un archivo de imagen válido');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            currentImageDataUrl = event.target.result;
            if (imagePreview) imagePreview.src = currentImageDataUrl;
            if (previewFilename) previewFilename.textContent = file.name;
            if (dropzoneIdle) dropzoneIdle.classList.add('hidden');
            if (dropzonePreview) dropzonePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    if (btnRemoveImage) {
        btnRemoveImage.addEventListener('click', (e) => {
            e.stopPropagation();
            currentImageDataUrl = '';
            if (fileInput) fileInput.value = '';
            if (imagePreview) imagePreview.src = '';
            if (dropzonePreview) dropzonePreview.classList.add('hidden');
            if (dropzoneIdle) dropzoneIdle.classList.remove('hidden');
        });
    }

    // =========================================================================
    // 4. PERSISTENCIA DE MONUMENTOS PERSONALIZADOS
    // =========================================================================
    const STORAGE_KEY_CUSTOM_MONUMENTS = 'historicus_tulua_custom_monuments_v1';
    let customMonuments = [];

    function loadCustomMonuments() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_MONUMENTS);
            if (saved) {
                customMonuments = JSON.parse(saved);
                renderAllCustomMonuments();
            }
        } catch (err) {
            console.error('Error al cargar monumentos personalizados:', err);
        }
    }

    function saveCustomMonumentsToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY_CUSTOM_MONUMENTS, JSON.stringify(customMonuments));
        } catch (err) {
            console.error('Error al guardar monumento en localStorage:', err);
        }
    }

    function renderAllCustomMonuments() {
        const customContainer = document.getElementById('custom-monuments-container');
        const homeFloatingGrid = document.getElementById('home-floating-monuments-grid');
        const monumentsToc = document.getElementById('monuments-toc-list');

        if (!customContainer) return;
        customContainer.innerHTML = '';

        if (homeFloatingGrid) {
            const dynamicCards = homeFloatingGrid.querySelectorAll('.floating-monument-card[data-dynamic="true"]');
            dynamicCards.forEach(c => c.remove());
        }

        if (monumentsToc) {
            const dynamicToc = monumentsToc.querySelectorAll('li[data-dynamic="true"]');
            dynamicToc.forEach(t => t.remove());
        }

        customMonuments.forEach((mon, index) => {
            // 1. Insertar en la página de Monumentos
            const monSection = document.createElement('div');
            monSection.className = 'wiki-section monument-detail-block';
            monSection.id = mon.id;
            monSection.setAttribute('data-section-id', mon.id);

            let imageBlockHTML = '';
            if (mon.image && mon.image.trim() !== '') {
                imageBlockHTML = `
                    <div class="monument-hero-media">
                        <img src="${mon.image}" alt="${escapeHTML(mon.title)}" class="monument-hero-img">
                        <div class="media-caption">
                            <span>Registro fotográfico comunitario: ${escapeHTML(mon.title)}</span>
                        </div>
                    </div>
                `;
            } else {
                imageBlockHTML = `
                    <div class="user-image-placeholder-container">
                        <div class="placeholder-graphic-box">
                            <span class="placeholder-icon">📍</span>
                            <span class="placeholder-exact-text">[El usuario subirá la imagen aquí]</span>
                            <small class="placeholder-caption-sub">Registro visual: ${escapeHTML(mon.title)}</small>
                        </div>
                    </div>
                `;
            }

            let quoteHTML = '';
            if (mon.quote && mon.quote.trim() !== '') {
                quoteHTML = `
                    <blockquote class="wiki-quote" contenteditable="true">
                        "${escapeHTML(mon.quote)}"
                        <footer class="quote-author">— Testimonio registrado por la ciudadanía tulueña.</footer>
                    </blockquote>
                `;
            }

            let metaLocation = mon.location ? ` | Ubicación: ${escapeHTML(mon.location)}` : '';
            let metaYear = mon.year ? ` (${escapeHTML(mon.year)})` : '';

            monSection.innerHTML = `
                ${imageBlockHTML}
                <div class="section-heading-bar">
                    <h2 class="wiki-h2" contenteditable="true">${escapeHTML(mon.title)}</h2>
                    <span class="monument-type-tag">${escapeHTML(mon.category)}</span>
                </div>
                <p class="wiki-editable-p" contenteditable="true">
                    ${escapeHTML(mon.description)}
                </p>
                ${quoteHTML}
            `;
            customContainer.appendChild(monSection);

            // 2. Insertar en la galería flotante de la Home
            if (homeFloatingGrid) {
                const animClass = `float-anim-${(index % 3) + 1}`;
                const floatCard = document.createElement('article');
                floatCard.className = `floating-monument-card ${animClass}`;
                floatCard.setAttribute('data-monument-target', mon.id);
                floatCard.setAttribute('data-dynamic', 'true');
                floatCard.setAttribute('tabindex', '0');
                floatCard.setAttribute('role', 'button');
                floatCard.setAttribute('aria-label', `Ver ${escapeHTML(mon.title)}`);

                let floatMediaHTML = '';
                if (mon.image && mon.image.trim() !== '') {
                    floatMediaHTML = `
                        <div class="floating-img-wrapper">
                            <img src="${mon.image}" alt="${escapeHTML(mon.title)}" class="floating-img" loading="lazy">
                            <span class="floating-pill-tag">${escapeHTML(mon.category)}${metaYear}</span>
                        </div>
                    `;
                } else {
                    floatMediaHTML = `
                        <div class="floating-placeholder-box">
                            <span class="placeholder-tag">[El usuario subirá la imagen aquí]</span>
                            <span class="floating-pill-tag">${escapeHTML(mon.category)}${metaYear}</span>
                        </div>
                    `;
                }

                floatCard.innerHTML = `
                    ${floatMediaHTML}
                    <div class="floating-card-body">
                        <h3 class="floating-card-title">${escapeHTML(mon.title)}</h3>
                        <p class="floating-card-desc">${escapeHTML(mon.description.slice(0, 110))}...</p>
                        <span class="floating-cta">Ver sección detallada &rarr;</span>
                    </div>
                `;
                homeFloatingGrid.appendChild(floatCard);
            }

            // 3. Añadir al índice TOC
            if (monumentsToc) {
                const tocLi = document.createElement('li');
                tocLi.setAttribute('data-dynamic', 'true');
                tocLi.innerHTML = `<a href="#${mon.id}">${4 + index}. ${escapeHTML(mon.title)}</a>`;
                monumentsToc.appendChild(tocLi);
            }
        });

        // Actualizar contador del infobox
        const totalMonEl = document.getElementById('infobox-total-monuments');
        if (totalMonEl) {
            totalMonEl.textContent = `${3 + customMonuments.length} lugares emblemáticos documentados`;
        }

        bindFloatingCardClicks();
        rebindEditableListeners();
        updateWordCounts();
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Envío del Formulario 'Add Monument'
    if (formAddMonument) {
        formAddMonument.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('monument-title').value.trim();
            const category = document.getElementById('monument-category').value;
            const year = document.getElementById('monument-year').value.trim();
            const location = document.getElementById('monument-location').value.trim();
            const description = document.getElementById('monument-description').value.trim();
            const quote = document.getElementById('monument-quote').value.trim();

            if (!title) {
                showToast('⚠️ Por favor ingresa el título del monumento o lugar');
                return;
            }

            if (!description) {
                showToast('⚠️ Por favor ingresa la reseña histórica');
                return;
            }

            const uniqueId = `mon-custom-${Date.now()}`;
            const newMonument = {
                id: uniqueId,
                title,
                category,
                year,
                location,
                description,
                quote,
                image: currentImageDataUrl || '',
                createdAt: new Date().toISOString()
            };

            customMonuments.push(newMonument);
            saveCustomMonumentsToStorage();
            renderAllCustomMonuments();

            formAddMonument.reset();
            currentImageDataUrl = '';
            if (imagePreview) imagePreview.src = '';
            if (dropzonePreview) dropzonePreview.classList.add('hidden');
            if (dropzoneIdle) dropzoneIdle.classList.remove('hidden');

            showToast('✓ Lugar histórico de Tuluá publicado en el archivo');

            switchView('monuments', uniqueId);
        });
    }

    // =========================================================================
    // 5. MOTOR DE EDICIÓN WIKI Y PERSISTENCIA GLOBAL
    // =========================================================================
    const STORAGE_KEY_HOME = 'historicus_tulua_home_content_v3';
    const STORAGE_KEY_MONUMENTS = 'historicus_tulua_monuments_content_v3';
    const STORAGE_KEY_HOME_INFOBOX = 'historicus_tulua_home_infobox_v3';
    const STORAGE_KEY_MON_INFOBOX = 'historicus_tulua_mon_infobox_v3';

    const homeEditableArticle = document.getElementById('home-editable-content');
    const monumentsEditableArticle = document.getElementById('monuments-editable-content');
    const homeInfobox = document.querySelector('#view-home .wiki-infobox');
    const monumentsInfobox = document.querySelector('#view-monuments .wiki-infobox');

    const defaultHomeHTML = homeEditableArticle ? homeEditableArticle.innerHTML : '';
    const defaultMonumentsHTML = monumentsEditableArticle ? monumentsEditableArticle.innerHTML : '';
    const defaultHomeInfoboxHTML = homeInfobox ? homeInfobox.innerHTML : '';
    const defaultMonumentsInfoboxHTML = monumentsInfobox ? monumentsInfobox.innerHTML : '';

    const saveStatusIndicator = document.getElementById('save-status-indicator');
    const btnSaveAll = document.getElementById('btn-save-all');
    const btnResetDefault = document.getElementById('btn-reset-default');
    const toast = document.getElementById('wiki-toast');
    const toastMessage = document.getElementById('toast-message');

    let autoSaveTimeout = null;

    function loadSavedWikiContent() {
        try {
            const savedHome = localStorage.getItem(STORAGE_KEY_HOME);
            if (savedHome && homeEditableArticle) homeEditableArticle.innerHTML = savedHome;

            const savedMonuments = localStorage.getItem(STORAGE_KEY_MONUMENTS);
            if (savedMonuments && monumentsEditableArticle) monumentsEditableArticle.innerHTML = savedMonuments;

            const savedHomeInfobox = localStorage.getItem(STORAGE_KEY_HOME_INFOBOX);
            if (savedHomeInfobox && homeInfobox) homeInfobox.innerHTML = savedHomeInfobox;

            const savedMonInfobox = localStorage.getItem(STORAGE_KEY_MON_INFOBOX);
            if (savedMonInfobox && monumentsInfobox) monumentsInfobox.innerHTML = savedMonInfobox;
        } catch (err) {
            console.warn('Error al cargar datos de localStorage:', err);
        }

        loadCustomMonuments();
        rebindEditableListeners();
        updateWordCounts();
        setSavedStatus(true);
    }

    function saveWikiContent(showToastNotification = true) {
        try {
            if (homeEditableArticle) localStorage.setItem(STORAGE_KEY_HOME, homeEditableArticle.innerHTML);
            if (monumentsEditableArticle) localStorage.setItem(STORAGE_KEY_MONUMENTS, monumentsEditableArticle.innerHTML);
            if (homeInfobox) localStorage.setItem(STORAGE_KEY_HOME_INFOBOX, homeInfobox.innerHTML);
            if (monumentsInfobox) localStorage.setItem(STORAGE_KEY_MON_INFOBOX, monumentsInfobox.innerHTML);

            setSavedStatus(true);
            if (showToastNotification) {
                showToast('✓ Contenido wiki guardado en tu navegador');
            }
        } catch (err) {
            console.error('Error al guardar en localStorage:', err);
            showToast('⚠️ No se pudieron guardar los cambios locales');
        }
    }

    function resetToOriginal() {
        const confirmReset = window.confirm('¿Deseas restaurar los textos originales sobre Tuluá y descartar las ediciones locales?');
        if (!confirmReset) return;

        if (homeEditableArticle) homeEditableArticle.innerHTML = defaultHomeHTML;
        if (monumentsEditableArticle) monumentsEditableArticle.innerHTML = defaultMonumentsHTML;
        if (homeInfobox) homeInfobox.innerHTML = defaultHomeInfoboxHTML;
        if (monumentsInfobox) monumentsInfobox.innerHTML = defaultMonumentsInfoboxHTML;

        localStorage.removeItem(STORAGE_KEY_HOME);
        localStorage.removeItem(STORAGE_KEY_MONUMENTS);
        localStorage.removeItem(STORAGE_KEY_HOME_INFOBOX);
        localStorage.removeItem(STORAGE_KEY_MON_INFOBOX);
        localStorage.removeItem(STORAGE_KEY_CUSTOM_MONUMENTS);

        customMonuments = [];
        renderAllCustomMonuments();
        rebindEditableListeners();
        updateWordCounts();
        setSavedStatus(true);
        showToast('↺ Archivo de Tuluá restablecido a la versión documental inicial');
    }

    function setSavedStatus(isSaved) {
        if (!saveStatusIndicator) return;
        if (isSaved) {
            saveStatusIndicator.classList.remove('unsaved');
            saveStatusIndicator.innerHTML = '<span class="status-dot"></span> Sincronizado';
        } else {
            saveStatusIndicator.classList.add('unsaved');
            saveStatusIndicator.innerHTML = '<span class="status-dot"></span> Editando...';
        }
    }

    function showToast(msg) {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3400);
    }

    function handleContentInput() {
        setSavedStatus(false);
        updateWordCounts();

        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveWikiContent(false);
        }, 1500);
    }

    function rebindEditableListeners() {
        const editables = document.querySelectorAll('[contenteditable="true"]');
        editables.forEach(el => {
            el.removeEventListener('input', handleContentInput);
            el.addEventListener('input', handleContentInput);
        });

        bindAppendButtons();
    }

    // =========================================================================
    // 6. BARRA FLOTANTE DE FORMATEO (Bold, Italic, Link, etc.)
    // =========================================================================
    const floatingToolbar = document.getElementById('floating-editor-toolbar');

    function checkTextSelection() {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
            hideToolbar();
            return;
        }

        let parent = selection.anchorNode ? selection.anchorNode.parentElement : null;
        let isInsideEditable = false;
        while (parent) {
            if (parent.getAttribute && parent.getAttribute('contenteditable') === 'true') {
                isInsideEditable = true;
                break;
            }
            parent = parent.parentElement;
        }

        if (isInsideEditable && floatingToolbar) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            floatingToolbar.style.top = `${window.scrollY + rect.top - 46}px`;
            floatingToolbar.style.left = `${Math.max(10, window.scrollX + rect.left + (rect.width / 2) - 140)}px`;
            floatingToolbar.classList.add('visible');
        } else {
            hideToolbar();
        }
    }

    function hideToolbar() {
        if (floatingToolbar) {
            floatingToolbar.classList.remove('visible');
        }
    }

    document.addEventListener('selectionchange', () => {
        setTimeout(checkTextSelection, 100);
    });

    if (floatingToolbar) {
        floatingToolbar.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const command = button.getAttribute('data-command');
            const val = button.getAttribute('data-value') || null;

            if (command === 'createLink') {
                const url = prompt('Introduce la URL del enlace histórico o fuente:', 'https://');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else if (command === 'formatBlock') {
                document.execCommand(command, false, val);
            } else {
                document.execCommand(command, false, val);
            }

            handleContentInput();
            checkTextSelection();
        });
    }

    // =========================================================================
    // 7. AÑADIR PÁRRAFOS DINÁMICOS
    // =========================================================================
    function bindAppendButtons() {
        const btnAddHome = document.getElementById('btn-add-paragraph-home');
        if (btnAddHome && homeEditableArticle) {
            btnAddHome.onclick = () => {
                const newP = document.createElement('p');
                newP.className = 'wiki-editable-p';
                newP.setAttribute('contenteditable', 'true');
                newP.textContent = 'Escribe aquí un nuevo relato, testimonio o dato histórico sobre Tuluá...';

                const sections = homeEditableArticle.querySelectorAll('.wiki-section');
                if (sections.length > 0) {
                    const lastSection = sections[sections.length - 1];
                    lastSection.appendChild(newP);
                } else {
                    homeEditableArticle.insertBefore(newP, btnAddHome.parentElement);
                }

                rebindEditableListeners();
                newP.focus();
                handleContentInput();
                showToast('✓ Nuevo párrafo añadido. Haz clic para redactar.');
            };
        }
    }

    function updateWordCounts() {
        const homeText = homeEditableArticle ? homeEditableArticle.innerText || '' : '';
        const homeWords = homeText.trim().split(/\s+/).filter(Boolean).length;
        const homeCountEl = document.getElementById('home-word-count');
        if (homeCountEl) homeCountEl.textContent = `📊 ${homeWords} palabras`;

        const monText = monumentsEditableArticle ? monumentsEditableArticle.innerText || '' : '';
        const monWords = monText.trim().split(/\s+/).filter(Boolean).length;
        const monCountEl = document.getElementById('monuments-word-count');
        if (monCountEl) monCountEl.textContent = `📊 ${monWords} palabras`;
    }

    // Atajos de Teclado
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveWikiContent(true);
        }
    });

    if (btnSaveAll) btnSaveAll.addEventListener('click', () => saveWikiContent(true));
    if (btnResetDefault) btnResetDefault.addEventListener('click', resetToOriginal);

    // =========================================================================
    // 8. INICIALIZACIÓN Y LECTURA DE URL HASH
    // =========================================================================
    loadSavedWikiContent();
    bindFloatingCardClicks();

    const currentHash = window.location.hash;
    if (currentHash.startsWith('#monuments')) {
        const matchTarget = currentHash.match(/target=([^&]+)/);
        const targetId = matchTarget ? matchTarget[1] : null;
        switchView('monuments', targetId);
    } else if (currentHash === '#add-monument') {
        switchView('add-monument');
    } else {
        switchView('home');
    }
});