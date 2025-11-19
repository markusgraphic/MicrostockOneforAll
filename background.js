// background.js (Versi Lengkap dengan Perbaikan Penghentian Proses)

// ===============================================
// PENGATURAN AWAL & EVENT LIFECYCLE
// ===============================================

// Mengatur agar side panel terbuka saat ikon ekstensi di toolbar diklik.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});


// ===============================================
// MANAJEMEN STATE GLOBAL
// ===============================================

// State untuk fitur Research
let researchState = {
    isRunning: false,
    keywords: [],
    website: 'adobe-stock',
    results: [],
    currentKeywordIndex: 0,
    targetTabId: null,
    isScraping: false
};

// State untuk fitur Metadata Auto Flow
let metadataState = {
    isAutoFlowActive: false,
    currentTabId: null,
    isProcessing: false,
    repetitionLimit: 1,
    repetitionCount: 0,
    targetWebsite: 'dreamstime'
};


// ===============================================
// LISTENER PESAN UTAMA (Message Router)
// ===============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // --- Pesan untuk Fitur Research ---
    if (request.type === "START_RESEARCH") {
        startResearch(request.keywords, request.website);
        sendResponse({ status: "started" });
        return true; 
    }
    if (request.type === "STOP_RESEARCH") {
        stopResearch();
        sendResponse({ status: "stopped" });
        return true;
    }
    if (request.type === "GET_RESEARCH_STATE") {
        sendResponse(researchState);
        return true;
    }
    if (request.type === "GET_KEYWORDS_FROM_IMAGE") {
        const payload = {
            prompt: `Analyze this image. Create a newline-separated list of the ${request.payload.keywordCount || 25} most relevant keywords for a microstock site. The list must be clean, plain text. Do NOT include JSON, numbering, bullet points, or any introductory text.`,
            fileData: request.payload.fileData
        };
        
        callSelectedApi(payload).then(response => { 
            if (response.success) {
                const rawText = response.keywords;
                try {
                    const cleanedJsonString = rawText.replace(/```json|```/g, '').trim();
                    const parsed = JSON.parse(cleanedJsonString);
                    if (parsed && parsed.keywords) {
                        if (Array.isArray(parsed.keywords)) {
                             response.keywords = parsed.keywords.join('\n');
                        } else {
                             response.keywords = parsed.keywords.replace(/,\s*|\s*,\s*/g, '\n');
                        }
                    } else {
                        throw new Error("Bukan format JSON keyword yang diharapkan");
                    }
                } catch (e) {
                    const lines = rawText.split('\n');
                    const cleanedLines = lines.map(line => 
                        line.replace(/^\s*(\d+[\.\)]|[\*\-])\s*/, '').trim()
                    ).filter(line => line.length > 0);
                    response.keywords = cleanedLines.join('\n');
                }
            }
            if (response.success) {
                response.keywords = response.keywords.replace(/[\[\]"]/g, '');
            }
            sendResponse(response);
        });
        return true;
    }

    // --- Pesan untuk Fitur Generator (Prompt Gen) ---
    if (request.type === "GENERATE_KEYWORDS_OR_PROMPTS") {
        callSelectedApi(request.payload).then(response => { 
            if (response.success) {
                const rawText = response.keywords;
                let promptsArray = [];
                try {
                    const cleanedJsonString = rawText.replace(/```json|```/g, '').trim();
                    const parsedData = JSON.parse(cleanedJsonString);
                    if (parsedData && Array.isArray(parsedData.prompts)) {
                        promptsArray = parsedData.prompts;
                    } else {
                        throw new Error("Bukan format JSON prompt yang diharapkan.");
                    }
                } catch (e) {
                    promptsArray = rawText.split('\n')
                                     .map(line => line.replace(/^\s*(\d+[\.\)]|[\*\-])\s*/, '').trim())
                                     .filter(line => line.length > 0 && line.toLowerCase() !== 'prompts:');
                }
                
                const uniquePrompts = [...new Set(promptsArray)];
                
                response.keywords = uniquePrompts.join('\n\n');
            }
            sendResponse(response);
        });
        return true;
    }

    // --- Pesan untuk Otomatisasi AI Generator (Image Gen) ---
    if (request.action && request.action.startsWith("execute")) {
        const targetTabId = request.tabId || sender.tab?.id;
        if (targetTabId) {
            handleGeneratorFlows(request, targetTabId, sendResponse);
        } else {
            sendResponse({ status: 'error', message: 'Tidak dapat menemukan tab target.' });
        }
        return true;
    }

    // --- Pesan untuk Fitur Metadata ---
    if (request.action === "startGeneration") {
        metadataState.isAutoFlowActive = request.settings.isAutoFlow;
        metadataState.repetitionLimit = request.settings.repetitionLimit;
        metadataState.targetWebsite = request.settings.targetWebsite;
        metadataState.repetitionCount = 0;
        chrome.runtime.sendMessage({ action: "flowStarted" });
        startMetadataProcess(request.settings);
        sendResponse({ status: "started" });
        return true;
    }
    if (request.action === "stopAutoFlow") {
        stopMetadataFlow("Proses dihentikan oleh pengguna.");
        sendResponse({ status: "stopped" });
        return true;
    }
    if (request.action === "imagePreviewChanged") {
        chrome.runtime.sendMessage({ action: "updateImagePreview", imageUrl: request.imageUrl });
        return false;
    }
    if (request.action === "log") {
        chrome.runtime.sendMessage({ action: "log", message: request.message });
        return false;
    }
    if (request.action === "triggerRefresh") {
        logToPanel("Pemicu penyegaran manual diterima.");
        metadataState.isProcessing = false;
        chrome.storage.sync.get(['metadata_targetWebsite', 'metadata_aiGenerated', 'vecteezyLicense', 'vecteezyAiSoftware', 'vecteezyOtherSoftware', 'metadata_filterLow', 'metadata_filterMedium', 'metadata_filterHigh', 'metadata_custom'])
            .then(settings => {
                const processSettings = {
                    targetWebsite: settings.metadata_targetWebsite,
                    isAiGenerated: settings.metadata_aiGenerated,
                    isAutoFlow: false,
                    repetitionLimit: 1,
                    customMetadata: settings.metadata_custom,
                    vecteezy: {
                        license: settings.vecteezyLicense,
                        aiSoftware: settings.vecteezyAiSoftware,
                        otherAiSoftware: settings.vecteezyOtherSoftware
                    },
                    competition: {
                        low: settings.metadata_filterLow,
                        medium: settings.metadata_filterMedium,
                        high: settings.metadata_filterHigh
                    }
                };
                startMetadataProcess(processSettings);
            });
        return true;
    }
    
    return false;
});


