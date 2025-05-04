 // File upload area elements
 const fileUploadArea = document.getElementById('fileUploadArea');
 const uploadPrompt = document.getElementById('uploadPrompt');
 const fileInfo = document.getElementById('fileInfo');
 const fileName = document.getElementById('fileName');
 const fileSize = document.getElementById('fileSize');
 const fileInput = document.getElementById('audioFile');

 // Drag and drop functionality
 ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
     fileUploadArea.addEventListener(eventName, preventDefaults, false);
 });

 function preventDefaults(e) {
     e.preventDefault();
     e.stopPropagation();
 }

 ['dragenter', 'dragover'].forEach(eventName => {
     fileUploadArea.addEventListener(eventName, highlight, false);
 });

 ['dragleave', 'drop'].forEach(eventName => {
     fileUploadArea.addEventListener(eventName, unhighlight, false);
 });

 function highlight() {
     fileUploadArea.classList.add('drag-over');
 }

 function unhighlight() {
     fileUploadArea.classList.remove('drag-over');
 }

 fileUploadArea.addEventListener('drop', handleDrop, false);
 fileUploadArea.addEventListener('click', () => fileInput.click());

 function handleDrop(e) {
     const dt = e.dataTransfer;
     const files = dt.files;
     if (files.length) {
         handleFiles(files);
     }
 }

 fileInput.addEventListener('change', function() {
     if (this.files.length) {
         handleFiles(this.files);
     }
 });

 function handleFiles(files) {
     const file = files[0];
     if (!file.type.match('audio.*')) {
         showError('Please upload an audio file (MP3, WAV, or M4A)');
         return;
     }
     
     // Update UI to show selected file
     uploadPrompt.classList.add('hidden');
     fileInfo.classList.remove('hidden');
     fileName.textContent = file.name;
     fileSize.textContent = formatFileSize(file.size);
     
     // Set the file for the form
     const dataTransfer = new DataTransfer();
     dataTransfer.items.add(file);
     fileInput.files = dataTransfer.files;
 }

 function formatFileSize(bytes) {
     if (bytes === 0) return '0 Bytes';
     const k = 1024;
     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
     const i = Math.floor(Math.log(bytes) / Math.log(k));
     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
 }

 document.getElementById("uploadForm").addEventListener("submit", async (e) => {
     e.preventDefault();
     
     const submitBtn = document.getElementById("submitBtn");
     const buttonText = submitBtn.querySelector(".button-text");
     const spinner = submitBtn.querySelector(".spinner");
     const errorDiv = document.getElementById("error");
     const errorMessage = document.getElementById("error-message");
     const resultsDiv = document.getElementById("results");
     
     // Reset UI
     errorDiv.classList.add("hidden");
     errorMessage.textContent = "";
     resultsDiv.classList.add("hidden");
     
     if (!fileInput.files || !fileInput.files[0]) {
         showError("Please select a file first!");
         return;
     }
     
     // Show loading state
     buttonText.textContent = "Processing...";
     spinner.classList.remove("hidden");
     submitBtn.disabled = true;
     
     try {
         const formData = new FormData();
         formData.append("file", fileInput.files[0]);
         
         const response = await fetch("/upload_audio", {
             method: "POST",
             body: formData
         });
         
         if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             throw new Error(errorData.error || "Server error occurred");
         }
         
         const data = await response.json();
         
         // Format transcript with line breaks
         const transcript = data.transcript.replace(/\n/g, "<br>");
         document.getElementById("transcript").innerHTML = transcript;
         
         // Format summary with bullet points
         const summary = data.summary.replace(/\n/g, "<br>");
         document.getElementById("summary").innerHTML = summary;
         
         resultsDiv.classList.remove("hidden");
         
     } catch (error) {
         showError(error.message);
     } finally {
         // Reset button state
         buttonText.textContent = "Summarize";
         spinner.classList.add("hidden");
         submitBtn.disabled = false;
     }
 });
 
 function showError(message) {
     const errorDiv = document.getElementById("error");
     const errorMessage = document.getElementById("error-message");
     errorMessage.textContent = message;
     errorDiv.classList.remove("hidden");
 }
 
 function copyToClipboard(elementId) {
     const element = document.getElementById(elementId);
     const text = element.innerText;
     const copyBtn = element.parentElement.querySelector(".copy-btn");
     const originalText = copyBtn.textContent;
     
     navigator.clipboard.writeText(text).then(() => {
         copyBtn.textContent = "Copied!";
         copyBtn.classList.remove("bg-blue-100", "text-blue-700", "hover:bg-blue-200");
         copyBtn.classList.add("bg-green-100", "text-green-700", "hover:bg-green-200");
         
         setTimeout(() => {
             copyBtn.textContent = originalText;
             copyBtn.classList.remove("bg-green-100", "text-green-700", "hover:bg-green-200");
             copyBtn.classList.add("bg-blue-100", "text-blue-700", "hover:bg-blue-200");
         }, 2000);
     });
 }