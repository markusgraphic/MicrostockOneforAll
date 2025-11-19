// content_metadata_dreamstime.js

// Guard to prevent the script from being injected and listeners attached multiple times on the same page.
if (typeof window.byzlDreamstimeListenerAttached === 'undefined') {
    window.byzlDreamstimeListenerAttached = true;
    console.log("BYZL Autometadata: Dreamstime content script loaded (v2.8 - Race Condition Fix).");

    /**
     * Sends a log message to the side panel for user feedback.
     * @param {string} message The message to log.
     */
    function logToPanel(message) {
        // Check if the extension context is valid before sending a message.
        if (chrome.runtime?.id) {
            chrome.runtime.sendMessage({ action: "log", message: `[Dreamstime] ${message}` }).catch(e => {});
        }
    }

    /**
     * Creates a promise that resolves after a specified delay.
     * @param {number} ms - The delay in milliseconds.
     * @returns {Promise<void>}
     */
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // ========================================================================
    // IMAGE PREVIEW UPDATE FUNCTIONS (MANUAL & AUTOMATIC)
    // ========================================================================

    /**
     * Finds the main image preview on the page and sends its URL to the side panel.
     * This keeps the UI in sync with the currently selected image.
     * @returns {boolean} - True if the image was found and a message was sent, otherwise false.
     */
    const updatePreview = () => {
        const mainImage = document.getElementById('image-item');
        // Ensure the image element exists and its source is a valid image, not a placeholder.
        if (mainImage && mainImage.src && !mainImage.src.includes('blank.gif')) {
            chrome.runtime.sendMessage({
                action: "imagePreviewChanged",
                imageUrl: mainImage.src
            });
            return true;
        }
        return false;
    };

    // Attach a click listener to the body to detect when the user selects a new thumbnail.
    document.body.addEventListener('click', (event) => {
        // The '.js-filebox' class is on the container for each thumbnail.
        if (event.target.closest('div.js-filebox')) {
            // Wait a short moment for the main image element's 'src' to be updated.
            setTimeout(updatePreview, 250);
        }
    });

    // Also, trigger a preview update when the script is first injected, in case an image is already selected.
    setTimeout(updatePreview, 500);

    // ========================================================================
    // MAIN MESSAGE LISTENER
    // ========================================================================

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        /**
         * ACTION: fillAndSubmitForm
         * Fills the metadata form with data from the background script and submits it.
         */
        if (request.action === "fillAndSubmitForm") {
            const { metadata } = request;
            (async () => {
                try {
                    logToPanel("Memeriksa dan mengisi metadata...");
                    
                    // 1. Fill Title
                    const titleInput = document.getElementById('title');
                    if (titleInput) {
                        titleInput.value = metadata.title;
                        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
                        logToPanel("-> Judul diisi (nilai sebelumnya ditimpa).");
                    } else { 
                        throw new Error("Elemen 'title' tidak ditemukan."); 
                    }
                    
                    // 2. Fill Description
                    const descriptionTextarea = document.getElementById('description');
                    if (descriptionTextarea) {
                        descriptionTextarea.value = metadata.description;
                        descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                        logToPanel("-> Deskripsi diisi (nilai sebelumnya ditimpa).");
                    } else { 
                        throw new Error("Elemen 'description' tidak ditemukan."); 
                    }

                    // 3. Clear existing keywords and fill new ones
                    const keywordsInput = document.getElementById('keywords_tag');
                    if (keywordsInput) {
                        // 3a. Clear any keywords that might already be present.
                        const existingKeywordChips = document.querySelectorAll('.form-keywords__list .item-tag .icon-close-thin');
                        if (existingKeywordChips.length > 0) {
                            logToPanel(`-> Menemukan ${existingKeywordChips.length} keyword lama, membersihkan...`);
                            for (const chipCloseButton of existingKeywordChips) {
                                chipCloseButton.click();
                                await delay(50); // Short delay for the UI to respond.
                            }
                            logToPanel("-> Keyword lama berhasil dibersihkan.");
                        }

                        // 3b. Input the new keywords.
                        logToPanel("-> Memulai pengisian keyword baru...");
                        keywordsInput.value = metadata.keywords;
                        keywordsInput.dispatchEvent(new Event('input', { bubbles: true }));
                        await delay(400); // Wait for Dreamstime's script to process the input.
                        // Simulate pressing 'Enter' to convert the string into keyword chips.
                        keywordsInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
                        await delay(200);
                        keywordsInput.dispatchEvent(new Event('blur', { bubbles: true }));
                        logToPanel("-> Event untuk memproses keyword baru telah dikirim.");
                    } else { 
                        throw new Error("Elemen input keyword ('keywords_tag') tidak ditemukan."); 
                    }

                    // 4. Select a category if none is selected
                    if (!document.querySelector('.categories-list-wrapper .item-wrapper.selected')) {
                        const firstCategory = document.querySelector('.categories-list-wrapper .item-wrapper');
                        if (firstCategory) {
                            firstCategory.click();
                            logToPanel("Kategori pertama dipilih secara otomatis.");
                        }
                    } else { 
                        logToPanel("Kategori sudah dipilih, dilewati."); 
                    }
                    
                    await delay(500);

                    // 5. Prepare for submission
                    logToPanel("Memulai alur Simpan dan Lanjut...");
                    const saveCheckbox = document.querySelector('#js-savededits > i');
                    if (saveCheckbox) {
                        saveCheckbox.click();
                        logToPanel("Opsi 'Simpan perubahan' dicentang.");
                    }
                    
                    await delay(2000); // Wait for any processes triggered by the checkbox.

                    // 6. Submit the form
                    const nextButton = document.getElementById('js-next-submit');
                    if (!nextButton) throw new Error("Tombol Next (#js-next-submit) tidak ditemukan.");
                    
                    nextButton.click();
                    logToPanel("Melanjutkan ke gambar berikutnya...");

                    // [CRITICAL FIX] Send the response immediately after clicking 'Next'.
                    // Waiting any longer will cause a race condition with the 'onUpdated' event
                    // in the background script, which would trigger a double submission.
                    sendResponse({ status: "SUCCESS", message: "Disimpan dan dilanjutkan." });

                } catch (error) {
                    const errorMessage = `ERROR di content script: ${error.message}`;
                    logToPanel(errorMessage);
                    sendResponse({ status: "ERROR", message: errorMessage });
                }
            })(); 
            return true; // Indicate that the response will be sent asynchronously.
        }

        /**
         * ACTION: getLatestImagePreview
         * Responds to a manual refresh request from the side panel.
         */
        if (request.action === "getLatestImagePreview") {
            logToPanel("Menerima permintaan pratinjau dari panel.");
            const success = updatePreview();
            if (success) {
                sendResponse({ status: "SUCCESS", message: "Pratinjau dikirim." });
            } else {
                sendResponse({ status: "ERROR", message: "Gambar utama tidak dapat ditemukan." });
            }
            return true; // Asynchronous response.
        }
    });
}




