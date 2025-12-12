// js/zkteco-import.js - Complete ZKTeco Import Handler with Enhanced Error Handling

class ZKTecoImportManager {
    constructor() {
        this.selectedFile = null;
        this.importResults = null;
        this.validationErrors = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
        this.loadMappings();
    }

    setupEventListeners() {
        // File input handling
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        // Drag and drop
        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // File input change
        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Remove file button
        document.getElementById('removeFile')?.addEventListener('click', () => {
            this.clearFileSelection();
        });

        // Import button
        document.getElementById('importBtn')?.addEventListener('click', () => {
            this.processImport();
        });

        // Validate before import button
        document.getElementById('validateBtn')?.addEventListener('click', () => {
            this.validateFile();
        });
    }

    handleFileSelect(file) {
        // Validate file type
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));

        if (!isValid) {
            this.showNotification('error', 'Invalid file type. Please select a CSV or Excel file.');
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('error', 'File is too large. Maximum size is 10MB.');
            return;
        }

        this.selectedFile = file;
        this.displaySelectedFile(file);
        this.showImportControls();
    }

    displaySelectedFile(file) {
        const selectedFileDiv = document.getElementById('selectedFile');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');

        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
        if (selectedFileDiv) selectedFileDiv.classList.add('show');
    }

    showImportControls() {
        const importBtn = document.getElementById('importBtn');
        const validateBtn = document.getElementById('validateBtn');
        
        if (importBtn) importBtn.style.display = 'inline-flex';
        if (validateBtn) validateBtn.style.display = 'inline-flex';
    }

    clearFileSelection() {
        this.selectedFile = null;
        this.validationErrors = [];
        
        const fileInput = document.getElementById('fileInput');
        const selectedFileDiv = document.getElementById('selectedFile');
        const importBtn = document.getElementById('importBtn');
        const validateBtn = document.getElementById('validateBtn');

        if (fileInput) fileInput.value = '';
        if (selectedFileDiv) selectedFileDiv.classList.remove('show');
        if (importBtn) importBtn.style.display = 'none';
        if (validateBtn) validateBtn.style.display = 'none';

        this.hideResult();
    }

    async validateFile() {
        if (!this.selectedFile) {
            this.showNotification('error', 'Please select a file first');
            return;
        }

        this.showProgress('Validating file...', 0);

        try {
            // Read file content
            const fileData = await this.readFileContent(this.selectedFile);
            
            // Parse based on file type
            let rows;
            if (fileData.isExcel) {
                rows = this.parseExcel(fileData.content);
            } else {
                rows = this.parseCSV(fileData.content);
            }
            
            this.updateProgress(30);

            // Validate structure
            const validation = this.validateData(rows);
            
            this.updateProgress(70);

            // Get employee mappings
            await this.loadMappings();
            
            this.updateProgress(100);

            // Show validation results
            this.displayValidationResults(validation);

        } catch (error) {
            console.error('Validation error:', error);
            this.hideProgress();
            this.showNotification('error', 'Validation failed: ' + error.message);
        }
    }

    async processImport() {
        if (!this.selectedFile) {
            this.showNotification('error', 'Please select a file first');
            return;
        }

        // Confirm import
        if (!confirm('Import this file? This will add or update attendance records.')) {
            return;
        }

        const formData = new FormData();
        formData.append('excelFile', this.selectedFile);

        this.showProgress('Importing data...', 0);
        this.disableImportButtons();

        try {
            // Start progress animation
            const progressInterval = this.startProgressAnimation();

            const response = await fetch('../api/zkteco-import.php', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            this.updateProgress(100);

            setTimeout(() => {
                this.hideProgress();
                this.displayImportResults(result);
                
                if (result.success) {
                    this.loadStats();
                    // Clear file after successful import
                    setTimeout(() => this.clearFileSelection(), 5000);
                }

                this.enableImportButtons();
            }, 500);

        } catch (error) {
            console.error('Import error:', error);
            this.hideProgress();
            this.showNotification('error', 'Import failed: ' + error.message);
            this.enableImportButtons();
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const fileName = file.name.toLowerCase();
            
            reader.onload = (e) => {
                resolve({
                    content: e.target.result,
                    isExcel: fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
                });
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            // Read as ArrayBuffer for Excel files, text for CSV
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    parseCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            throw new Error('File is empty');
        }

        // Parse header
        const header = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
        
        // Parse data rows
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
            
            if (values.length === header.length) {
                const row = {};
                header.forEach((key, index) => {
                    row[key] = values[index];
                });
                rows.push(row);
            }
        }

        return rows;
    }

    parseExcel(arrayBuffer) {
        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            throw new Error('Excel library not loaded. Please refresh the page.');
        }

        try {
            // Read workbook
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const data = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: '',
                blankrows: false
            });
            
            if (data.length === 0) {
                throw new Error('Excel file is empty');
            }
            
            // Convert array format to object format
            const header = data[0];
            const rows = [];
            
            for (let i = 1; i < data.length; i++) {
                const row = {};
                header.forEach((key, index) => {
                    row[key] = data[i][index] || '';
                });
                rows.push(row);
            }
            
            return rows;
        } catch (error) {
            throw new Error('Failed to parse Excel file: ' + error.message);
        }
    }

    validateData(rows) {
        const errors = [];
        const warnings = [];
        let validRows = 0;

        // Check if we have data
        if (rows.length === 0) {
            errors.push('No data rows found in file');
            return { valid: false, errors, warnings, validRows, totalRows: 0 };
        }

        // Validate each row
        rows.forEach((row, index) => {
            const rowNum = index + 2; // +2 for header and 0-index
            let isValid = true;

            // Check required fields
            const employeeId = row['Employee ID'] || row['employee_id'] || row['ID'] || '';
            const date = row['Date'] || row['date'] || row['Attendance Date'] || '';
            
            if (!employeeId) {
                errors.push(`Row ${rowNum}: Missing Employee ID`);
                isValid = false;
            }

            if (!date) {
                errors.push(`Row ${rowNum}: Missing Date`);
                isValid = false;
            }

            // Validate date format
            if (date && !this.isValidDate(date)) {
                warnings.push(`Row ${rowNum}: Date format might be incorrect (${date})`);
            }

            // Check time formats
            const timeIn = row['Time In'] || row['Check In'] || row['time_in'] || '';
            const timeOut = row['Time Out'] || row['Check Out'] || row['time_out'] || '';

            if (timeIn && !this.isValidTime(timeIn)) {
                warnings.push(`Row ${rowNum}: Time In format might be incorrect (${timeIn})`);
            }

            if (timeOut && !this.isValidTime(timeOut)) {
                warnings.push(`Row ${rowNum}: Time Out format might be incorrect (${timeOut})`);
            }

            if (isValid) validRows++;
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            validRows,
            totalRows: rows.length
        };
    }

    isValidDate(dateStr) {
        // Try common date formats
        const formats = [
            /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
            /^\d{2}-\d{2}-\d{4}$/    // DD-MM-YYYY
        ];

        return formats.some(format => format.test(dateStr));
    }

    isValidTime(timeStr) {
        // Try common time formats
        const formats = [
            /^\d{1,2}:\d{2}$/,           // HH:MM
            /^\d{1,2}:\d{2}:\d{2}$/,     // HH:MM:SS
            /^\d{1,2}:\d{2}\s*[AP]M$/i   // HH:MM AM/PM
        ];

        return formats.some(format => format.test(timeStr));
    }

    displayValidationResults(validation) {
        const resultDiv = document.getElementById('importResult');
        
        if (!resultDiv) return;

        resultDiv.className = validation.valid ? 'import-result success' : 'import-result error';
        
        let html = `
            <h3>
                <i class="fas ${validation.valid ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> 
                Validation ${validation.valid ? 'Passed' : 'Failed'}
            </h3>
            <div class="result-stats">
                <div class="result-stat">
                    <h4>${validation.totalRows}</h4>
                    <p>Total Rows</p>
                </div>
                <div class="result-stat">
                    <h4>${validation.validRows}</h4>
                    <p>Valid Rows</p>
                </div>
                <div class="result-stat">
                    <h4>${validation.errors.length}</h4>
                    <p>Errors</p>
                </div>
                <div class="result-stat">
                    <h4>${validation.warnings.length}</h4>
                    <p>Warnings</p>
                </div>
            </div>
        `;

        if (validation.errors.length > 0) {
            html += `
                <details open style="margin-top: 15px;">
                    <summary style="cursor: pointer; font-weight: bold; color: #dc3545;">
                        <i class="fas fa-exclamation-circle"></i> Errors (${validation.errors.length})
                    </summary>
                    <ul style="margin-top: 10px; max-height: 200px; overflow-y: auto;">
                        ${validation.errors.slice(0, 50).map(err => `<li>${this.escapeHtml(err)}</li>`).join('')}
                        ${validation.errors.length > 50 ? `<li><em>... and ${validation.errors.length - 50} more errors</em></li>` : ''}
                    </ul>
                </details>
            `;
        }

        if (validation.warnings.length > 0) {
            html += `
                <details style="margin-top: 15px;">
                    <summary style="cursor: pointer; font-weight: bold; color: #ffc107;">
                        <i class="fas fa-exclamation-triangle"></i> Warnings (${validation.warnings.length})
                    </summary>
                    <ul style="margin-top: 10px; max-height: 200px; overflow-y: auto;">
                        ${validation.warnings.slice(0, 30).map(warn => `<li>${this.escapeHtml(warn)}</li>`).join('')}
                        ${validation.warnings.length > 30 ? `<li><em>... and ${validation.warnings.length - 30} more warnings</em></li>` : ''}
                    </ul>
                </details>
            `;
        }

        if (validation.valid) {
            html += `
                <p style="margin-top: 15px; color: #28a745;">
                    <i class="fas fa-info-circle"></i> 
                    File is ready to import. Click "Import Data" to proceed.
                </p>
            `;
        } else {
            html += `
                <p style="margin-top: 15px; color: #dc3545;">
                    <i class="fas fa-times-circle"></i> 
                    Please fix the errors in your CSV file before importing.
                </p>
            `;
        }

        resultDiv.innerHTML = html;
        resultDiv.style.display = 'block';
    }

    displayImportResults(result) {
        const resultDiv = document.getElementById('importResult');
        
        if (!resultDiv) return;

        resultDiv.className = 'import-result ' + (result.success ? 'success' : 'error');
        
        if (result.success) {
            const data = result.data;
            const totalProcessed = (data.imported || 0) + (data.updated || 0);
            
            resultDiv.innerHTML = `
                <h3>
                    <i class="fas fa-check-circle"></i> 
                    Import Completed Successfully!
                </h3>
                <p style="margin-top: 10px;">
                    Processed ${data.total_rows || 0} rows from your file.
                </p>
                <div class="result-stats">
                    <div class="result-stat">
                        <h4>${data.total_rows || 0}</h4>
                        <p>Total Rows</p>
                    </div>
                    <div class="result-stat" style="background: #d4edda;">
                        <h4>${data.imported || 0}</h4>
                        <p>New Records</p>
                    </div>
                    <div class="result-stat" style="background: #fff3cd;">
                        <h4>${data.updated || 0}</h4>
                        <p>Updated</p>
                    </div>
                    <div class="result-stat" style="background: #f8d7da;">
                        <h4>${data.failed || 0}</h4>
                        <p>Failed</p>
                    </div>
                </div>
                ${data.errors && data.errors.length > 0 ? `
                    <details style="margin-top: 15px;">
                        <summary style="cursor: pointer; font-weight: bold; color: #dc3545;">
                            <i class="fas fa-exclamation-circle"></i> 
                            View Errors (${data.errors.length})
                        </summary>
                        <ul style="margin-top: 10px; max-height: 200px; overflow-y: auto;">
                            ${data.errors.map(err => `<li>${this.escapeHtml(err)}</li>`).join('')}
                        </ul>
                    </details>
                ` : ''}
                <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
                    <p style="margin: 0; color: #1976d2;">
                        <i class="fas fa-info-circle"></i> 
                        <strong>Next steps:</strong> Review the imported records in the Attendance page.
                    </p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <h3>
                    <i class="fas fa-exclamation-circle"></i> 
                    Import Failed
                </h3>
                <p style="margin-top: 10px; color: #721c24;">
                    ${this.escapeHtml(result.message || 'An error occurred during import')}
                </p>
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 5px;">
                    <p style="margin: 0; color: #856404;">
                        <i class="fas fa-lightbulb"></i> 
                        <strong>Troubleshooting:</strong>
                    </p>
                    <ul style="margin: 10px 0 0 20px; color: #856404;">
                        <li>Check that your CSV file has the correct column headers</li>
                        <li>Ensure Employee IDs exist in your system</li>
                        <li>Verify date format is YYYY-MM-DD or DD/MM/YYYY</li>
                        <li>Make sure times are in HH:MM or HH:MM AM/PM format</li>
                    </ul>
                </div>
            `;
        }
        
        resultDiv.style.display = 'block';
    }

    async loadStats() {
        try {
            const response = await fetch('../api/zkteco-import.php?action=stats');
            const result = await response.json();
            
            if (result.success && result.data) {
                const data = result.data;
                
                const totalEl = document.getElementById('totalRecords');
                const uniqueEl = document.getElementById('uniqueEmployees');
                const latestEl = document.getElementById('latestDate');
                const earliestEl = document.getElementById('earliestDate');
                
                if (totalEl) totalEl.textContent = data.total_records || 0;
                if (uniqueEl) uniqueEl.textContent = data.unique_employees || 0;
                
                if (latestEl) {
                    latestEl.textContent = data.latest_date ? 
                        new Date(data.latest_date).toLocaleDateString() : 'N/A';
                }
                
                if (earliestEl) {
                    earliestEl.textContent = data.earliest_date ? 
                        new Date(data.earliest_date).toLocaleDateString() : 'N/A';
                }
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    async loadMappings() {
        try {
            const response = await fetch('../api/zkteco-mapping-api.php?action=list');
            const result = await response.json();
            
            if (result.success) {
                this.mappings = result.data || [];
            }
        } catch (error) {
            console.error('Failed to load mappings:', error);
        }
    }

    showProgress(message, percent) {
        const progressDiv = document.getElementById('importProgress');
        const progressFill = document.getElementById('progressFill');
        
        if (progressDiv) progressDiv.style.display = 'block';
        if (progressFill) {
            progressFill.style.width = percent + '%';
            progressFill.textContent = message;
        }
    }

    updateProgress(percent) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = percent + '%';
            progressFill.textContent = Math.round(percent) + '%';
        }
    }

    hideProgress() {
        const progressDiv = document.getElementById('importProgress');
        if (progressDiv) progressDiv.style.display = 'none';
    }

    hideResult() {
        const resultDiv = document.getElementById('importResult');
        if (resultDiv) resultDiv.style.display = 'none';
    }

    startProgressAnimation() {
        let progress = 0;
        return setInterval(() => {
            progress += 5;
            if (progress <= 90) {
                this.updateProgress(progress);
            }
        }, 200);
    }

    disableImportButtons() {
        const importBtn = document.getElementById('importBtn');
        const validateBtn = document.getElementById('validateBtn');
        
        if (importBtn) {
            importBtn.disabled = true;
            importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        }
        if (validateBtn) validateBtn.disabled = true;
    }

    enableImportButtons() {
        const importBtn = document.getElementById('importBtn');
        const validateBtn = document.getElementById('validateBtn');
        
        if (importBtn) {
            importBtn.disabled = false;
            importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import Data';
        }
        if (validateBtn) validateBtn.disabled = false;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#ffc107'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}" 
                   style="font-size: 20px;"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.zktecoManager = new ZKTecoImportManager();
    console.log('✅ ZKTeco Import Manager initialized');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);