// ===============================================
// LISTENER PERUBAHAN TAB (Menggabungkan Research & Metadata)
// ===============================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // --- Logika untuk Fitur Research ---
    if (
        researchState.isRunning &&
        tabId === researchState.targetTabId &&
        !researchState.isScraping &&
        changeInfo.status === 'complete' &&
        tab.url && !tab.url.startsWith('chrome://')
    ) {
        researchState.isScraping = true;
        const keyword = researchState.keywords[researchState.currentKeywordIndex];
        if (!keyword) {
            stopResearch();
            return;
        }
        console.log(`[Research] Tab ${tabId} complete. Injecting scraper for: "${keyword}"`);
        try {
            const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: robustScraperFunction,
                args: [keyword]
            });
            if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                handleScrapeResult(injectionResults[0].result);
            } else {
                handleScrapeResult({ error: `Injeksi berhasil tetapi tidak ada data untuk "${keyword}".`, keyword });
            }
        } catch (error) {
            console.error(`[Research] Scraper injection failed for "${keyword}":`, error);
            handleScrapeResult({ keyword: keyword, error: error.message });
        }
    }

    // --- Logika untuk Fitur Metadata ---
    if (changeInfo.status === 'complete' && tab.url) {
        
        if (tab.url.includes('dreamstime.com/upload')) {
            logToPanel("Halaman Dreamstime dimuat. Menjadwalkan refresh pratinjau otomatis...");
            setTimeout(() => {
                try {
                    chrome.tabs.sendMessage(tabId, { action: "getLatestImagePreview" }, (response) => {
                         if (chrome.runtime.lastError) {
                         } else if (response?.status === "SUCCESS") {
                            logToPanel("Pratinjau diperbarui secara otomatis.");
                         }
                    });
                } catch(e) { /* Abaikan error */ }
            }, 1000);
        }

        if (
            metadataState.isAutoFlowActive &&
            tabId === metadataState.currentTabId
        ) {
            let isSupportedPage = false;
            const hostname = new URL(tab.url).hostname;
            switch (metadataState.targetWebsite) {
                case 'dreamstime':
                    isSupportedPage = tab.url.includes("dreamstime.com/upload");
                    break;
                case 'adobestock':
                    isSupportedPage = (hostname === "contributor.stock.adobe.com");
                    break;
                case 'vecteezy':
                    isSupportedPage = tab.url.includes("vecteezy.com/portfolio/add_data");
                    break;
            }

            if (isSupportedPage) {
                metadataState.isProcessing = false;
                logToPanel("Halaman baru dimuat, bersiap untuk siklus Auto Flow berikutnya...");
                
                const keysToGet = [
                    'repetitionDelay', 'metadata_aiGenerated', 'metadata_autoFlow', 
                    'metadata_targetWebsite', 'vecteezyLicense', 'vecteezyAiSoftware', 
                    'vecteezyOtherSoftware', 'metadata_filterLow', 'metadata_filterMedium', 'metadata_filterHigh',
                    'metadata_custom'
                ];
                const storedSettings = await chrome.storage.sync.get(keysToGet);
                const delaySeconds = storedSettings.repetitionDelay || 5;
                logToPanel(`Menunggu ${delaySeconds} detik sebelum memulai proses...`);
                
                if (metadataState.isAutoFlowActive) {
                    setTimeout(() => {
                        const nextSettings = {
                            isAiGenerated: storedSettings.metadata_aiGenerated,
                            isAutoFlow: storedSettings.metadata_autoFlow,
                            targetWebsite: storedSettings.metadata_targetWebsite,
                            customMetadata: storedSettings.metadata_custom,
                            vecteezy: { 
                                license: storedSettings.vecteezyLicense, 
                                aiSoftware: storedSettings.vecteezyAiSoftware, 
                                otherAiSoftware: storedSettings.vecteezyOtherSoftware 
                            },
                            competition: {
                                low: storedSettings.metadata_filterLow,
                                medium: storedSettings.metadata_filterMedium,
                                high: storedSettings.metadata_filterHigh
                            }
                        };
                        startMetadataProcess(nextSettings);
                    }, delaySeconds * 1000);
                }
            }
        }
    }
});


// ===============================================
// BAGIAN A: FUNGSI-FUNGSI UNTUK FITUR RESEARCH
// ===============================================

function startResearch(keywords, website) {
    if (researchState.isRunning) return;
    researchState = { ...researchState, isRunning: true, keywords: keywords.filter(k => k.trim() !== ''), website: website, results: [], currentKeywordIndex: 0, targetTabId: null, isScraping: false };
    processNextKeyword();
}

function stopResearch() {
    researchState.isRunning = false;
    researchState.isScraping = false;
    if (researchState.results && researchState.results.length > 0) {
        chrome.storage.local.set({ 'lastResearchReport': researchState.results });
    }
    chrome.runtime.sendMessage({ type: "RESEARCH_STOPPED" });
}

