<?php
// pages/zkteco-import.php - FIXED VERSION
require_once '../config/config.php';
requireLogin();

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZKTeco Import - Grande.</title>
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .import-container {
            max-width: 900px;
            margin: 0 auto;
        }

        .import-section {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .import-header {
            text-align: center;
            margin-bottom: 30px;
        }

        .import-header i {
            font-size: 64px;
            color: #4CAF50;
            margin-bottom: 15px;
        }

        .import-header h2 {
            font-size: 24px;
            color: #222;
            margin-bottom: 10px;
        }

        .import-header p {
            color: #666;
            font-size: 14px;
        }

        .alert-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .alert-box h3 {
            margin: 0 0 15px 0;
            color: #856404;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .alert-box .convert-steps {
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
        }

        .alert-box .convert-steps ol {
            margin: 10px 0 0 20px;
            padding: 0;
        }

        .alert-box .convert-steps li {
            margin: 5px 0;
            color: #856404;
        }

        .instructions-section {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .instructions-section h3 {
            margin: 0 0 15px 0;
            color: #1565c0;
        }

        .instructions-section ol {
            margin: 0;
            padding-left: 20px;
            color: #1976d2;
        }

        .instructions-section li {
            margin-bottom: 10px;
        }

        .format-example {
            background: white;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
            overflow-x: auto;
        }

        .format-example table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            min-width: 600px;
        }

        .format-example th,
        .format-example td {
            padding: 8px;
            border: 1px solid #ddd;
            text-align: left;
        }

        .format-example th {
            background: #f8f9fa;
            font-weight: 600;
        }

        .upload-area {
            position: relative;
            border: 3px dashed #ddd;
            border-radius: 12px;
            padding: 50px 30px;
            text-align: center;
            background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 20px;
        }

        .upload-area:hover {
            border-color: #4CAF50;
            background: linear-gradient(135deg, #f0f8f0 0%, #e8f5e9 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.1);
        }

        .upload-area.dragover {
            border-color: #4CAF50;
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            border-style: solid;
            transform: scale(1.02);
        }

        .upload-area i {
            font-size: 56px;
            color: #4CAF50;
            margin-bottom: 20px;
            transition: transform 0.3s ease;
        }

        .upload-area:hover i {
            transform: scale(1.1);
        }

        .upload-area h3 {
            margin: 10px 0;
            color: #222;
            font-size: 20px;
        }

        .upload-area p {
            margin: 10px 0 20px 0;
            color: #666;
            font-size: 14px;
        }

        .file-input {
            display: none;
        }

        .btn-upload {
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
        }

        .btn-upload:hover:not(:disabled) {
            background-color: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }

        .btn-upload:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .selected-file {
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
            border: 2px solid #4CAF50;
            box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
        }

        .selected-file.show {
            display: flex;
            align-items: center;
            justify-content: space-between;
            animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .file-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .file-info i {
            font-size: 40px;
            color: #4CAF50;
        }

        .file-info strong {
            display: block;
            color: #222;
            font-size: 16px;
            margin-bottom: 4px;
        }

        .remove-file {
            background: #dc3545;
            border: none;
            color: white;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 50%;
            font-size: 16px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .remove-file:hover {
            background: #c82333;
            transform: rotate(90deg);
        }

        .import-progress {
            display: none;
            margin: 20px 0;
        }

        .progress-bar {
            width: 100%;
            height: 40px;
            background: #f0f0f0;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #66BB6A);
            width: 0%;
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }

        .import-result {
            display: none;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }

        .import-result.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }

        .import-result.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }

        .import-result h3 {
            margin: 0 0 15px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .result-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .result-stat {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .result-stat h4 {
            font-size: 36px;
            margin: 0;
            color: #222;
            font-weight: bold;
        }

        .result-stat p {
            margin: 8px 0 0 0;
            color: #666;
            font-size: 14px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            border: 1px solid #ddd;
        }

        .stat-card h4 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
        }

        .stat-card .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #222;
        }

        details {
            margin: 15px 0;
            padding: 15px;
            background: white;
            border-radius: 5px;
            border: 1px solid #ddd;
        }

        summary {
            cursor: pointer;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            font-weight: 600;
            user-select: none;
        }

        summary:hover {
            background: #e9ecef;
        }

        details ul {
            list-style: none;
            padding: 0;
            margin: 10px 0 0 0;
            max-height: 200px;
            overflow-y: auto;
        }

        details li {
            padding: 8px 12px;
            margin: 5px 0;
            background: #f8f9fa;
            border-left: 3px solid #dc3545;
            border-radius: 3px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <button class="sidebar-toggle" id="sidebarToggle"><i class="fas fa-bars"></i></button>
                <h2>Grande.</h2>
            </div>
            <div class="nav-items">
                <a href="dashboard.php" class="nav-item"><i class="fas fa-chart-line"></i><span>Dashboard</span></a>
                <a href="employees.php" class="nav-item"><i class="fas fa-users"></i><span>Employees</span></a>
                <a href="attendance.php" class="nav-item"><i class="fas fa-clock"></i><span>Attendance</span></a>
                <a href="zkteco-import.php" class="nav-item active"><i class="fas fa-file-import"></i><span>ZKTeco Import</span></a>
                <a href="zkteco-mapping.php" class="nav-item"><i class="fas fa-link"></i><span>ID Mapping</span></a>
                <a href="payroll.php" class="nav-item"><i class="fas fa-money-bill-wave"></i><span>Payroll</span></a>
                <a href="settings.php" class="nav-item"><i class="fas fa-cog"></i><span>Settings</span></a>
            </div>
        </div>

        <div class="main-content">
            <div class="header">
                <div class="search-container">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" placeholder="Search..." class="search-input">
                </div>
                <div class="user-profile">
                    <span><?php echo htmlspecialchars($user['full_name']); ?></span>
                    <div style="width: 40px; height: 40px; background-color: #ddd; border-radius: 50%;"></div>
                </div>
            </div>

            <div class="import-container">
                <div class="import-section">
                    <div class="import-header">
                        <i class="fas fa-fingerprint"></i>
                        <h2>ZKTeco Attendance Import</h2>
                        <p>Import attendance data from your ZKTeco biometric device</p>
                    </div>

                    <div class="alert-box">
                        <h3><i class="fas fa-exclamation-triangle"></i> CSV Files Only</h3>
                        <p style="margin: 5px 0; color: #856404;">
                            Excel support requires the PHP ZIP extension (currently not enabled). 
                            Please use CSV format for now.
                        </p>
                        
                        <div class="convert-steps">
                            <strong>How to convert Excel to CSV:</strong>
                            <ol>
                                <li>Open your Excel file (.xlsx or .xls)</li>
                                <li>Click <strong>File → Save As</strong></li>
                                <li>Choose <strong>CSV (Comma delimited) (*.csv)</strong></li>
                                <li>Click Save and use the CSV file here</li>
                            </ol>
                        </div>
                    </div>

                    <div class="instructions-section">
                        <h3><i class="fas fa-info-circle"></i> Import Instructions</h3>
                        <ol>
                            <li>Export attendance data from your ZKTeco device/software as CSV</li>
                            <li>Ensure CSV contains: Employee ID, Date, Time In, Time Out</li>
                            <li>Click the upload area below or drag and drop your CSV file</li>
                            <li>Click "Import Data" to process the attendance records</li>
                        </ol>

                        <div class="format-example">
                            <strong>✅ Your ZKTeco Transaction Report Format (Supported):</strong>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Person ID</th>
                                        <th>Person Name</th>
                                        <th>Department</th>
                                        <th>Punch Time</th>
                                        <th>Device Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>EMP-001</td>
                                        <td>Juan Dela Cruz</td>
                                        <td>Service</td>
                                        <td>2025-12-12 08:00:00</td>
                                        <td>Grande</td>
                                    </tr>
                                    <tr>
                                        <td>EMP-001</td>
                                        <td>Juan Dela Cruz</td>
                                        <td>Service</td>
                                        <td>2025-12-12 17:00:00</td>
                                        <td>Grande</td>
                                    </tr>
                                </tbody>
                            </table>
                            <p style="margin-top: 10px; font-size: 12px; color: #28a745;">
                                <i class="fas fa-check-circle"></i> <strong>This is the format from your ZKTeco device.</strong> 
                                The system will automatically group punches by date (first = Time In, last = Time Out).
                            </p>
                            
                            <details style="margin-top: 10px;">
                                <summary style="cursor: pointer; font-weight: bold; color: #666; user-select: none;">
                                    Alternative: Standard Format (also supported)
                                </summary>
                                <table style="margin-top: 10px;">
                                    <thead>
                                        <tr>
                                            <th>Employee ID</th>
                                            <th>Date</th>
                                            <th>Time In</th>
                                            <th>Time Out</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>EMP-001</td>
                                            <td>2025-12-12</td>
                                            <td>08:00</td>
                                            <td>17:00</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </details>
                        </div>
                    </div>

                    <div class="upload-area" id="uploadArea">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <h3>Drop CSV file here or click to browse</h3>
                        <p>Only CSV (.csv) files are currently supported</p>
                        <button class="btn-upload" onclick="document.getElementById('fileInput').click()">
                            <i class="fas fa-folder-open"></i>
                            Choose CSV File
                        </button>
                        <input type="file" id="fileInput" class="file-input" accept=".csv">
                    </div>

                    <div class="selected-file" id="selectedFile">
                        <div class="file-info">
                            <i class="fas fa-file-csv"></i>
                            <div>
                                <strong id="fileName">No file selected</strong>
                                <p id="fileSize" style="margin: 0; color: #666; font-size: 12px;"></p>
                            </div>
                        </div>
                        <button class="remove-file" id="removeFile">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn-upload" id="importBtn" style="display: none; flex: 1;">
                            <i class="fas fa-file-import"></i>
                            Import Data
                        </button>
                    </div>

                    <div class="import-progress" id="importProgress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill">0%</div>
                        </div>
                    </div>

                    <div class="import-result" id="importResult"></div>
                </div>

                <div class="import-section">
                    <h3><i class="fas fa-chart-bar"></i> Import Statistics</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4>Total Records</h4>
                            <div class="stat-value" id="totalRecords">0</div>
                        </div>
                        <div class="stat-card">
                            <h4>Unique Employees</h4>
                            <div class="stat-value" id="uniqueEmployees">0</div>
                        </div>
                        <div class="stat-card">
                            <h4>Latest Date</h4>
                            <div class="stat-value" id="latestDate" style="font-size: 16px;">N/A</div>
                        </div>
                        <div class="stat-card">
                            <h4>Earliest Date</h4>
                            <div class="stat-value" id="earliestDate" style="font-size: 16px;">N/A</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <button class="logout-btn" id="logoutBtn">
        <i class="fas fa-sign-out-alt"></i>
    </button>

    <script>
        // ===== COMPLETE IMPORT HANDLER - INLINE VERSION =====
        let selectedFile = null;

        document.addEventListener('DOMContentLoaded', () => {
            setupFileHandlers();
            loadStats();
        });

        function setupFileHandlers() {
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    handleFileSelect(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                }
            });

            document.getElementById('removeFile').addEventListener('click', clearFileSelection);
            document.getElementById('importBtn').addEventListener('click', processImport);
        }

        function handleFileSelect(file) {
            const fileName = file.name.toLowerCase();
            
            if (!fileName.endsWith('.csv')) {
                alert('Please select a CSV file. Excel files are not supported yet.\n\nTo convert: Open Excel → File → Save As → CSV (Comma delimited)');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                alert('File is too large. Maximum size is 10MB.');
                return;
            }

            selectedFile = file;
            displaySelectedFile(file);
            document.getElementById('importBtn').style.display = 'inline-flex';
        }

        function displaySelectedFile(file) {
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
            document.getElementById('selectedFile').classList.add('show');
        }

        function clearFileSelection() {
            selectedFile = null;
            document.getElementById('fileInput').value = '';
            document.getElementById('selectedFile').classList.remove('show');
            document.getElementById('importBtn').style.display = 'none';
            hideResult();
        }

        async function processImport() {
            if (!selectedFile) {
                alert('Please select a file first');
                return;
            }

            if (!confirm('Import this file? This will add or update attendance records.')) {
                return;
            }

            const formData = new FormData();
            formData.append('excelFile', selectedFile);

            showProgress('Importing data...', 0);
            disableImportButton();

            try {
                const progressInterval = startProgressAnimation();

                const response = await fetch('../api/zkteco-import.php', {
                    method: 'POST',
                    body: formData
                });

                clearInterval(progressInterval);

                const contentType = response.headers.get('content-type');
                
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    throw new Error('Server returned invalid response. Check browser console.');
                }

                if (!response.ok) {
                    throw new Error('HTTP error! status: ' + response.status);
                }

                const result = await response.json();
                updateProgress(100);

                setTimeout(() => {
                    hideProgress();
                    displayImportResults(result);
                    
                    if (result.success) {
                        loadStats();
                        setTimeout(clearFileSelection, 5000);
                    }

                    enableImportButton();
                }, 500);

            } catch (error) {
                console.error('Import error:', error);
                hideProgress();
                alert('Import failed: ' + error.message);
                enableImportButton();
            }
        }

        function displayImportResults(result) {
            const resultDiv = document.getElementById('importResult');
            resultDiv.className = 'import-result ' + (result.success ? 'success' : 'error');
            
            if (result.success) {
                const data = result.data;
                resultDiv.innerHTML = `
                    <h3><i class="fas fa-check-circle"></i> Import Completed Successfully!</h3>
                    <p>Processed ${data.total_rows || 0} rows from your CSV file.</p>
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
                        <details>
                            <summary style="cursor: pointer; font-weight: bold; color: #dc3545;">
                                <i class="fas fa-exclamation-circle"></i> View Errors (${data.errors.length})
                            </summary>
                            <ul>
                                ${data.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                `;
            } else {
                resultDiv.innerHTML = `
                    <h3><i class="fas fa-exclamation-circle"></i> Import Failed</h3>
                    <p>${escapeHtml(result.message || 'An error occurred')}</p>
                `;
            }
            
            resultDiv.style.display = 'block';
        }

        async function loadStats() {
            try {
                const response = await fetch('../api/zkteco-import.php?action=stats');
                const result = await response.json();
                
                if (result.success && result.data) {
                    const data = result.data;
                    document.getElementById('totalRecords').textContent = data.total_records || 0;
                    document.getElementById('uniqueEmployees').textContent = data.unique_employees || 0;
                    document.getElementById('latestDate').textContent = data.latest_date ? 
                        new Date(data.latest_date).toLocaleDateString() : 'N/A';
                    document.getElementById('earliestDate').textContent = data.earliest_date ? 
                        new Date(data.earliest_date).toLocaleDateString() : 'N/A';
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }

        function showProgress(message, percent) {
            document.getElementById('importProgress').style.display = 'block';
            document.getElementById('progressFill').style.width = percent + '%';
            document.getElementById('progressFill').textContent = message;
        }

        function updateProgress(percent) {
            const progressFill = document.getElementById('progressFill');
            progressFill.style.width = percent + '%';
            progressFill.textContent = Math.round(percent) + '%';
        }

        function hideProgress() {
            document.getElementById('importProgress').style.display = 'none';
        }

        function hideResult() {
            document.getElementById('importResult').style.display = 'none';
        }

        function startProgressAnimation() {
            let progress = 0;
            return setInterval(() => {
                progress += 5;
                if (progress <= 90) {
                    updateProgress(progress);
                }
            }, 200);
        }

        function disableImportButton() {
            const importBtn = document.getElementById('importBtn');
            importBtn.disabled = true;
            importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        }

        function enableImportButton() {
            const importBtn = document.getElementById('importBtn');
            importBtn.disabled = false;
            importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import Data';
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('expanded');
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '../logout.php';
            }
        });

        // ===== LOG INITIALIZATION =====
        console.log('✅ ZKTeco Import initialized - CSV only version');
    </script>
</body>
</html>