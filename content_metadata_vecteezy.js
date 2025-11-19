// vecteezy_content_script.js

if (typeof window.byzlVecteezyListenerAttached === 'undefined') {
    window.byzlVecteezyListenerAttached = true;
    // Perubahan: Versi diperbarui untuk mencerminkan optimisasi
    console.log("BYZL Autometadata: Vecteezy content script loaded (v2.7 - Optimized Delays & Dropdown Closure).");

    window.byzlVecteezyProcessedIndices = window.byzlVecteezyProcessedIndices || [];

    const logToPanel = (message) => {
        chrome.runtime.sendMessage({ action: "log", message: `[Vecteezy] ${message}` }).catch(e => {});
    };

    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    const dispatchInput = (element, value) => {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
    };
    
    async function simulateRealClick(element) {
        logToPanel("Mensimulasikan klik pengguna secara manual...");
        const dispatchMouseEvent = (eventName) => {
            element.dispatchEvent(new MouseEvent(eventName, {
                view: window,
                bubbles: true,
                cancelable: true
            }));
        };

        dispatchMouseEvent('mousedown');
        await delay(50);
        dispatchMouseEvent('mouseup');
        dispatchMouseEvent('click');
        logToPanel("-> Rangkaian event klik telah dikirim.");
    }

    function setupPreviewListener() {
        logToPanel("Attaching image preview listener.");
        document.body.addEventListener('click', (event) => {
            const imageCard = event.target.closest('div[data-testid="resource-card"]');
            if (imageCard) {
                setTimeout(() => {
                   const thumbnail = imageCard.querySelector('img');
                   if (thumbnail && thumbnail.src) {
                       chrome.runtime.sendMessage({
                            action: "imagePreviewChanged",
                            imageUrl: thumbnail.src
                        });
                   }
                }, 200); 
            }
        });
    }

    async function waitForElement(selector, timeout = 10000, root = document) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const element = root.querySelector(selector);
            if (element) return element;
            await delay(250);
        }
        throw new Error(`Element '${selector}' not found after ${timeout / 1000} seconds.`);
    }

    async function waitForElements(selector, timeout = 10000, root = document) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const elements = root.querySelectorAll(selector);
            if (elements.length > 0) return elements;
            await delay(500);
        }
        throw new Error(`Elements '${selector}' not found after ${timeout / 1000} seconds.`);
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
                    else reject(new Error("FileReader result was empty."));
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("BYZL: Failed to convert image to Base64:", error);
            return null;
        }
    }

    async function findNextImageToProcess() {
        logToPanel("Mencari gambar yang belum diproses...");
        const imageCards = await waitForElements('div[data-testid="resource-card"]');
        logToPanel(`Menemukan ${imageCards.length} gambar di halaman.`);

        for (let i = 0; i < imageCards.length; i++) {
            if (window.byzlVecteezyProcessedIndices.includes(i)) continue;
            const imageCard = imageCards[i];
            const successIcon = imageCard.querySelector('svg[data-testid="success-outline-icon"]');
            if (successIcon) {
                logToPanel(`-> Gambar #${i + 1} sudah selesai, dilewati.`);
                window.byzlVecteezyProcessedIndices.push(i);
                continue;
            }

            logToPanel(`Gambar #${i + 1} dipilih untuk diproses.`);
            imageCard.click();
            await delay(500);

            const thumbnail = imageCard.querySelector('img');
            if (!thumbnail) throw new Error(`Thumbnail tidak ditemukan untuk gambar #${i + 1}`);
            const base64 = await imageToB64(thumbnail.src);
            if (base64) {
                chrome.runtime.sendMessage({ action: "imagePreviewChanged", imageUrl: thumbnail.src });
                return { status: 'FOUND', base64Data: base64, index: i };
            } else {
                throw new Error(`Gagal mengonversi gambar #${i + 1} ke Base64.`);
            }
        }
        
        const nextPageButton = document.querySelector('button[aria-label="Next Page"]');
        if (nextPageButton && !nextPageButton.disabled) {
            logToPanel("Menekan tombol 'Next Page'...");
            window.byzlVecteezyProcessedIndices = [];
            nextPageButton.click();
            return { status: 'PAGINATING' };
        }
        return { status: 'DONE' };
    }

    async function fillVecteezyForm(metadata, isAiGenerated, vecteezySettings, index) {
        logToPanel(`Memulai pengisian formulir untuk gambar #${index + 1}`);
        const { license, aiSoftware, otherAiSoftware } = vecteezySettings;
        
        const softwareNameToTextMap = {
            'midjourney': 'Midjourney',
            'stable-diffusion': 'Stable Diffusion',
            'dall-e': 'DALL•E',
            'other': 'Other'
        };

        const imageCards = await waitForElements('div[data-testid="resource-card"]');
        if (index >= imageCards.length) throw new Error("Indeks gambar di luar jangkauan.");
        if (!imageCards[index].classList.contains('is-selected')) {
            imageCards[index].click();
            await delay(500);
        }

        const licenseRadio = await waitForElement(`input[type="radio"][value="${license}"]`);
        if (licenseRadio && !licenseRadio.checked) {
            licenseRadio.click();
            logToPanel(`-> Lisensi diatur ke '${license}'.`);
        }

        if (isAiGenerated) {
            const aiCheckbox = await waitForElement('input[type="checkbox"][value="ai_generated"]');

            try {
                const triggersBefore = document.querySelectorAll('div[role="button"][aria-haspopup="listbox"]');
                logToPanel(`-> Ditemukan ${triggersBefore.length} dropdown sebelum centang AI.`);

                if (!aiCheckbox.checked) {
                    aiCheckbox.click();
                    logToPanel("-> Kotak 'AI Generated' dicentang.");
                    // Perubahan: Mengurangi waktu tunggu
                    await delay(1200); 
                }

                const triggersAfter = await waitForElements('div[role="button"][aria-haspopup="listbox"]');
                logToPanel(`-> Ditemukan ${triggersAfter.length} dropdown setelah centang AI.`);

                let aiDropdownTrigger = null;
                const triggersBeforeArray = Array.from(triggersBefore);
                for (const trigger of triggersAfter) {
                    if (!triggersBeforeArray.includes(trigger)) {
                        aiDropdownTrigger = trigger;
                        break;
                    }
                }

                if (!aiDropdownTrigger) {
                    if (triggersAfter.length > triggersBefore.length && triggersAfter.length > 0) {
                        logToPanel("Peringatan: Gagal menemukan dropdown baru. Menggunakan dropdown terakhir.");
                        aiDropdownTrigger = triggersAfter[triggersAfter.length - 1];
                    } else if (triggersAfter.length > 0 && aiCheckbox.checked) {
                         logToPanel("Info: Dropdown AI sepertinya sudah ada. Menggunakan dropdown terakhir.");
                         aiDropdownTrigger = triggersAfter[triggersAfter.length - 1];
                    } else {
                        throw new Error("Dropdown AI tidak muncul setelah checkbox dicentang.");
                    }
                }
                
                logToPanel("-> Pemicu dropdown AI ditemukan.");
                await simulateRealClick(aiDropdownTrigger);
                await delay(500);

                const dropdownList = await waitForElement("ul[role='listbox']", 5000, document.body);
                const options = dropdownList.querySelectorAll('li[role="option"]');
                let foundOption = null;
                const softwareTextToSelect = softwareNameToTextMap[aiSoftware];

                for (const option of options) {
                    if (option.textContent.trim() === softwareTextToSelect) {
                        foundOption = option;
                        break;
                    }
                }

                if (foundOption) {
                    logToPanel(`-> Opsi "${softwareTextToSelect}" ditemukan, mengklik...`);
                    foundOption.click();
                    await delay(200);

                    // === PERUBAHAN BARU: Menutup dropdown setelah memilih ===
                    logToPanel("-> Menutup dropdown dengan 'Escape'.");
                    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
                    await delay(100); // Jeda singkat agar UI merespons penutupan
                    // =======================================================

                } else {
                    const availableOptions = Array.from(options).map(opt => `'${opt.textContent.trim()}'`).join(', ');
                    throw new Error(`Opsi '${softwareTextToSelect}' tidak ditemukan. Opsi yang ada: [${availableOptions}]`);
                }

            } catch (error) {
                logToPanel(`FATAL: Gagal memproses bagian AI. ${error.message}`);
                throw error;
            }
            
            if (aiSoftware === 'other' && otherAiSoftware) {
                logToPanel("-> Mengisi nama software 'Other'...");
                const otherInput = await waitForElement('div[data-testid="other-text-input"] input');
                dispatchInput(otherInput, otherAiSoftware);
                logToPanel(`-> Nama software diisi: '${otherAiSoftware}'.`);
            }
        }
        
        // === PERUBAHAN DI SINI: Selalu bersihkan dan isi judul, jangan dilewati ===
        const titleInput = await waitForElement('#title-input');
        dispatchInput(titleInput, metadata.title);
        logToPanel("-> Judul diisi (nilai sebelumnya ditimpa jika ada).");
        // ========================================================================
        
        const keywordContainer = await waitForElement('[data-testid="tagger-input"]');
        
        // === PERUBAHAN DI SINI: Hapus keyword lama sebelum menambahkan yang baru ===
        const existingKeywordChips = keywordContainer.querySelectorAll('.MuiChip-root');
        if (existingKeywordChips.length > 0) {
            logToPanel(`-> Menemukan ${existingKeywordChips.length} keyword lama, membersihkan...`);
            for (const chip of existingKeywordChips) {
                const deleteIcon = chip.querySelector('svg[data-testid="CancelIcon"]');
                if (deleteIcon) {
                    const clickableDelete = deleteIcon.closest('button') || deleteIcon;
                    clickableDelete.click();
                    await delay(60); // Jeda singkat agar UI merespons
                }
            }
            logToPanel("-> Keyword lama berhasil dibersihkan.");
        }
        
        const keywordInput = keywordContainer.querySelector('input');
        if (metadata.keywords && typeof metadata.keywords === 'string') {
            const keywordArray = metadata.keywords.split(',');
            logToPanel(`-> Memasukkan ${keywordArray.length} keyword baru...`);
            for (const keyword of keywordArray) {
                const trimmedKeyword = keyword.trim();
                if (trimmedKeyword) {
                    dispatchInput(keywordInput, trimmedKeyword);
                    // Perubahan: Waktu tunggu dipercepat secara signifikan
                    await delay(50); 
                    keywordInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
                    await delay(50);
                }
            }
            logToPanel("-> Pengisian keyword baru selesai.");
        }
        // ========================================================================
        
        // Perubahan: Waktu tunggu dikurangi
        await delay(100); 
        const saveButton = await waitForElement('div[data-testid="save-changes-icon"]');
        saveButton.click();
        logToPanel("-> Tombol 'Save' diklik.");
        // Perubahan: Waktu tunggu dikurangi
        await delay(800); 

        window.byzlVecteezyProcessedIndices.push(index);
        logToPanel(`Pengisian formulir untuk gambar #${index + 1} selesai.`);
        return { status: "SUCCESS", message: `Gambar #${index + 1} berhasil diproses.` };
    }

    // Pasang listeners
    setupPreviewListener();

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const action = request.action;
        if (action === "getNextImage") {
            findNextImageToProcess()
                .then(sendResponse)
                .catch(error => {
                    logToPanel(`ERROR: ${error.message}`);
                    sendResponse({ status: "ERROR", message: error.message });
                });
            return true;
        }
        if (action === "fillVecteezyForm") {
            const { metadata, isAiGenerated, vecteezySettings, index } = request;
            fillVecteezyForm(metadata, isAiGenerated, vecteezySettings, index)
                .then(sendResponse)
                .catch(error => {
                    logToPanel(`ERROR: ${error.message}`);
                    sendResponse({ status: "ERROR", message: error.message });
                });
            return true;
        }
    });
}