async function processNextKeyword() {
    if (!researchState.isRunning || researchState.currentKeywordIndex >= researchState.keywords.length) {
        chrome.runtime.sendMessage({ type: "RESEARCH_COMPLETE", data: researchState.results });
        if (researchState.targetTabId) try { await chrome.tabs.remove(researchState.targetTabId); } catch(e) { console.log(`Tidak dapat menutup tab riset: ${e.message}`); }
        researchState.isRunning = false;
        return;
    }
    const keyword = researchState.keywords[researchState.currentKeywordIndex];
    const searchUrl = researchState.website === 'shutterstock'
        ? `https://www.shutterstock.com/search/${encodeURIComponent(keyword)}`
        : `https://stock.adobe.com/search?k=${encodeURIComponent(keyword)}`;
    
    chrome.runtime.sendMessage({ type: "RESEARCH_LOG_UPDATE", message: `[${researchState.currentKeywordIndex + 1}/${researchState.keywords.length}] Navigasi ke: <strong>"${keyword}"</strong>...` });

    try {
        if (researchState.targetTabId) {
            await chrome.tabs.update(researchState.targetTabId, { url: searchUrl, active: false });
        } else {
            const tab = await chrome.tabs.create({ url: searchUrl, active: false });
            researchState.targetTabId = tab.id;
        }
    } catch (error) {
        chrome.runtime.sendMessage({ type: "RESEARCH_LOG_UPDATE", message: `<span style="color:red;">ERROR FATAL: Tidak dapat mengontrol tab. Riset dihentikan.</span>` });
        stopResearch();
    }
}

function handleScrapeResult(data) {
    if (!researchState.isRunning) return;
    const expectedKeyword = researchState.keywords[researchState.currentKeywordIndex];
    if (data.error) {
        researchState.results.push({ keyword: expectedKeyword, resultCount: 0, error: data.error });
        chrome.runtime.sendMessage({ type: "RESEARCH_LOG_UPDATE", message: `<span style="color:red;">GAGAL "${expectedKeyword}": ${data.error}</span>` });
    } else {
        const resultData = { keyword: expectedKeyword, resultCount: data.resultCount };
        researchState.results.push(resultData);
        chrome.runtime.sendMessage({ type: "RESEARCH_LOG_UPDATE", message: `Hasil untuk "${resultData.keyword}": <strong>${resultData.resultCount.toLocaleString('id-ID')}</strong> item.` });
    }
    researchState.currentKeywordIndex++;
    researchState.isScraping = false;
    setTimeout(processNextKeyword, 1200);
}

function robustScraperFunction(expectedKeyword) {
    function parseNumberFromText(text) { if (!text || typeof text !== 'string') return 0; const cleanedText = text.replace(/[.,]/g, ''); const match = cleanedText.match(/\d+/); return match ? parseInt(match[0], 10) : 0; }
    function findElement(selectors) { for (const selector of selectors) { const el = document.querySelector(selector); if (el) return el; } return null; }
    const pageValidators = { 'Adobe Stock': (keywordEl, expectedKeyword) => { if (!keywordEl) return false; return keywordEl.value.toLowerCase().trim() === expectedKeyword.toLowerCase().trim(); }, 'Shutterstock': (keywordEl, expectedKeyword) => { const expected = expectedKeyword.toLowerCase().trim(); const pageTitle = document.title.toLowerCase(); const inputValue = keywordEl ? keywordEl.value.toLowerCase().trim() : ''; return pageTitle.includes(expected) || inputValue === expected; } };
    const SELECTOR_SETS = [{ name: 'Adobe Stock', keywordSelectors: ['input[data-test-id="search-bar-input"]', 'input[name="k"]'], resultsSelectors: ['.js-search-results strong', '[data-test-id="search-results-count-label"]'], extract: (kwEl, resEl) => ({ keyword: kwEl.value, resultCount: parseNumberFromText(resEl.innerText) }) }, { name: 'Shutterstock', keywordSelectors: ['input[data-automation="SearchBar_Loaded"]', 'input[type="search"]'], resultsSelectors: ['h2[class*="-subtitle"]', '[data-automation="search-result-title"]'], extract: (kwEl, resEl) => ({ keyword: kwEl.value, resultCount: parseNumberFromText(resEl.innerText) }) }];
    return new Promise((resolve, reject) => {
        const MAX_WAIT_TIME = 18000; const POLLING_INTERVAL = 300; let elapsedTime = 0;
        const poller = setInterval(() => {
            elapsedTime += POLLING_INTERVAL;
            const siteConfig = SELECTOR_SETS.find(s => window.location.hostname.includes(s.name.toLowerCase().split(' ')[0]));
            if (siteConfig) {
                const keywordEl = findElement(siteConfig.keywordSelectors); const resultsEl = findElement(siteConfig.resultsSelectors);
                const isPageReady = pageValidators[siteConfig.name](keywordEl, expectedKeyword);
                if (isPageReady && resultsEl && resultsEl.innerText) {
                    const data = siteConfig.extract(keywordEl, resultsEl);
                    if (data && typeof data.resultCount !== 'undefined' && !isNaN(data.resultCount)) { clearInterval(poller); resolve(data); return; }
                }
            }
            if (elapsedTime >= MAX_WAIT_TIME) {
                clearInterval(poller); const kwOnPage = findElement(['input[name="k"]', 'input[type="search"]'])?.value || 'N/A';
                reject({ keyword: expectedKeyword, error: `Timeout. Halaman mungkin menampilkan CAPTCHA atau hasil untuk keyword lain ("${kwOnPage}").` });
            }
        }, POLLING_INTERVAL);
    });
}


// ===============================================
// BAGIAN B: FUNGSI-FUNGSI UNTUK FITUR GENERATOR
// ===============================================

// Helper untuk fetch dengan timeout
async function fetchWithTimeout(resource, options = {}, timeout = 20000) {
    const controller = new AbortController();
    const id = setTimeout(() => {
        logToPanel(`Panggilan API melebihi batas waktu ${timeout / 1000} detik.`);
        controller.abort();
    }, timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal  
    });

    clearTimeout(id);
    return response;
}


async function callSelectedApi(payload) {
    const settings = await new Promise(resolve => {
        chrome.storage.sync.get(['ai_provider', 'ai_model'], result => resolve(result));
    });

    const provider = settings.ai_provider || 'gemini';
    const model = settings.ai_model;

    if (provider === 'openai') {
        return callOpenAIAPI(payload, model);
    }
    if (provider === 'deepseek') {
        return callDeepSeekAPI(payload, model);
    }
    if (provider === 'openrouter') {
        return callOpenRouterAPI(payload, model);
    }
    if (provider === 'groq') {
        return callGroqAPI(payload, model);
    }
    return callGeminiAPI(payload, model);
}

