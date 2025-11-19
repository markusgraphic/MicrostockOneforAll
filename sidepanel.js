// sidepanel.js (Gabungan Logika UI dari semua fitur - Versi Lengkap dan Terbaru)

document.addEventListener('DOMContentLoaded', () => {
    // ===============================================
    // SELEKSI ELEMEN DOM GLOBAL
    // ===============================================
    const mainAppContainer = document.getElementById('main-app-container');
    const settingsPage = document.getElementById('settings-page');
    const headerTitle = document.getElementById('header-title');
    const settingsBtn = document.getElementById('settings-btn');
    const mainNav = document.querySelector('.main-nav');
    const pages = document.querySelectorAll('.page-content');
    const toastNotification = document.getElementById('toast-notification');

    // --- Halaman Settings ---
    const backToAppBtn = document.getElementById('back-to-app-btn');
    const metadataKeywordCountInput = document.getElementById('metadata-keyword-count');
    const stepDelayInput = document.getElementById('step-delay');
    const repetitionDelayInput = document.getElementById('repetition-delay');
    const vecteezyLicenseSelect = document.getElementById('vecteezy-license');
    const vecteezyAiSoftwareSelect = document.getElementById('vecteezy-ai-software');
    const vecteezyOtherSoftwareGroup = document.getElementById('vecteezy-other-software-group');
    const vecteezyOtherSoftwareInput = document.getElementById('vecteezy-other-software');
    
    const aiProviderSelect = document.getElementById('ai-provider');
    const aiModelSelect = document.getElementById('ai-model');

    const geminiKeyManager = document.getElementById('gemini-key-manager');
    const geminiApiKeyListContainer = document.getElementById('gemini-api-key-list');
    const newGeminiApiKeyInput = document.getElementById('new-gemini-api-key');
    const addGeminiKeyBtn = document.getElementById('add-gemini-key-btn');
    
    const openaiKeyManager = document.getElementById('openai-key-manager');
    const openaiApiKeyListContainer = document.getElementById('openai-api-key-list');
    const newOpenaiApiKeyInput = document.getElementById('new-openai-api-key');
    const addOpenaiKeyBtn = document.getElementById('add-openai-key-btn');
    
    const deepseekKeyManager = document.getElementById('deepseek-key-manager');
    const deepseekApiKeyListContainer = document.getElementById('deepseek-api-key-list');
    const newDeepseekApiKeyInput = document.getElementById('new-deepseek-api-key');
    const addDeepseekKeyBtn = document.getElementById('add-deepseek-key-btn');

    const openrouterKeyManager = document.getElementById('openrouter-key-manager');
    const openrouterApiKeyListContainer = document.getElementById('openrouter-api-key-list');
    const newOpenrouterApiKeyInput = document.getElementById('new-openrouter-api-key');
    const addOpenrouterKeyBtn = document.getElementById('add-openrouter-key-btn');

    const groqKeyManager = document.getElementById('groq-key-manager');
    const groqApiKeyListContainer = document.getElementById('groq-api-key-list');
    const newGroqApiKeyInput = document.getElementById('new-groq-api-key');
    const addGroqKeyBtn = document.getElementById('add-groq-key-btn');

    // --- Halaman Research ---
    const researchKeywordsTextarea = document.getElementById('research-keywords');
    const researchUploader = document.getElementById('research-uploader-area');
    const researchFileInput = document.getElementById('research-file-input');
    const researchKeywordCountInput = document.getElementById('research-keyword-count');
    const startResearchBtn = document.getElementById('start-research-btn');
    const targetWebsiteSelect = document.getElementById('target-website');
    const reportTableBody = document.getElementById('report-table-body');
    const researchSortFilter = document.getElementById('research-sort-filter');
    const selectAllKeywordsCheckbox = document.getElementById('select-all-keywords-checkbox');
    const copyKeywordsBtn = document.getElementById('copy-keywords-btn');
    const copyKeywordsActionGroup = document.getElementById('copy-keywords-action-group');
    const researchLogDiv = document.querySelector('#page-research .log-box');
    const toggleResearchSettingsBtn = document.getElementById('toggle-research-settings-btn');
    const researchAdvancedSettings = document.getElementById('research-advanced-settings');
    const filterLevelLow = document.getElementById('filter-level-low');
    const filterLevelMedium = document.getElementById('filter-level-medium');
    const filterLevelHigh = document.getElementById('filter-level-high');
    const thresholdMediumInput = document.getElementById('threshold-medium');
    const thresholdHighInput = document.getElementById('threshold-high');
    let reportDataCache = [];

    // --- Halaman Prompt Generator ---
    const generatorPromptTextarea = document.getElementById('generator-prompt');
    const generatorUploader = document.getElementById('generator-uploader-area');
    const generatorFileInput = document.getElementById('generator-file-input');
    const generatorMultiPreviewContainer = document.getElementById('generator-multi-preview-container');
    const generatorRemoveAllMediaBtn = document.getElementById('generator-remove-all-media-btn');
    const promptStyleSelect = document.getElementById('prompt-style');
    const promptCountInput = document.getElementById('prompt-count');
    const customInstructionsTextarea = document.getElementById('custom-instructions');
    const generatePromptsBtn = document.getElementById('generate-prompts-btn');
    const generatorLoader = document.querySelector('#page-generator .loader-container');
    const promptResultsTextarea = document.getElementById('prompt-results-textarea');
    const clearPromptResultsBtn = document.getElementById('clear-prompt-results-btn');
    const promptResultsCopyAllBtn = document.getElementById('prompt-results-copy-all-btn');
    const promptResultsExportBtn = document.getElementById('prompt-results-export-btn');
    const togglePromptGenSettingsBtn = document.getElementById('toggle-prompt-gen-settings-btn');
    const promptGenAdvancedSettings = document.getElementById('prompt-gen-advanced-settings');
    const promptGenLog = document.getElementById('prompt-gen-log');
    const promptSimilarityGroup = document.getElementById('prompt-similarity-group');
    const promptSimilarityLevelSelect = document.getElementById('prompt-similarity-level');
    const promptTypeSelect = document.getElementById('prompt-type');
    const promptStyleGroup = document.getElementById('prompt-style').closest('.form-group');
    const promptCountGroup = document.getElementById('prompt-count').closest('.form-group');
    const customInstructionsGroup = document.getElementById('custom-instructions').closest('.form-group');


    // --- Halaman Image Generator ---
    const imageGenWebsiteSelect = document.getElementById('image-gen-website');
    const imageGenPromptTextarea = document.getElementById('image-gen-prompt');
    const imageGenAutoFlowToggle = document.getElementById('image-gen-auto-flow-toggle');
    const imageGenRepetitionGroup = document.getElementById('image-gen-repetition-group');
    const imageGenRepetitionInput = document.getElementById('image-gen-repetition-count');
    const imageGenWaitTimeInput = document.getElementById('image-gen-wait-time');
    const imageGenDownloadCountGroup = document.getElementById('image-gen-download-count-group');
    const imageGenDownloadCountSelect = document.getElementById('image-gen-download-count');
    const startImageGenBtn = document.getElementById('start-image-gen-btn');
    const imageGenLogDiv = document.getElementById('image-gen-log');
    const clearImageGenPromptsBtn = document.getElementById('clear-image-gen-prompts-btn');
    const toggleImageGenSettingsBtn = document.getElementById('toggle-image-gen-settings-btn');
    const imageGenAdvancedSettings = document.getElementById('image-gen-advanced-settings');
    const importImageGenPromptsBtn = document.getElementById('import-image-gen-prompts-btn');
    const imageGenPromptImportInput = document.getElementById('image-gen-prompt-import-input');


    // --- Halaman Metadata ---
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const refreshPreviewBtn = document.getElementById('refresh-preview-btn');
    const metadataTargetWebsiteSelect = document.getElementById('metadata-target-website');
    const aiGeneratedToggle = document.getElementById('ai-generated-toggle');
    const autoFlowToggle = document.getElementById('auto-flow-toggle');
    const repetitionCountGroup = document.getElementById('repetition-count-group');
    const repetitionCountInput = document.getElementById('repetition-count');
    const startStopBtn = document.getElementById('start-stop-btn');
    const processLog = document.getElementById('process-log');
    const toggleMetadataSettingsBtn = document.getElementById('toggle-metadata-settings-btn');
    const metadataSettingsCard = document.getElementById('metadata-settings-card');
    const metadataFilterLow = document.getElementById('metadata-filter-low');
    const metadataFilterMedium = document.getElementById('metadata-filter-medium');
    const metadataFilterHigh = document.getElementById('metadata-filter-high');
    const metadataCustomInput = document.getElementById('metadata-custom-input');


    // ===============================================
    // STATE & FUNGSI BANTU
    // ===============================================
    let geminiApiKeys = [];
    let openaiApiKeys = [];
    let deepseekApiKeys = [];
    let openrouterApiKeys = [];
    let groqApiKeys = [];
    let activePageId = 'page-research';
    let toastTimeout;
    let researchMediaState = { dataUrl: null, file: null };
    let promptGenMediaState = []; // [UPDATED] Changed to array for multi-image support
    let isImageGenRunning = false;
    let isMetadataFlowRunning = false;
    let isResearchRunning = false;

    const modelOptions = {
        gemini: [
            { value: 'gemini-flash-lite-latest', text: 'Gemini Flash Lite Latest' },
            { value: 'gemini-flash-latest', text: 'Gemini Flash Latest' },
            { value: 'gemini-2.0-flash-lite', text: 'Gemini 2.0 Flash Lite' },
            { value: 'gemini-2.0-flash', text: 'Gemini 2.0 Flash' },
            { value: 'gemini-2.5-flash-lite', text: 'Gemini 2.5 Flash Lite' },
            { value: 'gemini-2.5-flash', text: 'Gemini 2.5 Flash' },
            { value: 'gemini-2.5-pro', text: 'Gemini 2.5 Pro' }
        ],
        openai: [
            { value: 'gpt-5-nano-2025-08-07', text: 'GPT-5 nano'},
            { value: 'gpt-4o', text: 'GPT-4o (Vision)'},
            { value: 'gpt-4-turbo', text: 'GPT-4 Turbo (Vision)' },
            { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' }
        ],
        deepseek: [
            { value: 'deepseek-chat', text: 'DeepSeek Chat' },
            { value: 'deepseek-vision', text: 'DeepSeek Vision (Vision)'}
        ],
        // === PERBAIKAN DIMULAI: Daftar model OpenRouter diperbarui dan disederhanakan ===
        openrouter: [
            // Model Vision Prioritas
            { value: 'openai/gpt-4.1-nano', text: 'Gpt 4.1 Nano (Vision)' },
            { value: 'openai/gpt-4o-mini-2024-07-18', text: 'Gpt 4o Mini (Vision)' },
            { value: 'google/gemini-2.5-flash-lite', text: 'Gemini 2.5 flash lite (Vision)' },
            { value: 'google/gemini-2.0-flash-lite-001', text: 'Gemini 2.0 flash lite (Vision)' },
            { value: 'google/gemini-2.0-flash-001', text: 'Gemini 2.0 flash (Vision)' },
            { value: 'google/gemini-flash-1.5-8b', text: 'Gemini 1.5 flash (Vision)' },

            // Model Teks Prioritas
            { value: 'x-ai/grok-4-fast', text: 'grok-4-fast' },
            { value: 'baidu/ernie-4.5-vl-28b-a3b', text: 'ernie-4.5-vl-28b-a3b' },
            { value: 'mistralai/mistral-small-3.2-24b-instruct', text: 'mistral-small-3.2-24b' },
            { value: 'meta-llama/llama-4-maverick', text: 'llama-4-maverick' },
            { value: 'meta-llama/llama-4-scout', text: 'llama-4-scout' },
            { value: 'mistralai/mistral-small-3.1-24b-instruct', text: 'mistral-small-3.1-24b' },
            { value: 'google/gemma-3-4b-it', text: 'gemma-3-4b-it' },
            { value: 'google/gemma-3-27b-it', text: 'gemma-3-27b-it' },
            { value: 'microsoft/phi-4-multimodal-instruct', text: 'phi-4-multimodal' },
 
            // Model Lainnya
            { value: 'x-ai/grok-4-fast:free', text: 'grok-4-fast:free' },
            { value: 'deepseek/deepseek-chat-v3.1:free', text: 'deepseek-chat-v3.1:free' },
            { value: 'z-ai/glm-4.5-air:free', text: 'glm-4.5-air:free' },
            { value: 'deepseek/deepseek-r1:free', text: 'deepseek-r1:free' },
            { value: 'meta-llama/llama-3.3-70b-instruct:free', text: 'llama-3.3-70b-instruct:free' },
            { value: 'deepseek/deepseek-r1-0528-qwen3-8b:free', text: 'deepseek-r1-0528-qwen3-8b:free' },
            { value: 'mistralai/mistral-small-3.2-24b-instruct:free', text: 'mistral-small-3.2-24b-instruct:free' },
            { value: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', text: 'dolphin-mistral-24b-venice-edition:free' },
            { value: 'qwen/qwen2.5-vl-72b-instruct:free', text: 'qwen2.5-vl-72b-instruct:free' },
            { value: 'mistralai/mistral-nemo:free', text: 'mistral-nemo:free' },
            { value: 'qwen/qwen3-14b:free', text: 'qwen3-14b:free' },
            { value: 'nvidia/nemotron-nano-9b-v2:free', text: 'nemotron-nano-9b-v2:free' },
            { value: 'moonshotai/kimi-dev-72b:free', text: 'kimi-dev-72b:free' },
            { value: 'qwen/qwen3-30b-a3b:free', text: 'qwen3-30b-a3b:free' },
            { value: 'mistralai/mistral-7b-instruct:free', text: 'mistral-7b-instruct:free' },
            { value: 'agentica-org/deepcoder-14b-preview:free', text: 'deepcoder-14b-preview:free' },
            { value: 'qwen/qwen-2.5-72b-instruct:free', text: 'qwen-2.5-72b-instruct:free' },
            { value: 'qwen/qwen-2.5-coder-32b-instruct:free', text: 'qwen-2.5-coder-32b-instruct:free' },
            { value: 'mistralai/mistral-small-3.1-24b-instruct:free', text: 'mistral-small-3.1-24b-instruct:free' },
            { value: 'shisa-ai/shisa-v2-llama3.3-70b:free', text: 'shisa-v2-llama3.3-70b:free' },
            { value: 'moonshotai/kimi-vl-a3b-thinking:free', text: 'kimi-vl-a3b-thinking:free' },
            { value: 'nousresearch/deephermes-3-llama-3-8b-preview:free', text: 'deephermes-3-llama-3-8b:free' },
            { value: 'qwen/qwen3-8b:free', text: 'qwen3-8b:free' },
            { value: 'cognitivecomputations/dolphin3.0-mistral-24b:free', text: 'dolphin3.0-mistral-24b:free' },
            { value: 'mistralai/devstral-small-2505:free', text: 'devstral-small-2505:free' },
            { value: 'qwen/qwen2.5-vl-32b-instruct:free', text: 'qwen2.5-vl-32b-instruct:free' },
            { value: 'qwen/qwen3-4b:free', text: 'qwen3-4b:free' },
            { value: 'mistralai/mistral-small-24b-instruct-2501:free', text: 'mistral-small-24b-instruct-2501:free' },
            { value: 'arliai/qwq-32b-arliai-rpr-v1:free', text: 'qwq-32b-arliai-rpr-v1:free' },
            { value: 'google/gemma-3-12b-it:free', text: 'gemma-3-12b-it:free' },
            { value: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free', text: 'dolphin3.0-r1-mistral-24b:free' }
        ],
        // === PERBAIKAN SELESAI ===
        groq: [
            { value: 'meta-llama/llama-4-maverick-17b-128e-instruct', text: 'llama 4 Maverick (Vision)' },
            { value: 'meta-llama/llama-4-scout-17b-16e-instruct', text: 'llama 4 Scout (Vision)' },
            { value: 'llama-3.1-8b-instant', text: 'llama 3.1 8b Instant' },
            { value: 'llama-3.3-70b-versatile', text: 'llama 3.3 70b Versatile' },
            { value: 'allam-2-7b', text: 'Allam 2 7b' },
            { value: 'openai/gpt-oss-120b', text: 'Gpt Oss 120b' },
            { value: 'openai/gpt-oss-20b', text: 'Gpt Oss 20b' },
            { value: 'groq/compound', text: 'Groq Compound' },
            { value: 'groq/compound-mini', text: 'Groq Compound Mini' },
            { value: 'moonshotai/kimi-k2-instruct', text: 'Kimi K2' },
            { value: 'moonshotai/kimi-k2-instruct-0905', text: 'Kimi K2 0905' },
            { value: 'qwen/qwen3-32b', text: 'Qwen3 32b' }
        ]
    };
    
    const toggleImageGenOptions = () => {
        const selectedWebsite = imageGenWebsiteSelect.value;
        const supportedSites = ['whisk', 'imagefx', 'dreamina', 'leonardo'];
        imageGenDownloadCountGroup.style.display = supportedSites.includes(selectedWebsite) ? 'block' : 'none';
    };

    const updatePromptGenAdvancedVisibility = () => {
        const is100Percent = promptSimilarityLevelSelect.value === '100%';
        const displayStyle = is100Percent ? 'none' : 'block';
        promptStyleGroup.style.display = displayStyle;
        promptCountGroup.style.display = displayStyle;
        customInstructionsGroup.style.display = displayStyle;
    };
    
    const updatePromptGenVisibility = () => {
        const hasMedia = promptGenMediaState.length > 0;
        promptSimilarityGroup.style.display = hasMedia ? 'block' : 'none';
        if (hasMedia) {
            updatePromptGenAdvancedVisibility();
        } else {
            promptStyleGroup.style.display = 'block';
            promptCountGroup.style.display = 'block';
            customInstructionsGroup.style.display = 'block';
        }
        updatePromptGenButtonState();
    };

    const updatePromptGenButtonState = () => {
        const hasText = generatorPromptTextarea.value.trim() !== '';
        const hasMedia = promptGenMediaState.length > 0;
        generatePromptsBtn.disabled = !hasText && !hasMedia;
    };

    const showToast = (message, isError = false) => {
        clearTimeout(toastTimeout);
        toastNotification.textContent = message;
        toastNotification.style.backgroundColor = isError ? 'var(--danger-color)' : '#333';
        toastNotification.classList.add('show');
        toastTimeout = setTimeout(() => toastNotification.classList.remove('show'), 3000);
    };

    const checkCurrentTabSupport = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const selectedWebsite = metadataTargetWebsiteSelect.value;
            let isSupported = false;
            if (tab && tab.url) {
                switch (selectedWebsite) {
                    case 'dreamstime': isSupported = tab.url.includes('dreamstime.com/upload'); break;
                    case 'adobestock': isSupported = tab.url.includes('contributor.stock.adobe.com'); break;
                    case 'vecteezy': isSupported = tab.url.includes('vecteezy.com/portfolio/add_data'); break;
                }
            }
            updateStartStopButtonState(isSupported, isMetadataFlowRunning);
        } catch (e) {
            console.error("Error checking tab support:", e);
            updateStartStopButtonState(false, isMetadataFlowRunning);
        }
    };

    const showPage = (pageIdToShow) => {
        pages.forEach(page => page.classList.remove('active'));
        const pageToShow = document.getElementById(pageIdToShow);
        if (pageToShow) pageToShow.classList.add('active');
        mainNav.querySelectorAll('.main-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageIdToShow);
        });
        activePageId = pageIdToShow;
        const navButton = mainNav.querySelector(`.main-nav-btn[data-page="${pageIdToShow}"]`);
        headerTitle.textContent = navButton ? navButton.textContent : "Microstock One for All";
        if (pageIdToShow === 'page-metadata') {
            checkCurrentTabSupport();
        }
    };

    const showSettings = (show) => {
        settingsPage.classList.toggle('hidden', !show);
        mainAppContainer.classList.toggle('hidden', show);
        headerTitle.textContent = show ? "Pengaturan" : "Microstock One for All";
    };

    const addLog = (logDiv, message, isError = false) => {
        if (!logDiv) return;
        if (logDiv.querySelector('.placeholder-text')) { logDiv.innerHTML = ''; }
        const logEntry = document.createElement('div');
        logEntry.innerHTML = message;
        if (isError) { logEntry.style.color = 'var(--danger-color)'; }
        logDiv.appendChild(logEntry);
        logDiv.scrollTop = logDiv.scrollHeight;
    };

    const addMetadataLog = (message, isError = false) => {
        if (!processLog) return;
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${timestamp}] ${message}`;
        if (isError) { logEntry.style.color = 'var(--danger-color)'; }
        processLog.appendChild(logEntry);
        processLog.scrollTop = processLog.scrollHeight;
    };
    
    const clearMetadataLog = () => { if(processLog) processLog.innerHTML = ''; };
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const resizeImage = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const MAX_DIMENSION = 512;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width > height) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    } else {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    
    // [UPDATED] setupUploader is now setupSingleUploader
    const setupSingleUploader = (uploaderArea, fileInput, mediaState, onFileChangeCallback = () => {}) => {
        const uploadLabel = uploaderArea.querySelector('.upload-label');
        const mediaPreview = uploaderArea.querySelector('.media-preview');
        const removeMediaBtn = uploaderArea.querySelector('.remove-media-btn');

        const resetUploader = () => {
            fileInput.value = ''; 
            mediaState.file = null;
            mediaState.dataUrl = null;
            uploaderArea.classList.remove('has-media');
            mediaPreview.classList.add('hidden');
            removeMediaBtn.classList.add('hidden');
            uploadLabel.style.display = 'block';
            onFileChangeCallback();
        };

        const handleFileSelect = (file) => {
            if (!file || !file.type.startsWith('image/')) {
                showToast('Hanya file gambar yang didukung.', true);
                resetUploader();
                return;
            }
            
            mediaState.file = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                mediaState.dataUrl = e.target.result;
                mediaPreview.src = e.target.result;
                mediaPreview.classList.remove('hidden');
                removeMediaBtn.classList.remove('hidden');
                uploadLabel.style.display = 'none';
                uploaderArea.classList.add('has-media');
                onFileChangeCallback();
            };
            reader.readAsDataURL(file);
        };

        fileInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); });
        uploaderArea.addEventListener('click', () => fileInput.click());
        uploaderArea.addEventListener('dragenter', (e) => { e.preventDefault(); e.stopPropagation(); uploaderArea.classList.add('dragover'); });
        uploaderArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); uploaderArea.classList.add('dragover'); e.dataTransfer.dropEffect = 'copy'; });
        uploaderArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); uploaderArea.classList.remove('dragover'); });
        uploaderArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploaderArea.classList.remove('dragover');
            if (e.dataTransfer?.files[0]) handleFileSelect(e.dataTransfer.files[0]);
        });
        removeMediaBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); resetUploader(); });
    };

    // [NEW] uploader for multiple images
    const setupMultiUploader = (uploaderArea, fileInput, mediaStateArray, onFileChangeCallback = () => {}) => {
        const uploadLabel = uploaderArea.querySelector('.upload-label');
        const previewContainer = uploaderArea.querySelector('#generator-multi-preview-container');
        const removeAllBtn = uploaderArea.querySelector('#generator-remove-all-media-btn');
    
        const renderPreviews = () => {
            previewContainer.innerHTML = '';
            mediaStateArray.forEach(media => {
                const item = document.createElement('div');
                item.className = 'multi-preview-item';
                item.innerHTML = `
                    <img src="${media.dataUrl}" alt="Preview">
                    <button class="remove-single-media-btn" data-id="${media.id}" title="Hapus Gambar">&times;</button>
                `;
                previewContainer.appendChild(item);
            });
    
            const hasMedia = mediaStateArray.length > 0;
            uploaderArea.classList.toggle('has-media', hasMedia);
            removeAllBtn.classList.toggle('hidden', !hasMedia);
            onFileChangeCallback();
        };
    
        const addFiles = (files) => {
            for (const file of files) {
                if (!file || !file.type.startsWith('image/')) {
                    showToast('Hanya file gambar yang didukung.', true);
                    continue;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    mediaStateArray.push({
                        file,
                        dataUrl: e.target.result,
                        id: Date.now() + Math.random() // simple unique ID
                    });
                    renderPreviews();
                };
                reader.readAsDataURL(file);
            }
        };
    
        const removeFile = (id) => {
            const index = mediaStateArray.findIndex(m => m.id == id);
            if (index > -1) {
                mediaStateArray.splice(index, 1);
                renderPreviews();
            }
        };
        
        const removeAllFiles = () => {
            mediaStateArray.length = 0; // Clear the array
            fileInput.value = ''; // Reset file input
            renderPreviews();
        };
    
        fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) addFiles(e.target.files); });
        uploaderArea.addEventListener('click', (e) => { if (e.target === uploaderArea || uploadLabel.contains(e.target)) fileInput.click(); });
        uploaderArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); uploaderArea.classList.add('dragover'); e.dataTransfer.dropEffect = 'copy'; });
        uploaderArea.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); uploaderArea.classList.remove('dragover'); });
        uploaderArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploaderArea.classList.remove('dragover');
            if (e.dataTransfer?.files.length > 0) addFiles(e.dataTransfer.files);
        });
        
        previewContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-single-media-btn')) {
                removeFile(e.target.dataset.id);
            }
        });
    
        removeAllBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); removeAllFiles(); });
    };

    // ===============================================
    // LOGIKA PENGATURAN (SETTINGS)
    // ===============================================

    const saveAllSettings = () => {
        chrome.storage.sync.set({
            gemini_apiKeys: geminiApiKeys,
            openai_apiKeys: openaiApiKeys,
            deepseek_apiKeys: deepseekApiKeys,
            openrouter_apiKeys: openrouterApiKeys,
            groq_apiKeys: groqApiKeys,
            ai_provider: aiProviderSelect.value,
            ai_model: aiModelSelect.value,
            metadata_keywordCount: parseInt(metadataKeywordCountInput.value, 10) || 25,
            stepDelay: parseInt(stepDelayInput.value, 10) || 2,
            repetitionDelay: parseInt(repetitionDelayInput.value, 10) || 5,
            vecteezyLicense: vecteezyLicenseSelect.value,
            vecteezyAiSoftware: vecteezyAiSoftwareSelect.value,
            vecteezyOtherSoftware: vecteezyOtherSoftwareInput.value,
            metadata_targetWebsite: metadataTargetWebsiteSelect.value,
            metadata_aiGenerated: aiGeneratedToggle.checked,
            metadata_autoFlow: autoFlowToggle.checked,
            metadata_repetitionLimit: parseInt(repetitionCountInput.value, 10),
            metadata_custom: metadataCustomInput.value,
            metadata_filterLow: metadataFilterLow.checked,
            metadata_filterMedium: metadataFilterMedium.checked,
            metadata_filterHigh: metadataFilterHigh.checked,
            research_targetWebsite: targetWebsiteSelect.value,
            research_keywordCount: parseInt(researchKeywordCountInput.value, 10) || 25,
            research_filterLow: filterLevelLow.checked,
            research_filterMedium: filterLevelMedium.checked,
            research_filterHigh: filterLevelHigh.checked,
            research_threshold_medium: parseInt(thresholdMediumInput.value, 10) || 1000,
            research_threshold_high: parseInt(thresholdHighInput.value, 10) || 10000,
            prompt_type: promptTypeSelect.value,
            prompt_style: promptStyleSelect.value,
            prompt_count: parseInt(promptCountInput.value, 10) || 3,
            prompt_similarity: promptSimilarityLevelSelect.value,
            imageGen_website: imageGenWebsiteSelect.value,
            imageGen_autoFlow: imageGenAutoFlowToggle.checked,
            imageGen_repetition: parseInt(imageGenRepetitionInput.value, 10) || 1,
            imageGen_waitTime: parseInt(imageGenWaitTimeInput.value, 10) || 20,
            imageGen_downloadCount: parseInt(imageGenDownloadCountSelect.value, 10) || 1
        });
    };
    
    const updateModelDropdown = (provider, selectedModel) => {
        aiModelSelect.innerHTML = '';
        const options = modelOptions[provider] || [];
        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
            aiModelSelect.appendChild(optionEl);
        });
        if (selectedModel && Array.from(aiModelSelect.options).some(o => o.value === selectedModel)) {
            aiModelSelect.value = selectedModel;
        }
    };

    const updateProviderUI = (provider) => {
        geminiKeyManager.classList.toggle('hidden', provider !== 'gemini');
        openaiKeyManager.classList.toggle('hidden', provider !== 'openai');
        deepseekKeyManager.classList.toggle('hidden', provider !== 'deepseek');
        openrouterKeyManager.classList.toggle('hidden', provider !== 'openrouter');
        groqKeyManager.classList.toggle('hidden', provider !== 'groq');
    };

    const toggleVecteezyOtherField = () => { vecteezyOtherSoftwareGroup.style.display = (vecteezyAiSoftwareSelect.value === 'other') ? 'block' : 'none'; };

    const loadAllSettings = () => {
        const allKeys = [
            'apiKeys', 'gemini_apiKeys', 'openai_apiKeys', 'deepseek_apiKeys', 'openrouter_apiKeys', 'groq_apiKeys', 'ai_provider', 'ai_model',
            'metadata_keywordCount', 'stepDelay', 'repetitionDelay',
            'vecteezyLicense', 'vecteezyAiSoftware', 'vecteezyOtherSoftware',
            'metadata_targetWebsite', 'metadata_aiGenerated', 'metadata_autoFlow', 'metadata_repetitionLimit',
            'metadata_custom', 'metadata_filterLow', 'metadata_filterMedium', 'metadata_filterHigh',
            'research_targetWebsite', 'research_keywordCount', 'research_filterLow', 'research_filterMedium',
            'research_filterHigh', 'research_threshold_medium', 'research_threshold_high',
            'prompt_type', 'prompt_style', 'prompt_count', 'prompt_similarity',
            'imageGen_website', 'imageGen_autoFlow', 'imageGen_repetition', 'imageGen_waitTime', 'imageGen_downloadCount'
        ];
        
        chrome.storage.sync.get(allKeys, (data) => {
            const provider = data.ai_provider || 'gemini';
            aiProviderSelect.value = provider;
            updateProviderUI(provider);
            updateModelDropdown(provider, data.ai_model);

            geminiApiKeys = data.gemini_apiKeys || data.apiKeys || [];
            openaiApiKeys = data.openai_apiKeys || [];
            deepseekApiKeys = data.deepseek_apiKeys || [];
            openrouterApiKeys = data.openrouter_apiKeys || [];
            groqApiKeys = data.groq_apiKeys || [];
            renderGeminiApiKeys();
            renderOpenaiApiKeys();
            renderDeepseekApiKeys();
            renderOpenRouterApiKeys();
            renderGroqApiKeys();

            metadataKeywordCountInput.value = data.metadata_keywordCount || 25;
            stepDelayInput.value = data.stepDelay || 2;
            repetitionDelayInput.value = data.repetitionDelay || 5;
            vecteezyLicenseSelect.value = data.vecteezyLicense || 'pro';
            vecteezyAiSoftwareSelect.value = data.vecteezyAiSoftware || 'midjourney';
            vecteezyOtherSoftwareInput.value = data.vecteezyOtherSoftware || '';
            toggleVecteezyOtherField();
            
            metadataTargetWebsiteSelect.value = data.metadata_targetWebsite || 'dreamstime';
            aiGeneratedToggle.checked = data.metadata_aiGenerated === true;
            autoFlowToggle.checked = data.metadata_autoFlow === true;
            repetitionCountInput.value = data.metadata_repetitionLimit !== undefined ? data.metadata_repetitionLimit : 10;
            repetitionCountGroup.style.display = autoFlowToggle.checked ? 'block' : 'none';
            metadataCustomInput.value = data.metadata_custom || '';
            metadataFilterLow.checked = data.metadata_filterLow !== false;
            metadataFilterMedium.checked = data.metadata_filterMedium !== false;
            metadataFilterHigh.checked = data.metadata_filterHigh !== false;
            
            targetWebsiteSelect.value = data.research_targetWebsite || 'adobe-stock';
            researchKeywordCountInput.value = data.research_keywordCount || 25;
            filterLevelLow.checked = data.research_filterLow !== false; 
            filterLevelMedium.checked = data.research_filterMedium !== false;
            filterLevelHigh.checked = data.research_filterHigh !== false;
            thresholdMediumInput.value = data.research_threshold_medium || 1000;
            thresholdHighInput.value = data.research_threshold_high || 10000;
            
            promptTypeSelect.value = data.prompt_type || 'image';
            promptStyleSelect.value = data.prompt_style || 'realistic';
            promptCountInput.value = data.prompt_count || 3;
            promptSimilarityLevelSelect.value = data.prompt_similarity || 'balance';
            
            imageGenWebsiteSelect.value = data.imageGen_website || 'imagefx';
            imageGenAutoFlowToggle.checked = data.imageGen_autoFlow === true;
            imageGenRepetitionInput.value = data.imageGen_repetition || 1;
            imageGenWaitTimeInput.value = data.imageGen_waitTime || 20;
            imageGenDownloadCountSelect.value = data.imageGen_downloadCount || 1;
            imageGenRepetitionGroup.style.display = imageGenAutoFlowToggle.checked ? 'block' : 'none';
            
            toggleImageGenOptions();
            updatePromptGenVisibility();
            checkCurrentTabSupport();
        });
    };
    
    const renderApiKeyList = (container, keys, providerName) => {
        container.innerHTML = '';
        if (!keys || keys.length === 0) {
            container.innerHTML = `<p class="description">Belum ada API Key ${providerName} ditambahkan.</p>`;
            return;
        }
        keys.forEach((key, index) => {
            const item = document.createElement('div');
            item.className = 'api-key-item';
            const text = `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
            item.innerHTML = `<span class="api-key-text" title="${key}">${text}</span><button class="delete-key-btn" data-index="${index}" data-provider="${providerName.toLowerCase().replace(' ', '')}">&times;</button>`;
            container.appendChild(item);
        });
    };
    
    const renderGeminiApiKeys = () => renderApiKeyList(geminiApiKeyListContainer, geminiApiKeys, 'Gemini');
    const renderOpenaiApiKeys = () => renderApiKeyList(openaiApiKeyListContainer, openaiApiKeys, 'OpenAI');
    const renderDeepseekApiKeys = () => renderApiKeyList(deepseekApiKeyListContainer, deepseekApiKeys, 'DeepSeek');
    const renderOpenRouterApiKeys = () => renderApiKeyList(openrouterApiKeyListContainer, openrouterApiKeys, 'OpenRouter');
    const renderGroqApiKeys = () => renderApiKeyList(groqApiKeyListContainer, groqApiKeys, 'Groq');
    
    // ===============================================
    // FUNGSI SETUP UNTUK SETIAP HALAMAN
    // ===============================================

    const handleWebsiteSelectionChange = async (selectElement) => {
        const selectedValue = selectElement.value;
        const siteMap = {
            'dreamstime': { url: 'https://www.dreamstime.com/upload', pattern: '*://*.dreamstime.com/upload*' },
            'adobestock': { url: 'https://contributor.stock.adobe.com/en/uploads', pattern: '*://contributor.stock.adobe.com/*' },
            'vecteezy': { url: 'https://www.vecteezy.com/portfolio/add_data?page=1', pattern: '*://*.vecteezy.com/portfolio/add_data*' },
            'imagefx': { url: 'https://labs.google/fx/id/tools/image-fx', pattern: '*://labs.google/fx/id/tools/image-fx*' },
            'whisk': { url: 'https://labs.google/fx/id/tools/whisk/project', pattern: '*://labs.google/fx/id/tools/whisk/*' },
            'ai-studio': { url: 'https://aistudio.google.com/app/prompts/new_image', pattern: '*://aistudio.google.com/*' },
            'leonardo': { url: 'https://app.leonardo.ai/ai-generations', pattern: '*://app.leonardo.ai/*' },
            'dreamina': { url: 'https://www.capcut.com/ai-tool/text-to-image', pattern: '*://*.capcut.com/ai-tool/*' },
            'stable-diffusion': { url: 'https://stablediffusionweb.com/', pattern: '*://stablediffusionweb.com/*' },
        };
        
        const siteInfo = siteMap[selectedValue];
        if (!siteInfo) return;

        try {
            const tabs = await chrome.tabs.query({ url: siteInfo.pattern });
            if (tabs.length === 0) {
                chrome.tabs.create({ url: siteInfo.url, active: true });
                showToast(`Membuka ${selectElement.options[selectElement.selectedIndex].text}...`);
            } else {
                await chrome.tabs.update(tabs[0].id, { active: true });
                if (tabs[0].windowId) await chrome.windows.update(tabs[0].windowId, { focused: true });
            }
        } catch (e) {
            console.error("Gagal memeriksa atau membuat tab:", e);
        }
    };

    const updateResearchButtonState = () => {
        const hasText = researchKeywordsTextarea.value.trim() !== '';
        const hasMedia = !!researchMediaState.file;
        startResearchBtn.disabled = !hasText && !hasMedia;
    };

    function setupResearchPage() {
        setupSingleUploader(researchUploader, researchFileInput, researchMediaState, updateResearchButtonState);
        researchKeywordsTextarea.addEventListener('input', updateResearchButtonState);
        
        toggleResearchSettingsBtn.addEventListener('click', () => {
            researchAdvancedSettings.classList.toggle('hidden');
        });

        startResearchBtn.addEventListener('click', async () => {
            if (isResearchRunning) {
                chrome.runtime.sendMessage({ type: "STOP_RESEARCH" });
                return;
            }
            
            const keywords = researchKeywordsTextarea.value.split('\n').filter(k => k.trim());
            const website = targetWebsiteSelect.value;
            if (keywords.length === 0 && !researchMediaState.file) {
                showToast("Masukkan keyword atau upload gambar.", true);
                return;
            }
            
            researchLogDiv.innerHTML = '';
            reportTableBody.innerHTML = '<tr><td colspan="4" class="placeholder-text">Memproses...</td></tr>';
            isResearchRunning = true;
            startResearchBtn.textContent = 'Hentikan Research';
            startResearchBtn.classList.add('is-running');

            if (researchMediaState.file) {
                addLog(researchLogDiv, 'Menganalisis gambar untuk mendapatkan keyword...');
                try {
                    const resizedDataUrl = await resizeImage(researchMediaState.file);
                    const response = await chrome.runtime.sendMessage({
                        type: "GET_KEYWORDS_FROM_IMAGE",
                        payload: { keywordCount: researchKeywordCountInput.value, fileData: { dataUrl: resizedDataUrl } }
                    });
                    if (response.success) {
                        researchKeywordsTextarea.value = response.keywords;
                        const keywordCount = response.keywords.split('\n').length;
                        addLog(researchLogDiv, `<strong>Analisis berhasil:</strong> Ditemukan ${keywordCount} keyword.`);
                        chrome.runtime.sendMessage({ type: "START_RESEARCH", keywords: response.keywords.split('\n'), website });
                    } else { throw new Error(response.error); }
                } catch (error) {
                    addLog(researchLogDiv, `Error saat analisis gambar: ${error.message}`, true);
                    isResearchRunning = false;
                    startResearchBtn.textContent = 'Mulai Research';
                    startResearchBtn.classList.remove('is-running');
                }
            } else {
                 chrome.runtime.sendMessage({ type: "START_RESEARCH", keywords, website });
            }
        });
    }
    
    function setupPromptGenPage() {
        setupMultiUploader(generatorUploader, generatorFileInput, promptGenMediaState, updatePromptGenVisibility);

        generatePromptsBtn.addEventListener('click', async () => {
            generatorLoader.classList.remove('hidden');
            generatePromptsBtn.disabled = true;
            promptGenLog.innerHTML = '';

            let requestedPromptCount = parseInt(promptCountInput.value, 10);
            const style = promptStyleSelect.value;
            const instructions = customInstructionsTextarea.value.trim();
            const promptType = promptTypeSelect.value;
            const mediaType = promptType === 'video' ? 'video clips' : 'images';

            const formattingRules = `**Strict Formatting Rules:**\n- The response MUST be a valid JSON object.\n- The JSON object MUST have a single key named "prompts".\n- The value of "prompts" MUST be a JSON array of strings.\n- Each string in the array is a complete, ready-to-use prompt.\n- Each prompt in the array MUST BE UNIQUE AND DISTINCT from the others.\n- Do NOT include any other text, explanations, or markdown outside of the single JSON object.`;

            try {
                if (promptGenMediaState.length > 0) {
                    const similarityLevel = promptSimilarityLevelSelect.value;
                    let similarityInstruction = '';
                    
                    switch(similarityLevel) {
                        case 'low': similarityInstruction = "The prompts should take inspiration from the core theme, mood, or color palette of the image, but introduce a new main subject or a significantly altered setting. Avoid a literal description, but ensure a clear conceptual link to the original image remains."; break;
                        case 'high': similarityInstruction = "The prompts must closely match the subject, style, and composition of the provided image. Focus on detailed and accurate descriptions of what is seen in the image."; break;
                        case '100%':
                            similarityInstruction = "Generate one single prompt that is a highly detailed, photorealistic, and 100% accurate description of the provided image, including its subject, composition, lighting, and style.";
                            if (requestedPromptCount > 1) addLog(promptGenLog, "Info: '100% Similarity' hanya menghasilkan 1 prompt. Jumlah prompt diabaikan.");
                            requestedPromptCount = 1;
                            break;
                        default: similarityInstruction = "The prompts should be creatively inspired by the image, balancing literal elements with artistic interpretations."; break;
                    }
                    
                    addLog(promptGenLog, `--- Memulai proses untuk ${promptGenMediaState.length} gambar ---`);

                    for (const [index, mediaItem] of promptGenMediaState.entries()) {
                        addLog(promptGenLog, `[Gambar ${index + 1}/${promptGenMediaState.length}] Menganalisis dengan similaritas '${similarityLevel}'...`);
                        
                        const finalPrompt = `Analyze the provided image. Generate ${requestedPromptCount} detailed, creative, and UNIQUE microstock prompts for ${mediaType}.\n\nSimilarity Instruction: ${similarityInstruction}\n\nStyle: ${style}\nAdditional Instructions: ${instructions}\n\n${formattingRules}`;
                        const payload = { 
                            prompt: finalPrompt, 
                            fileData: { dataUrl: await resizeImage(mediaItem.file) } 
                        };

                        const response = await chrome.runtime.sendMessage({ type: "GENERATE_KEYWORDS_OR_PROMPTS", payload });

                        if (response.success) {
                            const newPromptsText = response.keywords;
                            promptResultsTextarea.value += (promptResultsTextarea.value ? '\n\n' : '') + newPromptsText;
                            addLog(promptGenLog, `-> Berhasil membuat ${newPromptsText.split('\n\n').length} prompt dari gambar #${index + 1}.`);
                        } else {
                            addLog(promptGenLog, `-> Gagal untuk gambar #${index + 1}: ${response.error}`, true);
                        }
                        await delay(500); // Jeda antar panggilan API
                    }
                    addLog(promptGenLog, `--- Selesai memproses semua gambar. ---`);
                } 
                else {
                    const keywords = generatorPromptTextarea.value.split('\n').filter(k => k.trim());
                    if (keywords.length === 0) {
                        showToast("Masukkan keyword atau upload gambar.", true);
                        return;
                    }
                    
                    addLog(promptGenLog, `--- Memulai proses untuk ${keywords.length} keyword ---`);
                    let totalPromptsGenerated = 0;

                    for (const [index, keyword] of keywords.entries()) {
                        addLog(promptGenLog, `[${index + 1}/${keywords.length}] Membuat prompt untuk: "${keyword}"...`);
                        
                        const finalPrompt = `Based on the following theme: "${keyword}", generate ${requestedPromptCount} detailed, creative, and UNIQUE microstock prompts for ${mediaType}.\nStyle: ${style}\nAdditional Instructions: ${instructions}\n\n${formattingRules}`;
                        const payload = { prompt: finalPrompt, fileData: null };
                        
                        const response = await chrome.runtime.sendMessage({ type: "GENERATE_KEYWORDS_OR_PROMPTS", payload });

                        if (response.success) {
                            const newPromptsText = response.keywords;
                            const count = newPromptsText.split('\n\n').filter(p => p).length;
                            totalPromptsGenerated += count;
                            promptResultsTextarea.value += (promptResultsTextarea.value ? '\n\n' : '') + newPromptsText;
                            addLog(promptGenLog, `-> Sukses, ${count} prompt ditambahkan.`);
                        } else {
                            addLog(promptGenLog, `-> Gagal untuk "${keyword}": ${response.error}`, true);
                        }
                        promptResultsTextarea.scrollTop = promptResultsTextarea.scrollHeight;
                        await delay(500);
                    }
                    addLog(promptGenLog, `--- Selesai. Total ${totalPromptsGenerated} prompt dibuat. ---`);
                }
            } catch (error) {
                 addLog(promptGenLog, `Fatal Error: ${error.message}`, true);
            } finally {
                generatorLoader.classList.add('hidden');
                updatePromptGenButtonState();
            }
        });

        clearPromptResultsBtn.addEventListener('click', () => { promptResultsTextarea.value = ''; });
        togglePromptGenSettingsBtn.addEventListener('click', () => promptGenAdvancedSettings.classList.toggle('hidden'));
    }

    function setupImageGenPage() {
        chrome.storage.local.get(['imageGenPrompts'], (result) => {
            if (result.imageGenPrompts) imageGenPromptTextarea.value = result.imageGenPrompts;
        });

        imageGenPromptTextarea.addEventListener('input', () => {
            chrome.storage.local.set({ imageGenPrompts: imageGenPromptTextarea.value });
        });
        
        startImageGenBtn.addEventListener('click', async () => {
            if (isImageGenRunning) {
                addLog(imageGenLogDiv, "Perintah henti diterima. Flow akan dihentikan setelah prompt saat ini selesai.", true);
                isImageGenRunning = false;
                startImageGenBtn.textContent = "Menghentikan...";
                startImageGenBtn.disabled = true; 
                return;
            }
    
            let prompts = imageGenPromptTextarea.value.split('\n\n').map(p => p.trim()).filter(p => p);
            if (prompts.length === 0) {
                showToast("Masukkan setidaknya satu prompt.", true);
                return;
            }
    
            const website = imageGenWebsiteSelect.value;
            const waitTime = (parseInt(imageGenWaitTimeInput.value, 10) || 20) * 1000;
            const downloadCount = parseInt(imageGenDownloadCountSelect.value, 10);
            const isAutoFlow = imageGenAutoFlowToggle.checked;
            const repetitionCount = parseInt(imageGenRepetitionInput.value, 10) || 1;
            const actionMap = { 'imagefx': 'executeImageFxFlow', 'ai-studio': 'executeGoogleAIStudioFlow', 'stable-diffusion': 'executeStableDiffusionFlow', 'whisk': 'executeWhiskFlow', 'dreamina': 'executeDreaminaFlow', 'leonardo': 'executeLeonardoFlow' };
            const actionName = actionMap[website];
    
            if (!actionName) {
                addLog(imageGenLogDiv, `Website '${website}' tidak didukung.`, true);
                return;
            }
    
            isImageGenRunning = true;
            addLog(imageGenLogDiv, `--- Memulai Flow untuk ${website} ---`);
            startImageGenBtn.textContent = 'Hentikan Flow';
            startImageGenBtn.classList.add('is-running');
            startImageGenBtn.disabled = false;
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                addLog(imageGenLogDiv, "Tidak ada tab aktif ditemukan.", true);
                isImageGenRunning = false;
            }
    
            const originalPrompts = [...prompts];
            const totalRuns = isAutoFlow ? repetitionCount : 1;

            for (let run = 1; run <= totalRuns && isImageGenRunning; run++) {
                 if (isAutoFlow && totalRuns > 1) addLog(imageGenLogDiv, `<strong>Pengulangan ${run}/${totalRuns}</strong>`);
                 
                 while(prompts.length > 0 && isImageGenRunning) {
                    const currentPrompt = prompts[0];
                    addLog(imageGenLogDiv, `[${prompts.length} tersisa] Menjalankan: "${currentPrompt.substring(0, 50)}..."`);
                    
                    try {
                        const response = await chrome.runtime.sendMessage({ action: actionName, prompt: currentPrompt, waitTime, downloadCount, tabId: tab.id });
                        if (!isImageGenRunning) break;
                        if (response && response.status === 'success') {
                            addLog(imageGenLogDiv, `-> Sukses.`);
                            prompts.shift(); 
                            imageGenPromptTextarea.value = prompts.join('\n\n');
                            chrome.storage.local.set({ imageGenPrompts: imageGenPromptTextarea.value });
                        } else {
                            throw new Error(response?.message || "Tidak ada respons dari skrip konten.");
                        }
                    } catch (e) {
                         addLog(imageGenLogDiv, `-> Gagal: ${e.message}`, true);
                         isImageGenRunning = false; 
                    }
                    if(isImageGenRunning && prompts.length > 0) await delay(2000); 
                 }

                 if (isAutoFlow && run < totalRuns && isImageGenRunning) {
                     addLog(imageGenLogDiv, `Siklus ${run} selesai. Mengisi ulang untuk siklus berikutnya...`);
                     prompts = [...originalPrompts];
                     imageGenPromptTextarea.value = prompts.join('\n\n');
                 }
            }
    
            addLog(imageGenLogDiv, isImageGenRunning ? "--- Flow Selesai ---" : "--- Flow Dihentikan ---");
            isImageGenRunning = false;
            startImageGenBtn.textContent = 'Generate & Download';
            startImageGenBtn.classList.remove('is-running');
            startImageGenBtn.disabled = false;
        });
        
        clearImageGenPromptsBtn.addEventListener('click', () => { 
            imageGenPromptTextarea.value = ''; 
            chrome.storage.local.set({ imageGenPrompts: '' }); 
        });
        
        importImageGenPromptsBtn.addEventListener('click', () => {
            imageGenPromptImportInput.click();
        });

        imageGenPromptImportInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            if (file.type !== 'text/plain') {
                showToast('Hanya file .txt yang didukung.', true);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const newPrompts = event.target.result.trim();
                const existingPrompts = imageGenPromptTextarea.value.trim();
                
                imageGenPromptTextarea.value = existingPrompts ? `${existingPrompts}\n\n${newPrompts}` : newPrompts;

                chrome.storage.local.set({ imageGenPrompts: imageGenPromptTextarea.value });
                showToast('Prompts berhasil diimpor!');
            };
            reader.onerror = () => {
                showToast('Gagal membaca file.', true);
            };
            reader.readAsText(file);
            
            e.target.value = '';
        });
        
        toggleImageGenSettingsBtn.addEventListener('click', () => imageGenAdvancedSettings.classList.toggle('hidden'));
    }

    function updateStartStopButtonState(enabled, isRunning = false) {
        isMetadataFlowRunning = isRunning;
        startStopBtn.disabled = !enabled;
        startStopBtn.classList.toggle('is-running', isRunning);
        if (isRunning) {
            startStopBtn.textContent = 'Hentikan Auto Flow';
        } else if (enabled) {
            const websiteText = metadataTargetWebsiteSelect.options[metadataTargetWebsiteSelect.selectedIndex].text;
            startStopBtn.textContent = autoFlowToggle.checked ? `Mulai Auto Flow (${websiteText})` : `Generate 1x untuk ${websiteText}`;
        } else {
            startStopBtn.textContent = 'Buka Website yang Didukung';
        }
    };

    function setupMetadataPage() {
        startStopBtn.addEventListener('click', () => {
            if (isMetadataFlowRunning) {
                chrome.runtime.sendMessage({ action: "stopAutoFlow" });
            } else {
                clearMetadataLog();
                addMetadataLog('Meminta untuk memulai proses...');
                const settings = {
                    targetWebsite: metadataTargetWebsiteSelect.value, 
                    isAiGenerated: aiGeneratedToggle.checked, 
                    isAutoFlow: autoFlowToggle.checked,
                    repetitionLimit: parseInt(repetitionCountInput.value, 10),
                    customMetadata: metadataCustomInput.value.trim(),
                    vecteezy: { license: vecteezyLicenseSelect.value, aiSoftware: vecteezyAiSoftwareSelect.value, otherAiSoftware: vecteezyOtherSoftwareInput.value },
                    competition: { low: metadataFilterLow.checked, medium: metadataFilterMedium.checked, high: metadataFilterHigh.checked }
                };
                chrome.runtime.sendMessage({ action: "startGeneration", settings });
            }
        });
        refreshPreviewBtn.addEventListener('click', async () => {
            addMetadataLog('Meminta refresh pratinjau manual...');
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: "getLatestImagePreview" }, (response) => {
                        if (chrome.runtime.lastError) {
                            addMetadataLog(`Gagal menghubungi halaman: ${chrome.runtime.lastError.message}`, true);
                        } else if (response?.status === 'SUCCESS') {
                            addMetadataLog('Pratinjau berhasil diperbarui.');
                        } else {
                            addMetadataLog(`Gagal memperbarui: ${response?.message || 'Error'}`, true);
                        }
                    });
                }
            } catch (error) { addMetadataLog(`Error: ${error.message}`, true); }
        });
        toggleMetadataSettingsBtn.addEventListener('click', () => metadataSettingsCard.classList.toggle('hidden'));
    }

    const sortAndRenderReport = () => {
        const sortBy = researchSortFilter.value;
        const thresholdMedium = parseInt(thresholdMediumInput.value, 10) || 1000;
        const thresholdHigh = parseInt(thresholdHighInput.value, 10) || 10000;
        const showLow = filterLevelLow.checked, showMedium = filterLevelMedium.checked, showHigh = filterLevelHigh.checked;

        const getCompetitionLevel = (count) => (count > thresholdHigh ? 'Tinggi' : count > thresholdMedium ? 'Sedang' : 'Rendah');
        
        const filteredData = reportDataCache.filter(item => {
            const level = getCompetitionLevel(item.resultCount);
            return (level === 'Rendah' && showLow) || (level === 'Sedang' && showMedium) || (level === 'Tinggi' && showHigh);
        });

        filteredData.sort((a, b) => {
            switch (sortBy) {
                case 'results_asc': return a.resultCount - b.resultCount;
                case 'keyword_asc': return a.keyword.localeCompare(b.keyword);
                case 'keyword_desc': return b.keyword.localeCompare(a.keyword);
                default: return b.resultCount - a.resultCount;
            }
        });
        reportTableBody.innerHTML = '';
        if (filteredData.length === 0) {
            reportTableBody.innerHTML = '<tr><td colspan="4" class="placeholder-text">Tidak ada data yang cocok dengan filter.</td></tr>';
        } else {
            filteredData.forEach(item => {
                const row = document.createElement('tr');
                const level = getCompetitionLevel(item.resultCount);
                row.innerHTML = `<td class="checkbox-col"><input type="checkbox" class="keyword-checkbox"></td><td>${item.keyword}</td><td>${item.resultCount.toLocaleString('id-ID')}</td><td class="difficulty-${level.toLowerCase()}">${level}</td>`;
                reportTableBody.appendChild(row);
            });
        }
        copyKeywordsActionGroup.classList.toggle('hidden', filteredData.length === 0);
    };
    
    // ===============================================
    // INISIALISASI APLIKASI
    // ===============================================
    const initializeApp = () => {
        loadAllSettings();
        setupResearchPage();
        setupPromptGenPage();
        setupImageGenPage();
        setupMetadataPage();
        showPage('page-research');
        updateResearchButtonState();

        settingsBtn.addEventListener('click', () => showSettings(true));
        backToAppBtn.addEventListener('click', () => showSettings(false));
        mainNav.addEventListener('click', (e) => { if (e.target.matches('.main-nav-btn')) showPage(e.target.dataset.page); });
        
        document.querySelectorAll('input, select, textarea').forEach(input => input.addEventListener('change', saveAllSettings));

        metadataTargetWebsiteSelect.addEventListener('change', () => {
            checkCurrentTabSupport();
            handleWebsiteSelectionChange(metadataTargetWebsiteSelect);
        });
        imageGenWebsiteSelect.addEventListener('change', () => handleWebsiteSelectionChange(imageGenWebsiteSelect));

        aiProviderSelect.addEventListener('change', () => {
            const provider = aiProviderSelect.value;
            updateProviderUI(provider);
            updateModelDropdown(provider, null);
            saveAllSettings();
        });
        
        const addKeyHandler = (input, keyArray, renderFunc) => {
            const newKey = input.value.trim();
            if (newKey) {
                keyArray.push(newKey);
                input.value = '';
                renderFunc();
                saveAllSettings();
            }
        };

        addGeminiKeyBtn.addEventListener('click', () => addKeyHandler(newGeminiApiKeyInput, geminiApiKeys, renderGeminiApiKeys));
        addOpenaiKeyBtn.addEventListener('click', () => addKeyHandler(newOpenaiApiKeyInput, openaiApiKeys, renderOpenaiApiKeys));
        addDeepseekKeyBtn.addEventListener('click', () => addKeyHandler(newDeepseekApiKeyInput, deepseekApiKeys, renderDeepseekApiKeys));
        addOpenrouterKeyBtn.addEventListener('click', () => addKeyHandler(newOpenrouterApiKeyInput, openrouterApiKeys, renderOpenRouterApiKeys));
        addGroqKeyBtn.addEventListener('click', () => addKeyHandler(newGroqApiKeyInput, groqApiKeys, renderGroqApiKeys));

        settingsPage.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-key-btn')) {
                const index = parseInt(e.target.dataset.index, 10);
                const provider = e.target.dataset.provider;
                if (provider === 'gemini') { geminiApiKeys.splice(index, 1); renderGeminiApiKeys(); }
                else if (provider === 'openai') { openaiApiKeys.splice(index, 1); renderOpenaiApiKeys(); }
                else if (provider === 'deepseek') { deepseekApiKeys.splice(index, 1); renderDeepseekApiKeys(); }
                else if (provider === 'openrouter') { openrouterApiKeys.splice(index, 1); renderOpenRouterApiKeys(); }
                else if (provider === 'groq') { groqApiKeys.splice(index, 1); renderGroqApiKeys(); }
                saveAllSettings();
            }
        });

        vecteezyAiSoftwareSelect.addEventListener('change', toggleVecteezyOtherField);
        autoFlowToggle.addEventListener('change', () => { repetitionCountGroup.style.display = autoFlowToggle.checked ? 'block' : 'none'; updateStartStopButtonState(true); });
        imageGenAutoFlowToggle.addEventListener('change', () => { imageGenRepetitionGroup.style.display = imageGenAutoFlowToggle.checked ? 'block' : 'none'; });
        imageGenWebsiteSelect.addEventListener('change', toggleImageGenOptions);
        promptSimilarityLevelSelect.addEventListener('change', updatePromptGenAdvancedVisibility);

        [researchSortFilter, filterLevelLow, filterLevelMedium, filterLevelHigh, thresholdMediumInput, thresholdHighInput].forEach(el => el.addEventListener('change', sortAndRenderReport));
        selectAllKeywordsCheckbox.addEventListener('change', (e) => reportTableBody.querySelectorAll('.keyword-checkbox').forEach(cb => cb.checked = e.target.checked));
        copyKeywordsBtn.addEventListener('click', () => {
            const selectedKeywords = Array.from(reportTableBody.querySelectorAll('.keyword-checkbox:checked')).map(cb => cb.closest('tr').children[1].textContent);
            if (selectedKeywords.length === 0) return showToast('Pilih setidaknya satu keyword.', true);
            generatorPromptTextarea.value = selectedKeywords.join('\n');
            showPage('page-generator');
            updatePromptGenButtonState();
            showToast(`${selectedKeywords.length} keyword disalin ke Prompt Generator!`);
        });

        generatorPromptTextarea.addEventListener('input', updatePromptGenButtonState);
        promptResultsCopyAllBtn.addEventListener('click', () => {
            const textToCopy = promptResultsTextarea.value;
            if (!textToCopy) return showToast('Tidak ada prompt untuk disalin.', true);
            imageGenPromptTextarea.value = textToCopy;
            chrome.storage.local.set({ imageGenPrompts: textToCopy });
            showPage('page-image-gen');
            showToast('Prompt berhasil disalin ke Image Generator!');
        });
        promptResultsExportBtn.addEventListener('click', () => {
            if (!promptResultsTextarea.value) return showToast("Tidak ada hasil untuk di-export.", true);
            const blob = new Blob([promptResultsTextarea.value], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `prompts_${new Date().toISOString().slice(0,10)}.txt`;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast("Hasil prompt berhasil di-export.");
        });

        chrome.runtime.onMessage.addListener((request) => {
            if (request.type?.startsWith("RESEARCH")) {
                if (request.type === "RESEARCH_LOG_UPDATE") addLog(researchLogDiv, request.message);
                else if (request.type === "RESEARCH_COMPLETE" || request.type === "RESEARCH_STOPPED") {
                    isResearchRunning = false;
                    startResearchBtn.textContent = 'Mulai Research';
                    startResearchBtn.classList.remove('is-running');
                    if (request.type === "RESEARCH_COMPLETE") {
                        showToast('Riset Selesai!');
                        reportDataCache = request.data || [];
                    } else {
                        addLog(researchLogDiv, `Riset dihentikan.`, true);
                    }
                    sortAndRenderReport();
                }
            }
            switch (request.action) {
                case 'updateImagePreview':
                    if(activePageId === 'page-metadata' && request.imageUrl) imagePreviewContainer.innerHTML = `<img src="${request.imageUrl}" alt="Pratinjau Gambar">`;
                    break;
                case 'log': if (activePageId === 'page-metadata') addMetadataLog(request.message); break;
                case 'flowStarted': updateStartStopButtonState(true, true); break;
                case 'flowStopped': updateStartStopButtonState(true, false); checkCurrentTabSupport(); break;
            }
        });

        chrome.tabs.onActivated.addListener(checkCurrentTabSupport);
        chrome.tabs.onUpdated.addListener((tabId, info) => { if (info.status === 'complete') checkCurrentTabSupport() });
    };

    initializeApp();
});