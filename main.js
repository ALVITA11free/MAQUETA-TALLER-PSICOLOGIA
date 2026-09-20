/**
 * Historicus - Plataforma de Memoria Histórica Local
 * Lógica de Navegación (2 enlaces) y Motor Wiki Abiertamente Editable
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // 1. GESTIÓN DE NAVEGACIÓN (Estrictamente 2 enlaces: Home y Monuments)
    // =========================================================================
    const navHome = document.getElementById('nav-home');
    const navMonuments = document.getElementById('nav-monuments');
    const viewHome = document.getElementById('view-home');
    const viewMonuments = document.getElementById('view-monuments');

    function switchView(viewName) {
        if (viewName === 'monuments') {
            navHome.classList.remove('active');
            navMonuments.classList.add('active');
            viewHome.classList.add('hidden');
            viewHome.classList.remove('active');
            viewMonuments.classList.remove('hidden');
            viewMonuments.classList.add('active');
            window.location.hash = 'monuments';
        } else {
            navMonuments.classList.remove('active');
            navHome.classList.add('active');
            viewMonuments.classList.add('hidden');
            viewMonuments.classList.remove('active');
            viewHome.classList.remove('hidden');
            viewHome.classList.add('active');
            window.location.hash = 'home';
        }
        updateWordCounts();
        hideToolbar();
    }

    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('home');
    });

    navMonuments.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('monuments');
    });

    // Leer el hash inicial de la URL
    if (window.location.hash === '#monuments') {
        switchView('monuments');
    } else {
        switchView('home');
    }

    // =========================================================================
    // 2. MOTOR DE EDICIÓN WIKI Y PERSISTENCIA (LocalStorage)
    // =========================================================================
    const STORAGE_KEY_HOME = 'historicus_wiki_home_content_v1';
    const STORAGE_KEY_MONUMENTS = 'historicus_wiki_monuments_content_v1';
    const STORAGE_KEY_HOME_INFOBOX = 'historicus_wiki_home_infobox_v1';
    const STORAGE_KEY_MON_INFOBOX = 'historicus_wiki_mon_infobox_v1';

    const homeEditableArticle = document.getElementById('home-editable-content');
    const monumentsEditableArticle = document.getElementById('monuments-editable-content');
    const homeInfobox = document.querySelector('#view-home .wiki-infobox');
    const monumentsInfobox = document.querySelector('#view-monuments .wiki-infobox');

    // Guardar plantilla original para restauración
    const defaultHomeHTML = homeEditableArticle.innerHTML;
    const defaultMonumentsHTML = monumentsEditableArticle.innerHTML;
    const defaultHomeInfoboxHTML = homeInfobox ? homeInfobox.innerHTML : '';
    const defaultMonumentsInfoboxHTML = monumentsInfobox ? monumentsInfobox.innerHTML : '';

    const saveStatusIndicator = document.getElementById('save-status-indicator');
    const btnSaveAll = document.getElementById('btn-save-all');
    const btnResetDefault = document.getElementById('btn-reset-default');
    const toast = document.getElementById('wiki-toast');
    const toastMessage = document.getElementById('toast-message');

    let isDirty = false;
    let autoSaveTimeout = null;

    // Cargar contenido guardado previamente si existe
    function loadSavedWikiContent() {
        try {
            const savedHome = localStorage.getItem(STORAGE_KEY_HOME);
            if (savedHome) {
                homeEditableArticle.innerHTML = savedHome;
            }

            const savedMonuments = localStorage.getItem(STORAGE_KEY_MONUMENTS);
            if (savedMonuments) {
                monumentsEditableArticle.innerHTML = savedMonuments;
            }

            const savedHomeInfobox = localStorage.getItem(STORAGE_KEY_HOME_INFOBOX);
            if (savedHomeInfobox && homeInfobox) {
                homeInfobox.innerHTML = savedHomeInfobox;
            }

            const savedMonInfobox = localStorage.getItem(STORAGE_KEY_MON_INFOBOX);
            if (savedMonInfobox && monumentsInfobox) {
                monumentsInfobox.innerHTML = savedMonInfobox;
            }
        } catch (err) {
            console.warn('Error al cargar datos de localStorage:', err);
        }
        rebindEditableListeners();
        updateWordCounts();
        setSavedStatus(true);
    }

    // Guardar cambios en LocalStorage
    function saveWikiContent(showToastNotification = true) {
        try {
            localStorage.setItem(STORAGE_KEY_HOME, homeEditableArticle.innerHTML);
            localStorage.setItem(STORAGE_KEY_MONUMENTS, monumentsEditableArticle.innerHTML);
            if (homeInfobox) localStorage.setItem(STORAGE_KEY_HOME_INFOBOX, homeInfobox.innerHTML);
            if (monumentsInfobox) localStorage.setItem(STORAGE_KEY_MON_INFOBOX, monumentsInfobox.innerHTML);
            
            setSavedStatus(true);
            isDirty = false;

            if (showToastNotification) {
                showToast('✓ Contenido wiki guardado en tu navegador');
            }
        } catch (err) {
            console.error('Error al guardar en localStorage:', err);
            showToast('⚠️ No se pudieron guardar los cambios locales');
        }
    }

    // Restablecer al contenido original de archivo
    function resetToOriginal() {
        const confirmReset = window.confirm('¿Deseas restaurar el texto original de los archivos históricos? Se descartarán las ediciones locales.');
        if (!confirmReset) return;

        homeEditableArticle.innerHTML = defaultHomeHTML;
        monumentsEditableArticle.innerHTML = defaultMonumentsHTML;
        if (homeInfobox) homeInfobox.innerHTML = defaultHomeInfoboxHTML;
        if (monumentsInfobox) monumentsInfobox.innerHTML = defaultMonumentsInfoboxHTML;

        localStorage.removeItem(STORAGE_KEY_HOME);
        localStorage.removeItem(STORAGE_KEY_MONUMENTS);
        localStorage.removeItem(STORAGE_KEY_HOME_INFOBOX);
        localStorage.removeItem(STORAGE_KEY_MON_INFOBOX);

        rebindEditableListeners();
        updateWordCounts();
        setSavedStatus(true);
        showToast('↺ Archivo restablecido a la versión documental inicial');
    }

    function setSavedStatus(isSaved) {
        if (isSaved) {
            saveStatusIndicator.classList.remove('unsaved');
            saveStatusIndicator.innerHTML = '<span class="status-dot"></span> Sincronizado';
        } else {
            saveStatusIndicator.classList.add('unsaved');
            saveStatusIndicator.innerHTML = '<span class="status-dot"></span> Editando...';
        }
    }

    function showToast(msg) {
        toastMessage.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    }

    // Manejar eventos de edición con autosave
    function handleContentInput() {
        isDirty = true;
        setSavedStatus(false);
        updateWordCounts();

        // Autosave diferido (1.5 segundos)
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveWikiContent(false);
        }, 1500);
    }

    function rebindEditableListeners() {
        // Asignar listeners a todos los elementos contenteditable
        const editables = document.querySelectorAll('[contenteditable="true"]');
        editables.forEach(el => {
            el.removeEventListener('input', handleContentInput);
            el.addEventListener('input', handleContentInput);
        });

        // Reasociar botones de añadir párrafos si fueron recargados
        bindAppendButtons();
    }

    // =========================================================================
    // 3. BARRA FLOTANTE DE FORMATEO (Bold, Italic, Link, etc.)
    // =========================================================================
    const floatingToolbar = document.getElementById('floating-editor-toolbar');

    function checkTextSelection() {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.toString().trim() === '') {
            hideToolbar();
            return;
        }

        // Verificar si la selección está dentro de un elemento contenteditable
        let parent = selection.anchorNode ? selection.anchorNode.parentElement : null;
        let isInsideEditable = false;
        while (parent) {
            if (parent.getAttribute && parent.getAttribute('contenteditable') === 'true') {
                isInsideEditable = true;
                break;
            }
            parent = parent.parentElement;
        }

        if (isInsideEditable) {
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
        // Pequeño retardo para estabilidad de selección
        setTimeout(checkTextSelection, 100);
    });

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

    // =========================================================================
    // 4. AÑADIR NUEVOS PÁRRAFOS O SECCIONES DINÁMICAMENTE
    // =========================================================================
    function bindAppendButtons() {
        const btnAddHome = document.getElementById('btn-add-paragraph-home');
        if (btnAddHome) {
            btnAddHome.onclick = () => {
                const newP = document.createElement('p');
                newP.className = 'wiki-editable-p';
                newP.setAttribute('contenteditable', 'true');
                newP.textContent = 'Escribe aquí un nuevo relato, testimonio o dato histórico del barrio...';
                
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

        const btnAddMonuments = document.getElementById('btn-add-paragraph-monuments');
        if (btnAddMonuments) {
            btnAddMonuments.onclick = () => {
                const newSection = document.createElement('div');
                newSection.className = 'wiki-section';
                newSection.innerHTML = `
                    <div class="section-heading-bar">
                        <h2 class="wiki-h2" contenteditable="true">Nuevo Monumento o Sitio Histórico</h2>
                        <span class="monument-type-tag">Patrimonio Local</span>
                    </div>
                    <p class="wiki-editable-p" contenteditable="true">
                        Describe aquí la ubicación, el autor, el año de inauguración y la relevancia comunitaria de este monumento o hito conmemorativo...
                    </p>
                `;
                monumentsEditableArticle.insertBefore(newSection, btnAddMonuments.parentElement);
                rebindEditableListeners();
                const newH2 = newSection.querySelector('h2');
                if (newH2) newH2.focus();
                handleContentInput();
                showToast('✓ Nuevo monumento añadido al catálogo.');
            };
        }
    }

    // =========================================================================
    // 5. CONTADOR DE PALABRAS EN TIEMPO REAL
    // =========================================================================
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

    // Atajos de Teclado (Ctrl+S / Cmd+S para guardar)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveWikiContent(true);
        }
    });

    // Botones de acción global
    btnSaveAll.addEventListener('click', () => saveWikiContent(true));
    btnResetDefault.addEventListener('click', resetToOriginal);

    // Inicializar
    loadSavedWikiContent();
    bindAppendButtons();
});