// === PERUBAHAN DIMULAI ===
async function callGroqAPI(payload, model) {
    const { prompt, fileData } = payload;

    const storageData = await new Promise(resolve => {
        chrome.storage.sync.get(['groq_apiKeys', 'groq_currentApiKeyIndex'], result => resolve(result));
    });

    const keys = storageData.groq_apiKeys;
    let currentKeyIndex = storageData.groq_currentApiKeyIndex || 0;

    if (!keys || keys.length === 0) {
        return { success: false, error: "Tidak ada Kunci API Groq. Silakan atur di halaman Pengaturan." };
    }
    if (!model) {
        return { success: false, error: "Model Groq tidak dipilih." };
    }

    const API_URL = "https://api.groq.com/openai/v1/chat/completions";
    let lastError;

    for (let i = 0; i < keys.length; i++) {
        const rawKey = keys[currentKeyIndex];
        const keyToUse = rawKey ? rawKey.trim() : '';

        if (!keyToUse) {
            logToPanel(`API Key Groq #${currentKeyIndex + 1} kosong, dilewati.`);
            currentKeyIndex = (currentKeyIndex + 1) % keys.length;
            continue;
        }

        logToPanel(`Mencoba Groq API Key #${currentKeyIndex + 1} dengan model ${model}...`);
        
        // Membuat konten pesan sebagai array, sesuai dengan standar model vision
        let userMessageContent = [{ "type": "text", "text": prompt }];
        if (fileData) {
            userMessageContent.push({
                "type": "image_url",
                "image_url": { "url": fileData.dataUrl }
            });
        }
        
        const messages = [{ role: "user", content: userMessageContent }];
        const requestBody = {
            model: model,
            messages: messages,
            // Tetap meminta format JSON untuk konsistensi, karena ini adalah tujuan utama ekstensi
            response_format: { "type": "json_object" } 
        };

        try {
            const response = await fetchWithTimeout(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${keyToUse}`
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();

            if (response.ok) {
                if (!data.choices?.[0]?.message?.content) {
                    throw new Error("Respons API Groq tidak valid atau kosong.");
                }
                await chrome.storage.sync.set({ groq_currentApiKeyIndex: currentKeyIndex });
                return { success: true, keywords: data.choices[0].message.content };
            }

            const errorMessage = data.error?.message || `Status ${response.status}`;
            throw new Error(`API Key Gagal (Error ${response.status}): ${errorMessage}`);

        } catch (error) {
            lastError = error.message;
            logToPanel(`Error: ${lastError}`);
        }
        
        logToPanel(`API Key #${currentKeyIndex + 1} gagal. Beralih ke kunci berikutnya.`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    }

    return { success: false, error: `Semua API Key Groq gagal. Kesalahan terakhir: ${lastError}` };
}
// === PERUBAHAN SELESAI ===

async function callOpenRouterAPI(payload, model) {
    const { prompt, fileData } = payload;
    const storageData = await new Promise(resolve => {
        chrome.storage.sync.get(['openrouter_apiKeys', 'openrouter_currentApiKeyIndex'], result => resolve(result));
    });

    const keys = storageData.openrouter_apiKeys;
    let currentKeyIndex = storageData.openrouter_currentApiKeyIndex || 0;

    if (!keys || keys.length === 0) {
        return { success: false, error: "Tidak ada Kunci API OpenRouter." };
    }
    if (!model) {
        return { success: false, error: "Model OpenRouter tidak dipilih." };
    }
    
    // === PERBAIKAN DIMULAI: Logika deteksi model vision yang lebih cerdas ===
    // Daftar kata kunci yang menandakan kemampuan vision pada sebuah model.
    const visionKeywords = ['vision', 'claude-3', 'gpt-4', 'gemini', 'flash', 'qwen-vl', 'idefics', 'llava'];
    // Memeriksa apakah nama model mengandung salah satu dari kata kunci di atas.
    const isVisionModel = visionKeywords.some(keyword => model.toLowerCase().includes(keyword));
    
    if (fileData && !isVisionModel) {
        return { success: false, error: `Model '${model}' tidak mendukung analisis gambar. Pilih model vision (e.g., Claude 3, GPT-4o, Gemini Flash).` };
    }
    // === PERBAIKAN SELESAI ===

    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    let lastError;

    for (let i = 0; i < keys.length; i++) {
        const rawKey = keys[currentKeyIndex];
        const keyToUse = rawKey ? rawKey.trim() : '';

        if (!keyToUse) {
            logToPanel(`API Key OpenRouter #${currentKeyIndex + 1} kosong, dilewati.`);
            currentKeyIndex = (currentKeyIndex + 1) % keys.length;
            continue;
        }

        logToPanel(`Mencoba OpenRouter API Key #${currentKeyIndex + 1} dengan model ${model}...`);
        
        let userMessageContent = [{ type: "text", text: prompt }];
        if (fileData && isVisionModel) {
            userMessageContent.push({ type: "image_url", image_url: { "url": fileData.dataUrl } });
        }
        
        const messages = [{ role: "user", content: userMessageContent }];
        const requestBody = {
            model: model,
            messages: messages,
            response_format: { "type": "json_object" } // Many OpenRouter models support this
        };

        try {
            const response = await fetchWithTimeout(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${keyToUse}`,
                    'HTTP-Referer': 'https://github.com/your-repo', // Recommended by OpenRouter
                    'X-Title': 'Microstock One for All'          // Recommended by OpenRouter
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();

            if (response.ok) {
                if (!data.choices?.[0]?.message?.content) {
                    throw new Error("Respons API OpenRouter tidak valid atau kosong.");
                }
                await chrome.storage.sync.set({ openrouter_currentApiKeyIndex: currentKeyIndex });
                return { success: true, keywords: data.choices[0].message.content };
            }

            const errorMessage = data.error?.message || `Status ${response.status}`;
            throw new Error(`API Key Gagal (Error ${response.status}): ${errorMessage}`);

        } catch (error) {
            lastError = error.message;
            logToPanel(`Error: ${lastError}`);
        }
        
        logToPanel(`API Key #${currentKeyIndex + 1} gagal. Beralih ke kunci berikutnya.`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    }

    return { success: false, error: `Semua API Key OpenRouter gagal. Kesalahan terakhir: ${lastError}` };
}

async function callDeepSeekAPI(payload, model) {
    const { prompt, fileData } = payload;
    const storageData = await new Promise(resolve => { 
        chrome.storage.sync.get(['deepseek_apiKeys', 'deepseek_currentApiKeyIndex'], result => resolve(result)); 
    });
    
    const keys = storageData.deepseek_apiKeys;
    let currentKeyIndex = storageData.deepseek_currentApiKeyIndex || 0;

    if (!keys || keys.length === 0) {
        return { success: false, error: "Tidak ada Kunci API DeepSeek. Silakan atur di halaman Pengaturan." };
    }

    let finalModel = model;
    if (fileData && model !== 'deepseek-vision') {
        finalModel = 'deepseek-vision';
        console.log(`Gambar terdeteksi. Beralih dari model ${model} ke ${finalModel}.`);
    }

    if (!finalModel) {
        return { success: false, error: "Model DeepSeek tidak dipilih. Silakan atur di halaman Pengaturan." };
    }

    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 5000;
    const API_URL = "https://api.deepseek.com/v1/chat/completions";
    let lastError;

    for (let i = 0; i < keys.length; i++) {
        const rawKey = keys[currentKeyIndex];
        const keyToUse = rawKey ? rawKey.trim() : '';

        if (!keyToUse) {
            logToPanel(`API Key DeepSeek #${currentKeyIndex + 1} kosong, dilewati.`);
            currentKeyIndex = (currentKeyIndex + 1) % keys.length;
            continue;
        }

        logToPanel(`Mencoba DeepSeek API Key #${currentKeyIndex + 1}...`);
        
        const userMessageContent = [{ "type": "text", "text": prompt }];
        if (fileData) {
            userMessageContent.push({ "type": "image_url", "image_url": { "url": fileData.dataUrl } });
        }
        
        const messages = [{ "role": "user", "content": userMessageContent }];
        const requestBody = { model: finalModel, messages: messages, response_format: { "type": "json_object" } };

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetchWithTimeout(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keyToUse}` },
                    body: JSON.stringify(requestBody)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (!data.choices?.[0]?.message?.content) {
                         throw new Error(data.error?.message || "Respons API DeepSeek tidak valid atau kosong.");
                    }
                    await chrome.storage.sync.set({ deepseek_currentApiKeyIndex: currentKeyIndex });
                    return { success: true, keywords: data.choices[0].message.content };
                }

                const errorText = await response.text();
                
                if (response.status === 503 || response.status === 429 || response.status === 500) {
                    lastError = `Server AI sedang sibuk (Error ${response.status}). Mencoba lagi...`;
                    logToPanel(lastError);
                    if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                } else {
                    throw new Error(`API Key Gagal (Error ${response.status}): ${errorText}`);
                }

            } catch (error) {
                lastError = error.name === 'AbortError' ? 'Permintaan API timeout.' : error.message;
                logToPanel(`Error pada percobaan ${attempt}: ${lastError}`);
                if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
        logToPanel(`API Key #${currentKeyIndex + 1} gagal. Beralih ke kunci berikutnya.`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    }

    return { success: false, error: `Semua API Key DeepSeek gagal. Kesalahan terakhir: ${lastError}` };
}

async function callOpenAIAPI(payload, model) {
    const { prompt, fileData } = payload;
    
    // === PERBAIKAN DIMULAI: Menambahkan pemeriksaan model vision untuk OpenAI ===
    // Model OpenAI yang mendukung vision umumnya mengandung 'gpt-4'.
    const isVisionModel = model.includes('gpt-4');
    if (fileData && !isVisionModel) {
        return { success: false, error: `Model '${model}' tidak mendukung analisis gambar. Pilih model vision seperti GPT-4o atau GPT-4 Turbo.` };
    }
    // === PERBAIKAN SELESAI ===

    const storageData = await new Promise(resolve => { 
        chrome.storage.sync.get(['openai_apiKeys', 'openai_currentApiKeyIndex'], result => resolve(result)); 
    });
    
    const keys = storageData.openai_apiKeys;
    let currentKeyIndex = storageData.openai_currentApiKeyIndex || 0;

    if (!keys || keys.length === 0) {
        return { success: false, error: "Tidak ada Kunci API OpenAI." };
    }
    if (!model) {
        return { success: false, error: "Model OpenAI tidak dipilih." };
    }

    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 5000;
    const API_URL = "https://api.openai.com/v1/chat/completions";
    let lastError;

    for (let i = 0; i < keys.length; i++) {
        const rawKey = keys[currentKeyIndex];
        const keyToUse = rawKey ? rawKey.trim() : '';
        
        if (!keyToUse) {
            logToPanel(`API Key OpenAI #${currentKeyIndex + 1} kosong, dilewati.`);
            currentKeyIndex = (currentKeyIndex + 1) % keys.length;
            continue;
        }

        logToPanel(`Mencoba OpenAI API Key #${currentKeyIndex + 1}...`);
        
        let userMessageContent = [];
        if (prompt) userMessageContent.push({ type: "text", text: prompt });
        if (fileData && isVisionModel) { // Pastikan hanya mengirim gambar ke model vision
            userMessageContent.push({ type: "image_url", image_url: { url: fileData.dataUrl } });
        }
        
        const messages = [{ role: "user", content: userMessageContent }];
        const requestBody = { model: model, messages: messages, response_format: { type: "json_object" } };

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetchWithTimeout(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keyToUse}` },
                    body: JSON.stringify(requestBody)
                });
                
                const data = await response.json();
                if (response.ok) {
                    if (!data.choices?.[0]?.message?.content) {
                         throw new Error(data.error?.message || "Respons API OpenAI tidak valid.");
                    }
                    await chrome.storage.sync.set({ openai_currentApiKeyIndex: currentKeyIndex });
                    return { success: true, keywords: data.choices[0].message.content };
                }

                const errorMessage = data.error?.message || `Status ${response.status}`;
                if (response.status === 503 || response.status === 429 || response.status === 500) {
                    lastError = `Server AI sedang sibuk (Error ${response.status}). Mencoba lagi...`;
                    logToPanel(lastError);
                    if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                } else {
                    throw new Error(`API Key Gagal (Error ${response.status}): ${errorMessage}`);
                }
            } catch (error) {
                lastError = error.name === 'AbortError' ? 'Permintaan API timeout.' : error.message;
                logToPanel(`Error pada percobaan ${attempt}: ${lastError}`);
                if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
        logToPanel(`API Key #${currentKeyIndex + 1} gagal. Beralih ke kunci berikutnya.`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    }
    return { success: false, error: `Semua API Key OpenAI gagal. Kesalahan terakhir: ${lastError}` };
}

async function callGeminiAPI(payload, model) {
    const { prompt, fileData } = payload;
    const storageData = await new Promise(resolve => { 
        chrome.storage.sync.get(['gemini_apiKeys', 'apiKeys', 'gemini_currentApiKeyIndex'], result => resolve(result)); 
    });
    
    const keys = storageData.gemini_apiKeys || storageData.apiKeys;
    let currentKeyIndex = storageData.gemini_currentApiKeyIndex || 0;

    if (!keys || keys.length === 0) { 
        return { success: false, error: "Tidak ada Kunci API Gemini." }; 
    }
    if (!model) {
        return { success: false, error: "Model Gemini tidak dipilih." };
    }
    
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 5000;
    let lastError;

    for (let i = 0; i < keys.length; i++) {
        const rawKey = keys[currentKeyIndex];
        const keyToUse = rawKey ? rawKey.trim() : '';

        if (!keyToUse) {
            logToPanel(`API Key Gemini #${currentKeyIndex + 1} kosong, dilewati.`);
            currentKeyIndex = (currentKeyIndex + 1) % keys.length; 
            continue;
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToUse}`;
        logToPanel(`Mencoba Gemini API Key #${currentKeyIndex + 1}...`);
        
        let apiParts = [];
        if (prompt) apiParts.push({ text: prompt });
        if (fileData) {
            const base64Data = fileData.dataUrl.split(',')[1];
            apiParts.push({ inline_data: { mime_type: "image/jpeg", data: base64Data } });
        }
        
        const requestBody = { contents: [{ parts: apiParts }], generationConfig: { response_mime_type: "application/json" } };
        
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetchWithTimeout(API_URL, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(requestBody) 
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                        const blockReason = data.promptFeedback?.blockReason;
                        throw new Error(blockReason ? `Konten diblokir oleh API: ${blockReason}` : "Respons API tidak valid atau kosong.");
                    }
                    await chrome.storage.sync.set({ gemini_currentApiKeyIndex: currentKeyIndex });
                    return { success: true, keywords: data.candidates[0].content.parts[0].text };
                }

                // === PERBAIKAN DIMULAI: Penanganan Error yang Lebih Baik ===
                let detailedErrorText = `Status ${response.status}`;
                try {
                    // Coba baca respons sebagai JSON untuk mendapatkan pesan error yang spesifik.
                    const errorData = await response.json();
                    detailedErrorText = errorData.error?.message || JSON.stringify(errorData);
                } catch (jsonError) {
                    // Jika gagal (bukan JSON), coba baca sebagai teks biasa.
                    try {
                        detailedErrorText = await response.text();
                    } catch (textError) {
                        // Fallback jika membaca teks juga gagal.
                        detailedErrorText = `Gagal membaca respons error (Status: ${response.status}).`;
                    }
                }

                if (response.status === 503 || response.status === 429 || response.status === 500) {
                    lastError = `Server AI sedang sibuk (Error ${response.status}). Mencoba lagi...`;
                    logToPanel(lastError);
                    if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                } else {
                    // Gunakan pesan error yang lebih detail yang sudah kita tangkap.
                    throw new Error(`API Key Gagal: ${detailedErrorText}`);
                }
                // === PERBAIKAN SELESAI ===

            } catch (error) {
                lastError = error.name === 'AbortError' ? 'Permintaan API timeout.' : error.message;
                logToPanel(`Error pada percobaan ${attempt}: ${lastError}`);
                if (attempt < MAX_RETRIES) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
        logToPanel(`API Key #${currentKeyIndex + 1} gagal. Beralih ke kunci berikutnya.`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length; 
    }
    return { success: false, error: `Semua API Key Gemini gagal. Kesalahan terakhir: ${lastError}` };
}

async function handleGeneratorFlows(request, tabId, sendResponse) {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    try {
        await chrome.scripting.executeScript({ target: { tabId: tabId }, files: ['content_generator.js'] });
        await sleep(200);
        chrome.tabs.sendMessage(tabId, request, (response) => {
            if (chrome.runtime.lastError) {
                sendResponse({ status: 'error', message: 'Koneksi ke halaman gagal. Coba muat ulang halaman.' });
            } else {
                sendResponse(response);
            }
        });
    } catch (error) {
        sendResponse({ status: 'error', message: `Gagal menginjeksi skrip: ${error.message}` });
    }
    return true; 
}

// ===============================================
// BAGIAN C: FUNGSI-FUNGSI UNTUK FITUR METADATA
// ===============================================

function logToPanel(message) {
    chrome.runtime.sendMessage({ action: "log", message: message }).catch(() => {});
}

async function stopMetadataFlow(finalMessage) {
    if (metadataState.targetWebsite === 'adobestock' && metadataState.currentTabId) {
        try {
            await chrome.tabs.sendMessage(metadataState.currentTabId, { action: "saveAdobeWork" });
        } catch (error) {
            logToPanel(`Peringatan: Gagal mengirim perintah simpan. (${error.message})`);
        }
    }
    metadataState.isProcessing = false;
    metadataState.isAutoFlowActive = false;
    metadataState.repetitionCount = 0;
    logToPanel(finalMessage);
    chrome.runtime.sendMessage({ action: "flowStopped" });
}

async function startMetadataProcess(settings) {
    if (metadataState.isProcessing) {
        logToPanel("Peringatan: Proses sudah berjalan, diabaikan.");
        return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) { 
        logToPanel("ERROR: Tidak dapat mengakses tab aktif.");
        chrome.runtime.sendMessage({ action: "flowStopped" });
        return;
    }
    
    let isContextValid = false;
    let expectedPageName = '';
    switch (settings.targetWebsite) {
        case 'dreamstime': isContextValid = tab.url.includes("dreamstime.com/upload"); expectedPageName = "halaman upload Dreamstime"; break;
        case 'adobestock': isContextValid = tab.url.includes("contributor.stock.adobe.com"); expectedPageName = "halaman kontributor Adobe Stock"; break;
        case 'vecteezy': isContextValid = tab.url.includes("vecteezy.com/portfolio/add_data"); expectedPageName = "halaman 'Add Data' Vecteezy"; break;
    }

    if (!isContextValid) {
        const errorMessage = `Pengaturan (${settings.targetWebsite}) tidak cocok dengan halaman ini. Buka ${expectedPageName}.`;
        logToPanel(`ERROR: ${errorMessage}`);
        chrome.runtime.sendMessage({ action: "flowStopped" });
        return;
    }

    metadataState.isProcessing = true;
    metadataState.currentTabId = tab.id;

    if (settings.isAutoFlow) { 
        metadataState.repetitionCount++;
        if (settings.repetitionLimit !== 0 && metadataState.repetitionCount > settings.repetitionLimit) {
            return stopMetadataFlow(`Batas ${settings.repetitionLimit} pengulangan tercapai.`);
        }
        logToPanel(`--- Memulai Siklus Otomatis ${metadataState.repetitionCount} / ${settings.repetitionLimit === 0 ? '∞' : settings.repetitionLimit} ---`);
    } else {
        logToPanel("--- Memulai Proses Metadata Tunggal ---");
    }

    try {
        if (settings.targetWebsite === 'dreamstime') await processDreamstime(tab, settings);
        else if (settings.targetWebsite === 'adobestock') await processAdobeStock(tab, settings);
        else if (settings.targetWebsite === 'vecteezy') await processVecteezy(tab, settings);
    } catch (error) {
        stopMetadataFlow(`PROSES GAGAL: ${error.message}`);
    }
}

async function processDreamstime(tab, settings) {
    logToPanel("Memproses gambar (Dreamstime)...");
    const injectionResults = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: getImageAsBase64_Dreamstime });
    const base64Data = injectionResults[0]?.result;
    if (!base64Data) throw new Error("Gagal mengambil data gambar dari halaman.");
    const metadata = await generateAndPrepareMetadata(base64Data, settings);
    if (!metadata) throw new Error("Gagal membuat metadata dari AI.");
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content_metadata_dreamstime.js'] });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "fillAndSubmitForm", metadata: metadata });
    if (response.status === "ERROR") throw new Error(response.message);
    if (!settings.isAutoFlow) stopMetadataFlow("Proses Dreamstime selesai.");
}

// === FUNGSI YANG DIPERBAIKI ===
async function processAdobeStock(tab, settings) {
    logToPanel("Memulai alur Adobe Stock...");
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content_metadata_adobestock.js'] });

    // === TITIK PEMERIKSAAN #1: Sebelum mengambil gambar ===
    if (settings.isAutoFlow && !metadataState.isAutoFlowActive) {
        return stopMetadataFlow("Proses dihentikan oleh pengguna sebelum memulai gambar berikutnya.");
    }

    const imageToProcess = await chrome.tabs.sendMessage(tab.id, { action: "getNextImage" });
    if (imageToProcess.status === 'DONE') return stopMetadataFlow("Semua gambar di Adobe Stock telah diproses.");
    if (imageToProcess.status === 'PAGINATING') { 
        logToPanel("Menunggu halaman berikutnya dimuat...");
        metadataState.isProcessing = false;
        return; 
    }
    if (imageToProcess.status === 'ERROR') throw new Error(imageToProcess.message);
    
    const { base64Data, index } = imageToProcess;

    // === TITIK PEMERIKSAAN #2: Sebelum memanggil AI ===
    if (settings.isAutoFlow && !metadataState.isAutoFlowActive) {
        return stopMetadataFlow("Proses dihentikan oleh pengguna sebelum metadata dibuat.");
    }

    const metadata = await generateAndPrepareMetadata(base64Data, settings);
    if (!metadata) throw new Error("Gagal membuat metadata dari AI.");

    // === TITIK PEMERIKSAAN #3: Sebelum mengisi formulir ===
    if (settings.isAutoFlow && !metadataState.isAutoFlowActive) {
        return stopMetadataFlow("Proses dihentikan oleh pengguna sebelum mengisi formulir.");
    }
    
    const response = await chrome.tabs.sendMessage(tab.id, { action: "fillAdobeForm", metadata, isAiGenerated: settings.isAiGenerated, index });
    if (response.status === "ERROR") throw new Error(response.message);
    
    metadataState.isProcessing = false;
    if (settings.isAutoFlow && metadataState.isAutoFlowActive) {
        const { stepDelay = 2 } = await chrome.storage.sync.get(['stepDelay']);
        logToPanel(`Menunggu ${stepDelay} detik sebelum memproses gambar berikutnya...`);
        setTimeout(() => startMetadataProcess(settings), stepDelay * 1000);
    } else {
        stopMetadataFlow("Proses Adobe Stock selesai.");
    }
}

// === FUNGSI YANG DIPERBAIKI ===
async function processVecteezy(tab, settings) {
    logToPanel("Memulai alur Vecteezy...");
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content_metadata_vecteezy.js'] });

    // === TITIK PEMERIKSAAN #1: Sebelum mengambil gambar ===
    if (settings.isAutoFlow && !metadataState.isAutoFlowActive) {
        return stopMetadataFlow("Proses dihentikan oleh pengguna sebelum memulai gambar berikutnya.");
    }

    const imageToProcess = await chrome.tabs.sendMessage(tab.id, { action: "getNextImage" });
    if (imageToProcess.status === 'DONE') return stopMetadataFlow("Semua gambar di Vecteezy telah diproses.");
    if (imageToProcess.status === 'PAGINATING') { 
        logToPanel("Menunggu halaman berikutnya dimuat...");
        metadataState.isProcessing = false;
        return; 
    }
    if (imageToProcess.status === 'ERROR') throw new Error(imageToProcess.message);

    const { base64Data, index } = imageToProcess;

    // === TITIK PEMERIKSAAN #2: Sebelum memanggil AI ===
    if (settings.isAutoFlow && !metadataState.isAutoFlowActive) {
        return stopMetadataFlow("Proses dihentikan oleh pengguna sebelum metadata dibuat.");
    }

    const metadata = await generateAndPrepareMetadata(base64Data, settings);
    if (!metadata) throw new Error("Gagal membuat metadata dari AI.");

    // === TITIK PEMERIKSAAN #3: Sebelum mengisi formulir ===
    if (settings.isAutoFlow && !metadataState.isAutoFlowActive) {
        return stopMetadataFlow("Proses dihentikan oleh pengguna sebelum mengisi formulir.");
    }
    
    const response = await chrome.tabs.sendMessage(tab.id, { action: "fillVecteezyForm", metadata, isAiGenerated: settings.isAiGenerated, vecteezySettings: settings.vecteezy, index });
    if (response.status === "ERROR") throw new Error(response.message);
    
    metadataState.isProcessing = false;
    if (settings.isAutoFlow && metadataState.isAutoFlowActive) {
        const { stepDelay = 2 } = await chrome.storage.sync.get(['stepDelay']);
        logToPanel(`Menunggu ${stepDelay} detik sebelum memproses gambar berikutnya...`);
        setTimeout(() => startMetadataProcess(settings), stepDelay * 1000);
    } else {
        stopMetadataFlow("Proses Vecteezy selesai.");
    }
}

const cleanMetadataField = (text, keepCommas = false) => {
    if (typeof text !== 'string') return '';
    const regex = keepCommas ? /[^a-zA-Z0-9\s,]/g : /[^a-zA-Z0-9\s]/g;
    return text.replace(regex, ' ').replace(/\s\s+/g, ' ').trim();
};


async function generateAndPrepareMetadata(base64Data, settings) {
    const storedData = await chrome.storage.sync.get(['ai_provider', 'ai_model', 'metadata_keywordCount']);
    const provider = storedData.ai_provider;
    const model = storedData.ai_model;
    const keywordCount = storedData.metadata_keywordCount || 25;

    let competitionInstruction = '';
    const levels = [];
    if (settings.competition.low) levels.push('low');
    if (settings.competition.medium) levels.push('medium');
    if (settings.competition.high) levels.push('high');
    if (levels.length > 0 && levels.length < 3) {
        competitionInstruction = ` Prioritize keywords with a ${levels.join(' and ')} competition level.`;
    }

    logToPanel(`Membuat metadata dengan ${provider}/${model} (${keywordCount} keywords)...`);
    
    const prompt = `Analyze this image for a microstock website. Create SEO-friendly metadata. Respond ONLY with a valid JSON object with three keys: "title", "description", and "keywords".

- **title**: An SEO-optimized, commercial, and highly searchable headline. Length: 10-190 characters.
- **description**: A unique, descriptive sentence that tells a story about the image.
- **keywords**: A single string of exactly ${keywordCount} comma-separated, high-value keywords. Include literal, conceptual, and use-case keywords.${competitionInstruction}

The JSON output must be clean and valid.`;
    
    const payload = { prompt, fileData: { dataUrl: `data:image/jpeg;base64,${base64Data}` } };
    const response = await callSelectedApi(payload);
    if (!response.success) throw new Error(response.error);

    const cleanedResponse = response.keywords.replace(/```json|```/g, '').trim();
    let metadata;
    try {
        metadata = JSON.parse(cleanedResponse);
    } catch (e) {
        throw new Error("Respons dari AI bukan format JSON yang valid.");
    }
    
    // --- Logika Baru: Menambahkan Custom Metadata ---
    const customMetaRaw = (settings.customMetadata || '').trim();
    if (customMetaRaw) {
        const customMetaForText = customMetaRaw.endsWith(',') ? customMetaRaw.slice(0, -1).trim() : customMetaRaw;
        if (metadata.title) {
            // [UPDATED] Custom text is now appended to the title
            metadata.title = `${metadata.title} ${customMetaForText}`;
        }
        if (metadata.description) {
            metadata.description = `${customMetaForText}. ${metadata.description}`;
        }
        const customMetaForKeywords = customMetaRaw.endsWith(',') ? customMetaRaw : `${customMetaRaw},`;
        const aiKeywords = metadata.keywords || '';
        metadata.keywords = `${customMetaForKeywords}${aiKeywords}`;
    }
    // --- Akhir Logika Baru ---

    if (metadata.title) {
        metadata.title = cleanMetadataField(metadata.title, false);
    }
    if (metadata.description) {
        metadata.description = cleanMetadataField(metadata.description, false);
    }

    if (metadata.keywords && typeof metadata.keywords === 'string') {
        const cleanedKeywordsString = cleanMetadataField(metadata.keywords, true);
        let keywordArray = [...new Set(cleanedKeywordsString.split(',').map(kw => kw.trim()).filter(Boolean))];
        if (keywordArray.length > keywordCount) {
            keywordArray = keywordArray.slice(0, keywordCount);
        }
        metadata.keywords = keywordArray.join(',');
    }

    if (settings.isAiGenerated) {
        if (settings.targetWebsite === 'dreamstime') {
            // Deskripsi AI dihapus sesuai permintaan
            metadata.keywords = "AIgenerated," + (metadata.keywords || '');
        } else if (settings.targetWebsite === 'adobestock') {
            // Keyword "Generative AI" dihapus sesuai permintaan
        }
    }
    return metadata;
}

async function getImageAsBase64_Dreamstime() {
    const imageElement = document.getElementById('image-item');
    if (!imageElement) return null;
    const imageUrl = imageElement.dataset.src || imageElement.src;
    if (!imageUrl || imageUrl.includes('blank.gif')) return null;
    
    try {
        const response = await fetch(imageUrl, { cache: "no-store" });
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.toString().split(',')[1]);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("BYZL: Gagal mengambil gambar:", error);
        return null;
    }
}