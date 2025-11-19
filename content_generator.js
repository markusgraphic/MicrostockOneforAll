// File: content_generator.js
// Logika diambil dari content.js pada Tahap 2

// [PERBAIKAN] Guard untuk mencegah injeksi skrip dan duplikasi listener berulang kali.
// Ini adalah solusi utama untuk masalah unduhan ganda di semua platform.
if (typeof window.contentGeneratorInjected === 'undefined') {
    window.contentGeneratorInjected = true;

    /**
     * Creates a promise that resolves after a specified number of milliseconds.
     * @param {number} ms - The number of milliseconds to wait.
     * @returns {Promise<void>}
     */
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    /**
     * Finds a single element on the page using a CSS selector. 
     * Throws a detailed error if the element cannot be found.
     * @param {string} selector - The CSS selector for the element.
     * @param {string} friendlyName - A user-friendly name for the element, used in error messages.
     * @returns {HTMLElement} The found HTML element.
     */
    const findElement = (selector, friendlyName) => {
        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Could not find the ${friendlyName} using selector: '${selector}'. The website UI might have changed.`);
        }
        return element;
    };

    /**
     * Finds multiple elements on the page using a CSS selector.
     * @param {string} selector - The CSS selector for the elements.
     * @returns {NodeListOf<HTMLElement>} A NodeList of the found HTML elements.
     */
    const findElements = (selector) => {
        return document.querySelectorAll(selector);
    };

    /**
     * [SOLUSI BARU] Sets text in a Slate.js editor by simulating a paste event.
     * This is the most reliable method for complex rich text editors.
     * @param {HTMLElement} element - The Slate.js editor element.
     * @param {string} text - The text to paste into the editor.
     */
    const setPromptInSlateEditor = async (element, text) => {
        // 1. Fokus pada editor.
        element.focus();
        await sleep(100);

        // 2. Pilih semua teks yang ada untuk persiapan menghapus.
        document.execCommand('selectAll', false, null);
        await sleep(50);

        // 3. Buat objek DataTransfer untuk menampung data clipboard palsu kita.
        const dataTransfer = new DataTransfer();
        
        // 4. Masukkan prompt baru ke dalam DataTransfer.
        dataTransfer.setData('text/plain', text);

        // 5. Buat peristiwa ClipboardEvent 'paste' yang sintetis.
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });

        // 6. Kirimkan peristiwa paste ke editor. Slate akan menangkap ini dan memperbarui state-nya.
        element.dispatchEvent(pasteEvent);
        await sleep(200); // Beri waktu UI untuk bereaksi.
    };


    /**
     * [PERUBAHAN] Automation flow for Google AI Studio with direct image download.
     */
    const googleAIStudioFlow = async (prompt, waitTime) => {
        try {
            // Langkah 1 & 2: Isi prompt dan klik generate (tidak berubah)
            const promptTextarea = findElement('textarea[aria-label="Enter a prompt to generate an image"]', 'Prompt Text Area');
            promptTextarea.value = '';
            promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(100);
            promptTextarea.value = prompt;
            promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(200);

            const generateButton = findElement('button[aria-label="Run"]', 'Generate Button');
            generateButton.click();
            
            // Langkah 3: Tunggu proses generate (tidak berubah)
            await sleep(waitTime);

            // Langkah 4: Langsung temukan gambar yang dihasilkan
            const imageElement = findElement('ms-image-generation-gallery-image img', 'Generated Image');
            const imageUrl = imageElement.src;

            if (!imageUrl) {
                throw new Error("Gambar ditemukan, tetapi sumber (URL) gambar kosong.");
            }
            
            // Langkah 5: Ambil data gambar (blob) dan picu unduhan
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Buat URL objek sementara dari blob
            const objectUrl = URL.createObjectURL(blob);
            
            // Buat elemen <a> sementara untuk memicu unduhan
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = `aistudio_image_${Date.now()}.png`; // AI Studio umumnya menghasilkan format PNG
            document.body.appendChild(a);
            a.click();
            
            // Bersihkan dengan menghapus elemen dan URL objek
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
            
            return { status: "success" };
        } catch (error) {
            return { status: "error", message: `AI Studio Flow: ${error.message}` };
        }
    };


    /**
     * [DIPERBARUI] Automation flow for Whisk, with direct image downloading.
     */
    const whiskFlow = async (prompt, waitTime, downloadCount) => {
        try {
            // Langkah 1: Isi prompt dan klik tombol generate (tidak berubah)
            const promptTextarea = findElement('textarea[placeholder*="Jelaskan ide Anda"]', 'Whisk Prompt Textarea');
            promptTextarea.value = '';
            promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(100);
            promptTextarea.value = prompt;
            promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(200);

            let generateButton;
            generateButton = document.querySelector('button[aria-label*="Kirim" i]');

            if (!generateButton) {
                const allButtons = findElements('button');
                for (const btn of allButtons) {
                    if (btn.textContent.trim().toLowerCase() === 'kirim') {
                        generateButton = btn;
                        break;
                    }
                }
            }
            
            if (!generateButton) {
                throw new Error("Could not find the 'Kirim' (Generate) button using any method. The website UI has likely changed.");
            }
            
            generateButton.click();
            await sleep(waitTime);

            // Langkah 2: Temukan semua gambar hasil generate dan unduh secara langsung
            const imageElements = findElements('img[src^="blob:https://labs.google/"]');
            
            if (imageElements.length === 0) {
                throw new Error("No generated images found. The wait time might be too short or the UI has changed.");
            }

            const actualDownloadCount = Math.min(downloadCount, imageElements.length);
            if (actualDownloadCount < downloadCount) {
                console.warn(`Requested ${downloadCount} downloads, but only found ${actualDownloadCount} images.`);
            }

            for (let i = 0; i < actualDownloadCount; i++) {
                const imgElement = imageElements[i];
                const blobUrl = imgElement.src;
                
                try {
                    // Ambil data blob dari URL-nya
                    const response = await fetch(blobUrl);
                    const blob = await response.blob();
                    
                    // Buat URL objek sementara untuk diunduh
                    const objectUrl = URL.createObjectURL(blob);
                    
                    // Buat elemen <a> palsu untuk memicu unduhan
                    const a = document.createElement('a');
                    a.href = objectUrl;
                    a.download = `whisk_image_${Date.now()}_${i + 1}.png`; // Whisk biasanya menghasilkan PNG
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Hapus URL objek untuk membersihkan memori
                    URL.revokeObjectURL(objectUrl);
                    
                    await sleep(500); // Jeda singkat antar unduhan
                } catch (fetchError) {
                    console.error(`Failed to download image from ${blobUrl}:`, fetchError);
                }
            }
            
            return { status: "success" };
        } catch (error) {
            return { status: "error", message: `Whisk Flow: ${error.message}` };
        }
    };

    /**
     * [VERSI DIPERBARUI] Automation flow for ImageFX, using the reliable paste simulation method.
     */
    const imageFxFlow = async (prompt, waitTime, downloadCount) => {
        try {
            // Langkah 1: Temukan kotak prompt. Selector ini masih akurat.
            const promptBox = findElement('div[role="textbox"][contenteditable="true"]', 'ImageFX Prompt Box (Slate Editor)');

            // Langkah 2: Atur prompt menggunakan metode simulasi 'paste' yang andal.
            await setPromptInSlateEditor(promptBox, prompt);

            // Langkah 3: Temukan dan klik tombol Generate (ikon 'spark').
            let generateButton;
            const allIcons = findElements('i.google-symbols');
            for (const icon of allIcons) {
                if (icon.textContent.trim() === 'spark') {
                    const button = icon.closest('button');
                    if (button) {
                        generateButton = button;
                        break; 
                    }
                }
            }

            if (!generateButton) {
                throw new Error("Could not find 'Buat' (Generate) button by its 'spark' icon. The UI has likely undergone a significant change.");
            }
            
            generateButton.click();
            
            // Langkah 4: Tunggu proses pembuatan gambar.
            await sleep(waitTime);

            // Langkah 5: Temukan dan unduh gambar.
            const downloadButtons = [];
            const allDownloadIcons = findElements('i.google-symbols');
            for(const icon of allDownloadIcons) {
                if(icon.textContent.trim() === 'download') {
                    const button = icon.closest('button');
                    if(button) {
                        downloadButtons.push(button);
                    }
                }
            }

            if (downloadButtons.length < downloadCount) {
                 throw new Error(`Expected ${downloadCount} download buttons but only found ${downloadButtons.length}. Generation may have failed or taken too long.`);
            }

            for (let i = 0; i < downloadCount; i++) {
                if (downloadButtons[i]) {
                    downloadButtons[i].click();
                    await sleep(200); // Jeda singkat antar unduhan.
                }
            }
            
            return { status: "success" };
        } catch (error) {
            console.error("An error occurred in the ImageFX Flow:", error);
            return { status: "error", message: `ImageFX Flow: ${error.message}` };
        }
    };


    /**
     * Automation flow for Stable Diffusion Web.
     */
    const stableDiffusionFlow = async (prompt, waitTime) => {
        try {
            const promptTextarea = findElement('textarea#prompts', 'Stable Diffusion Prompt Textarea');
            promptTextarea.value = '';
            promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(100);
            promptTextarea.value = prompt;
            promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(200);

            let generateButton;
            const allButtons = findElements('button');
            for (const btn of allButtons) {
                if (btn.textContent.trim().toLowerCase() === 'generate') {
                    generateButton = btn;
                    break;
                }
            }
            if (!generateButton) throw new Error("Could not find the 'Generate' button.");
            if (generateButton.disabled) throw new Error("The 'Generate' button is disabled.");
            generateButton.click();
            
            await sleep(waitTime);

            const imageContainer = findElement('div[class*="cursor-pointer"]', 'Generated Image Container');
            imageContainer.click();
            await sleep(1000);

            let downloadButton = null;
            const downloadSelectors = [
                'button[aria-label*="Download" i]',
                'button[title*="Download" i]',
                'button:has(svg.lucide-download)',
            ];
            for (const selector of downloadSelectors) {
                downloadButton = document.querySelector(selector);
                if (downloadButton) break;
            }
            if (!downloadButton) {
                const icon = document.querySelector('svg.lucide-download');
                if (icon) downloadButton = icon.closest('button');
            }
            if (!downloadButton) throw new Error("Could not find the download button inside the modal. The UI may have changed.");
            
            downloadButton.click();
            await sleep(1000);
            
            return { status: "success" };
        } catch (error) {
            return { status: "error", message: `Stable Diffusion Flow: ${error.message}` };
        }
    };

    /**
     * [SOLUSI ROBUST] Automation flow for Dreamina AI with duplicate prevention.
     */
    const dreaminaFlow = async (prompt, waitTime, downloadCount) => {
        try {
            // Flow 2: Isi prompt
            const promptTextarea = findElement('textarea.lv-textarea[placeholder*="Jelaskan gambar"]', 'Dreamina Prompt Textarea');
            promptTextarea.value = '';
            promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(100);
            promptTextarea.value = prompt;
            promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(200);

            // Flow 3: Klik generate
            const generateButton = findElement('button[class*="submit-button"]', 'Dreamina Generate Button');
            if (generateButton.disabled) {
                throw new Error("Tombol 'Generate' dinonaktifkan.");
            }
            generateButton.click();

            // Flow 4: Tunggu generate selesai
            await sleep(waitTime);
            
            // Gunakan Set untuk menyimpan URL yang sudah diunduh agar tidak ada duplikasi.
            const downloadedUrls = new Set();
            
            // Gunakan selector yang lebih spesifik dan stabil.
            const imageElements = findElements('img[data-apm-action="ai-generated-image-record-card"]');
            
            if (imageElements.length === 0) {
                throw new Error("Tidak ada gambar hasil generate yang ditemukan. Waktu tunggu mungkin kurang atau UI telah berubah.");
            }

            let downloadedSoFar = 0;
            for (const img of imageElements) {
                // Hentikan jika sudah mencapai jumlah yang diinginkan
                if (downloadedSoFar >= downloadCount) {
                    break;
                }
                
                const imageUrl = img.src;

                // Periksa apakah URL valid dan BELUM PERNAH diunduh.
                if (imageUrl && !downloadedUrls.has(imageUrl)) {
                    // Tandai URL ini sebagai "akan diunduh" untuk mencegah duplikasi
                    downloadedUrls.add(imageUrl);

                    const filename = `dreamina_image_${Date.now()}_${downloadedSoFar + 1}.webp`;
                    
                    try {
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        URL.revokeObjectURL(blobUrl);
                        downloadedSoFar++;
                        
                        await sleep(800); // Jeda stabil antar unduhan
                    } catch (fetchError) {
                        console.error(`Gagal mengunduh gambar dari ${imageUrl}:`, fetchError);
                        // Hapus URL dari set jika gagal agar bisa dicoba lagi jika muncul di tempat lain
                        downloadedUrls.delete(imageUrl);
                    }
                }
            }
            
            if (downloadedSoFar < downloadCount) {
                 console.warn(`Peringatan: Diminta ${downloadCount} unduhan, tetapi hanya ${downloadedSoFar} gambar unik yang dapat diunduh.`);
            }

            return { status: "success" };
        } catch (error) {
            return { status: "error", message: `Dreamina Flow: ${error.message}` };
        }
    };

    /**
     * [DIPERBARUI] Automation flow for Leonardo AI.
     */
    const leonardoFlow = async (prompt, waitTime, downloadCount) => {
        try {
            // Flow 2: Isi prompt.
            const promptTextarea = findElement('textarea#prompt-textarea', 'Leonardo Prompt Textarea');
            promptTextarea.value = prompt;
            promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(200);

            // Flow 3: Klik tombol generate.
            const generateButton = findElement('button[data-tracking-id="web_client_image_generation_generate_button_click"]', 'Leonardo Generate Button');
            if (generateButton.disabled) {
                 throw new Error("Tombol 'Generate' dinonaktifkan. Mungkin token Anda habis atau ada proses lain.");
            }
            generateButton.click();

            // Flow 4: Tunggu proses generate.
            await sleep(waitTime);
            
            // Flow 5: Unduh gambar dengan pencegahan duplikasi.
            const downloadedUrls = new Set();
            
            // =================================================================
            // === PERBAIKAN UTAMA: Logika pencarian gambar yang lebih cerdas ===
            // =================================================================
            
            // Langsung cari semua gambar hasil generate di seluruh dokumen.
            // Hasil terbaru biasanya berada di paling atas (indeks awal).
            const imageElements = findElements('img[data-nimg="1"][src*="cdn.leonardo.ai"]');

            if (imageElements.length === 0) {
                throw new Error("Tidak ada gambar yang ditemukan setelah generate. Waktu tunggu mungkin kurang atau UI telah berubah.");
            }

            let downloadedSoFar = 0;
            for (const img of imageElements) {
                if (downloadedSoFar >= downloadCount) break;
                
                const originalUrl = img.src;
                if (!originalUrl) continue;

                // Membersihkan URL dari parameter '?w=...' untuk mendapatkan resolusi penuh
                const url = new URL(originalUrl);
                url.search = ''; // Ini akan menghapus semua parameter query
                const cleanImageUrl = url.href;
                
                if (!downloadedUrls.has(cleanImageUrl)) {
                    downloadedUrls.add(cleanImageUrl);
                    const filename = `leonardo_image_${Date.now()}_${downloadedSoFar + 1}.jpg`;
                    
                    try {
                        const response = await fetch(cleanImageUrl);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        URL.revokeObjectURL(blobUrl);
                        downloadedSoFar++;
                        
                        await sleep(800); // Jeda antar unduhan
                    } catch (fetchError) {
                        console.error(`Gagal mengunduh gambar dari ${cleanImageUrl}:`, fetchError);
                        downloadedUrls.delete(cleanImageUrl);
                    }
                }
            }

             if (downloadedSoFar < downloadCount) {
                 console.warn(`Peringatan: Diminta ${downloadCount} unduhan, tetapi hanya ${downloadedSoFar} gambar unik yang dapat diunduh.`);
            }

            return { status: "success" };
        } catch (error) {
            return { status: "error", message: `Leonardo Flow: ${error.message}` };
        }
    };


    /**
     * Listens for messages from the extension's popup script and routes to the correct flow.
     */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        let promise;
        switch (request.action) {
            case "executeGoogleAIStudioFlow":
                promise = googleAIStudioFlow(request.prompt, request.waitTime);
                break;
            case "executeWhiskFlow":
                promise = whiskFlow(request.prompt, request.waitTime, request.downloadCount);
                break;
            case "executeImageFxFlow":
                promise = imageFxFlow(request.prompt, request.waitTime, request.downloadCount);
                break;
            case "executeStableDiffusionFlow":
                promise = stableDiffusionFlow(request.prompt, request.waitTime);
                break;
            case "executeDreaminaFlow":
                promise = dreaminaFlow(request.prompt, request.waitTime, request.downloadCount);
                break;
            case "executeLeonardoFlow":
                promise = leonardoFlow(request.prompt, request.waitTime, request.downloadCount);
                break;
            default:
                return false;
        }

        promise.then(sendResponse).catch(error => {
            console.error("Error during flow execution:", error);
            sendResponse({ status: 'error', message: error.toString() });
        });
        
        return true; 
    });
}