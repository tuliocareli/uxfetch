document.addEventListener('DOMContentLoaded', () => {
    // SPA Router State
    const state = {
        currentView: 'view-login',
        user: null
    };

    // DOM Elements
    const views = {
        login: document.getElementById('view-login'),
        onboarding: document.getElementById('view-onboarding'),
        app: document.getElementById('view-app')
    };

    // --- NAVIGATION LOGIC ---
    function navigateTo(viewId) {
        document.querySelectorAll('.spa-view').forEach(view => {
            view.classList.remove('active');
        });
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // --- LOGIN VIEW LOGIC ---
    const btnGoogleLogin = document.getElementById('btnGoogleLogin');
    const btnMagicLink = document.getElementById('btnMagicLink');
    const emailInput = document.getElementById('email');

    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', () => {
            // Simulate Google OAuth Login
            console.log("Simulating Google Login...");
            
            // For MVP mockup purposes, clicking login goes to onboarding
            // In reality, Supabase would check if user is new or existing.
            navigateTo('view-onboarding');
        });
    }

    if (btnMagicLink) {
        btnMagicLink.addEventListener('click', () => {
            if(!emailInput.value) {
                alert("Por favor, digite seu e-mail.");
                emailInput.focus();
                return;
            }
            console.log("Sending magic link to: " + emailInput.value);
            btnMagicLink.innerHTML = "LINK ENVIADO &check;";
            btnMagicLink.style.backgroundColor = "#10B981"; // Success green
            setTimeout(() => {
                navigateTo('view-onboarding');
            }, 1000);
        });
    }

    // --- ONBOARDING LOGIC (4 Steps) ---
    const step1 = document.getElementById('onboarding-step-1');
    const step2 = document.getElementById('onboarding-step-2');
    const step3 = document.getElementById('onboarding-step-3');
    const step4 = document.getElementById('onboarding-step-4');
    
    const btnNextToStep2 = document.getElementById('btnNextToStep2');
    const btnNextToStep3 = document.getElementById('btnNextToStep3');
    
    // Upload Elements
    const cvUpload = document.getElementById('cvUpload');
    const dragDropZone = document.getElementById('dragDropZone');
    const uploadStatus = document.getElementById('upload-status');
    
    const btnGoToManualForm = document.getElementById('btnGoToManualForm');
    const btnFinishFromPDF = document.getElementById('btnFinishFromPDF');
    
    // Manual Form Elements
    const btnBackToPDF = document.getElementById('btnBackToPDF');
    const btnFinishFromManual = document.getElementById('btnFinishFromManual');

    // Transitions
    function switchStep(fromStep, toStep) {
        fromStep.classList.remove('active');
        setTimeout(() => {
            fromStep.classList.add('hidden');
            toStep.classList.remove('hidden');
            toStep.classList.add('active');
        }, 300);
    }

    if (btnNextToStep2) {
        btnNextToStep2.addEventListener('click', () => {
            switchStep(step1, step2);
        });
    }

    if (btnNextToStep3) {
        btnNextToStep3.addEventListener('click', () => {
            // Collect checked values for Context
            const selectedAreas = Array.from(document.querySelectorAll('input[name="area"]:checked')).map(cb => cb.value);
            const selectedLevels = Array.from(document.querySelectorAll('input[name="level"]:checked')).map(cb => cb.value);
            console.log("Perfil Salvo:", selectedAreas, selectedLevels);
            
            switchStep(step2, step3);
        });
    }

    // Drag and Drop Effects
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        if(dragDropZone) dragDropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        if(dragDropZone) dragDropZone.addEventListener(eventName, () => dragDropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        if(dragDropZone) dragDropZone.addEventListener(eventName, () => dragDropZone.classList.remove('dragover'), false);
    });

    // Handle Drop
    if(dragDropZone) {
        dragDropZone.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            let files = dt.files;
            handleFiles(files);
        }, false);
    }

    // Handle Click Upload
    if(cvUpload) {
        cvUpload.addEventListener('change', function() {
            handleFiles(this.files);
        });
    }

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type === "application/pdf") {
                // Show Success State
                dragDropZone.classList.add('hidden');
                uploadStatus.classList.remove('hidden');
                uploadStatus.querySelector('.file-name').textContent = file.name;
                
                // Hide buttons to prevent manual click confusion
                document.querySelector('#onboarding-step-3 .two-buttons').style.display = 'none';
                
                // Automatically transition after 1.5 seconds (toast effect)
                setTimeout(() => {
                    finishOnboarding();
                }, 1500);
            } else {
                alert("Por favor, envie apenas arquivos em formato PDF.");
            }
        }
    }

    // Finish / Fallback Navigations
    if (btnFinishFromPDF) {
        btnFinishFromPDF.addEventListener('click', finishOnboarding);
    }

    if (btnGoToManualForm) {
        btnGoToManualForm.addEventListener('click', () => {
            switchStep(step3, step4);
        });
    }
    
    if (btnBackToPDF) {
        btnBackToPDF.addEventListener('click', () => {
            switchStep(step4, step3);
        });
    }

    if (btnFinishFromManual) {
        btnFinishFromManual.addEventListener('click', finishOnboarding);
    }

    function finishOnboarding() {
        navigateTo('view-app');
        initKanbanApp();
    }

    // ==========================================
    // PHASE 3: KANBAN & MURAL LOGIC
    // ==========================================
    function initKanbanApp() {
        const tabKanban = document.getElementById('tab-kanban');
        const tabMural = document.getElementById('tab-mural');
        const sectionKanban = document.getElementById('section-kanban');
        const sectionMural = document.getElementById('section-mural');

        // Tab Switching
        if(tabKanban && tabMural) {
            tabKanban.addEventListener('click', () => {
                tabKanban.classList.add('active');
                tabMural.classList.remove('active');
                sectionKanban.classList.add('active-section');
                sectionMural.classList.remove('active-section');
            });

            tabMural.addEventListener('click', () => {
                tabMural.classList.add('active');
                tabKanban.classList.remove('active');
                sectionMural.classList.add('active-section');
                sectionKanban.classList.remove('active-section');
            });
        }

        // Job Save Logic
        const btnSaveJobs = document.querySelectorAll('.btn-save-job');
        const colInteresse = document.getElementById('col-interesse');
        const countInteresse = document.getElementById('count-interesse');
        let currentCount = 0;

        btnSaveJobs.forEach(btn => {
            btn.addEventListener('click', function() {
                const title = this.getAttribute('data-title');
                const company = this.getAttribute('data-company');
                const jobId = this.getAttribute('data-id');

                // Check if already saved
                if(this.classList.contains('saved')) return;

                // Create Kanban Card
                const cardHTML = `
                    <article class="job-card" data-id="${jobId}" draggable="true">
                        <h3>${title}</h3>
                        <p class="job-meta">${company}</p>
                        <a href="#" target="_blank" class="card-action-link">Acessar Vaga ↗</a>
                    </article>
                `;
                colInteresse.insertAdjacentHTML('beforeend', cardHTML);

                // Update UI State
                this.innerHTML = "✓ Salvo no Kanban";
                this.classList.add('saved');
                this.style.backgroundColor = "#ECFDF5";
                this.style.color = "#065F46";
                this.style.borderColor = "#10B981";
                
                currentCount++;
                countInteresse.textContent = currentCount;

                // Bind drag event to new card
                bindDragEvents();

                // Alert user
                showToast(`"${title}" salvo! Acesse a aba Kanban para gerenciar essa vaga com o Mentor IA.`, '');
            });
        });

        // --- DRAG AND DROP KANBAN ---
        let draggedCard = null;

        function bindDragEvents() {
            const cards = document.querySelectorAll('.job-card');
            cards.forEach(card => {
                card.addEventListener('dragstart', function() {
                    draggedCard = this;
                    setTimeout(() => this.style.display = 'none', 0);
                });
                
                card.addEventListener('dragend', function() {
                    setTimeout(() => {
                        draggedCard.style.display = 'block';
                        draggedCard = null;
                        updateKanbanCounters();
                    }, 0);
                });
            });
        }

        const columns = document.querySelectorAll('.kanban-cards-container');
        columns.forEach(col => {
            col.addEventListener('dragover', function(e) {
                e.preventDefault();
            });
            
            col.addEventListener('dragenter', function(e) {
                e.preventDefault();
                this.style.backgroundColor = 'rgba(0,0,0,0.02)';
            });

            col.addEventListener('dragleave', function() {
                this.style.backgroundColor = 'transparent';
            });
            
            col.addEventListener('drop', function() {
                this.style.backgroundColor = 'transparent';
                if(draggedCard) {
                    this.appendChild(draggedCard);
                    
                    // Trigger modal if dropped into "Finalizados"
                    if(this.parentElement.getAttribute('data-status') === 'finalizados') {
                        const cardRef = draggedCard;
                        showConfirmModal(
                            "Parabéns por concluir o processo!",
                            "Você foi contratado(a)?",
                            () => {
                                // Confirm (Sim)
                                cardRef.style.backgroundColor = '#ECFDF5';
                                cardRef.style.border = '2px solid #10B981';
                                showToast("Status atualizado. Parabéns pela contratação!", '');
                            },
                            () => {
                                // Cancel (Não)
                                cardRef.style.backgroundColor = '#F3F4F6';
                                cardRef.style.opacity = '0.7';
                                showToast("Status arquivado. Foco na próxima oportunidade.", '');
                            }
                        );
                    }
                }
            });
        });

        function updateKanbanCounters() {
            document.querySelectorAll('.kanban-column').forEach(col => {
                const count = col.querySelectorAll('.job-card').length;
                col.querySelector('.card-count').textContent = count;
            });
        }
    }

    // ==========================================
    // CUSTOM MODALS & TOASTS LOGIC
    // ==========================================
    function showToast(message, icon = '✅') {
        const toast = document.getElementById('toast-container');
        document.getElementById('toast-message').textContent = message;
        document.getElementById('toast-icon').textContent = icon;
        
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 6000);
    }

    function showConfirmModal(title, text, onConfirm, onCancel) {
        const modalOverlay = document.getElementById('custom-modal-overlay');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-text').textContent = text;
        
        const btnConfirm = document.getElementById('modal-btn-confirm');
        const btnCancel = document.getElementById('modal-btn-cancel');
        
        // Remove old event listeners by replacing elements
        const newBtnConfirm = btnConfirm.cloneNode(true);
        const newBtnCancel = btnCancel.cloneNode(true);
        btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        
        modalOverlay.classList.remove('hidden');
        
        newBtnConfirm.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
            if (onConfirm) onConfirm();
        });
        
        newBtnCancel.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
            if (onCancel) onCancel();
        });
    }

});
