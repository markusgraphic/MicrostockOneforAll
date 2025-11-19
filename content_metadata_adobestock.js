// adobestock_content_script.js

if (typeof window.adobeByzlListenerAttached === 'undefined') {
    window.adobeByzlListenerAttached = true;
    console.log("BYZL Autometadata: Adobe Stock content script (Hybrid Interface) loaded.");

    window.byzlAdobeProcessedIndices = window.byzlAdobeProcessedIndices || [];

    const logToPanel = (message) => {
        chrome.runtime.sendMessage({ action: "log", message: `[Adobe] ${message}` }).catch(e => {});
    };

    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    
    // === FUNGSI BARU: Untuk menemukan dan mengklik tombol "Save work" ===
    async function saveWorkIfPresent() {
        const saveButton = document.querySelector('button.button.button--action.center-align[data-t="save-work"]');
        if (saveButton) {
            logToPanel("Tombol 'Save work' ditemukan, mencoba menyimpan...");
            saveButton.click();
            await delay(1500); // Beri waktu beberapa saat untuk proses penyimpanan
            logToPanel("-> Perintah simpan telah dikirim.");
            return { status: "SAVED" };
        } else {
            logToPanel("Tombol 'Save work' tidak ditemukan, dilewati.");
            return { status: "NOT_FOUND" };
        }
    }
    // ====================================================================

    /**
     * FUNGSI KUNCI: Memasang listener untuk memantau perubahan gambar aktif.
     */
    function setupPreviewListener() {
        logToPanel("Memasang listener pratinjau gambar.");
        document.body.addEventListener('click', (event) => {
            const imageContainer = event.target.closest('.content-grid-elements');
            if (imageContainer) {
                const thumbnail = imageContainer.querySelector('img.upload-tile__thumbnail');
                if (thumbnail && thumbnail.src) {
                    setTimeout(() => {
                       chrome.runtime.sendMessage({
                            action: "imagePreviewChanged",
                            imageUrl: thumbnail.src
                        });
                    }, 100); 
                }
            }
        });
    }

    async function waitForElement(selector, timeout = 10000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) return elements;
            await delay(500);
        }
        throw new Error(`Elemen '${selector}' tidak ditemukan setelah menunggu ${timeout / 1000} detik.`);
    }

    async function imageToB64(src) {
        try {
            const response = await fetch(src, { cache: "no-store" });
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) resolve(reader.result.toString().split(',')[1]);
                    else reject(new Error("Hasil FileReader kosong."));
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("BYZL: Gagal mengonversi gambar ke Base64:", error);
            return null;
        }
    }
    
    async function findNextImageToProcess() {
        logToPanel("Mencari gambar yang belum diproses...");
        const images = await waitForElement('div.content-grid-elements');
        logToPanel(`Menemukan ${images.length} gambar di halaman.`);
        for (let i = 0; i < images.length; i++) {
            if (window.byzlAdobeProcessedIndices.includes(i)) continue;
            const imageCell = images[i];
            const needsAttention = imageCell.querySelector('i.icon-radio-active.red');
            if (!needsAttention) {
                logToPanel(`-> Gambar #${i + 1} tidak memerlukan metadata, dilewati.`);
                window.byzlAdobeProcessedIndices.push(i);
                continue;
            }
            logToPanel(`Gambar #${i + 1} dipilih untuk diproses.`);
            const clickableElement = imageCell.querySelector('.upload-tile__wrapper');
            if (clickableElement) clickableElement.click();
            else throw new Error(`Elemen yang dapat diklik tidak ditemukan untuk gambar #${i+1}.`);
            await delay(500);
            const thumbnail = imageCell.querySelector('img.upload-tile__thumbnail');
            if (!thumbnail) throw new Error(`Thumbnail tidak ditemukan untuk gambar #${i + 1}`);
            const base64 = await imageToB64(thumbnail.src);
            if (base64) return { status: 'FOUND', base64Data: base64, index: i };
            else throw new Error(`Gagal mengonversi gambar #${i + 1} ke Base64.`);
        }
        const allLinks = document.querySelectorAll('a');
        let nextPageButton = null;
        for (const link of allLinks) {
            if (link.textContent.trim() === 'Next') {
                nextPageButton = link;
                break;
            }
        }
        if (nextPageButton) {
            // === PERUBAHAN DI SINI: Menyimpan pekerjaan sebelum pindah halaman ===
            await saveWorkIfPresent();
            // ===================================================================
            logToPanel("Menekan tombol 'Next' untuk ke halaman berikutnya...");
            window.byzlAdobeProcessedIndices = [];
            nextPageButton.click();
            return { status: 'PAGINATING' };
        }
        return { status: 'DONE' };
    }

    async function fillAdobeForm(metadata, isAiGenerated, index) {
        logToPanel(`Memulai pengisian untuk gambar #${index + 1}`);
        const images = await waitForElement('div.content-grid-elements');
        if (index >= images.length) throw new Error("Indeks gambar di luar jangkauan.");
        const clickableElement = images[index].querySelector('.upload-tile__wrapper');
        if (clickableElement && !clickableElement.classList.contains('active')) {
             clickableElement.click();
             await delay(500);
        }
        const titleTextarea = await waitForElement('textarea[data-t="asset-title-content-tagger"]');
        titleTextarea[0].value = metadata.title;
        titleTextarea[0].dispatchEvent(new Event('input', { bubbles: true }));
        logToPanel("-> Judul diisi.");
        const keywordTextarea = await waitForElement('#content-keywords-ui-textarea');
        keywordTextarea[0].value = metadata.keywords;
        keywordTextarea[0].dispatchEvent(new Event('input', { bubbles: true }));
        await delay(100);
        keywordTextarea[0].dispatchEvent(new Event('blur', { bubbles: true }));
        logToPanel("-> Keyword diisi.");
        await delay(300);
        if (isAiGenerated) {
            logToPanel("-> Opsi AI-Generated aktif. Mencari checkbox...");
            const aiCheckbox = document.getElementById('content-tagger-generative-ai-checkbox');
            if (aiCheckbox && !aiCheckbox.checked) aiCheckbox.click();
            await delay(300);
            const releaseCheckbox = document.getElementById('content-tagger-generative-ai-property-release-checkbox');
            if (releaseCheckbox && !releaseCheckbox.checked) releaseCheckbox.click();
        }
        window.byzlAdobeProcessedIndices.push(index);
        logToPanel(`Pengisian untuk gambar #${index + 1} selesai.`);
        return { status: "SUCCESS", message: `Gambar #${index + 1} berhasil diproses.` };
    }

    // Panggil fungsi untuk mengaktifkan listener pratinjau
    setupPreviewListener();

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getNextImage") {
            findNextImageToProcess()
                .then(response => sendResponse(response))
                .catch(error => sendResponse({ status: "ERROR", message: error.message }));
            return true;
        }
        if (request.action === "fillAdobeForm") {
            const { metadata, isAiGenerated, index } = request;
            fillAdobeForm(metadata, isAiGenerated, index)
                .then(response => sendResponse(response))
                .catch(error => sendResponse({ status: "ERROR", message: error.message }));
            return true;
        }
        // === LISTENER BARU: Untuk menangani perintah simpan dari background script ===
        if (request.action === "saveAdobeWork") {
            saveWorkIfPresent()
                .then(response => sendResponse(response))
                .catch(error => sendResponse({ status: "ERROR", message: error.message }));
            return true;
        }
        // =========================================================================
    });
}