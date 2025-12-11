<?php
// pages/zkteco-import.php - ZKTeco Data Import Interface
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

        .upload-area {
            border: 3px dashed #ddd;
            border-radius: 8px;
            padding: 50px 30px;
            text-align: center;
            background: #fafafa;
            cursor: pointer;
            transition: all 0.3s;
            margin-bottom: 20px;
        }

        .upload-area:hover {
            border-color: #4CAF50;
            background: #f0f8f0;
        }

        .upload-area.dragover {
            border-color: #4CAF50;
            background: #e8f5e9;
        }

        .upload-area i {
            font-size: 48px;
            color: #999;
            margin-bottom: 15px;
        }

        .upload-area p {
            margin: 10px 0;
            color: #666;
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
            margin-top: 15px;
        }

        .btn-upload:hover {
            background-color: #45a049;
        }

        .selected-file {
            background: #e8f5e9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: none;
        }

        .selected-file.show {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .file-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .file-info i {
            font-size: 32px;
            color: #4CAF50;
        }

        .remove-file {
            background: none;
            border: none;
            color: #dc3545;
            cursor: pointer;
            padding: 5px 10px;
            font-size: 16px;
        }

        .import-progress {
            display: none;
            margin: 20px 0;
        }

        .progress-bar {
            width: 100%;
            height: 30px;
            background: #f0f0f0;
            border-radius: 15px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #66BB6A);
            width: 0%;
            transition: width 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }

        .import-result {
            display: none;
            padding: 20px;
            border-radius: 5px;
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

        .result-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .result-stat {
            background: white;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }

        .result-stat h4 {
            font-size: 32px;
            margin: 0;
            color: #222;
        }

        .result-stat p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
        }

        .instructions-section {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .instructions-section h3 {
            margin: 0 0 15px 0;
            color: #856404;
        }

        .instructions-section ol {
            margin: 0;
            padding-left: 20px;
            color: #856404;
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
        }

        .format-example table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
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
                        <p>Import attendance data exported from your ZKTeco device</p>
                    </div>

                    <div class="instructions-section">
                        <h3><i class="fas fa-info-circle"></i> How to Import</h3>
                        <ol>
                            <li>Export attendance data from your ZKTeco device/software to CSV format</li>
                            <li>Ensure the CSV file contains: Employee ID, Date, Time In, Time Out</li>
                            <li>Click the upload area below or drag and drop your CSV file</li>
                            <li>Click "Import Data" to process the file</li>
                        </ol>

                        <div class="format-example">
                            <strong>Expected CSV Format:</strong>
                            <table>
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
                                    <tr>
                                        <td>EMP-002</td>
                                        <td>2025-12-12</td>
                                        <td>08:15</td>
                                        <td>17:30</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="upload-area" id="uploadArea">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <h3>Drop CSV file here or click to browse</h3>
                        <p>Supported formats: CSV (.csv)</p>
                        <button class="btn-upload" onclick="document.getElementById('fileInput').click()">
                            <i class="fas fa-folder-open"></i>
                            Choose File
                        </button>
                        <input type="file" id="fileInput" class="file-input" accept=".csv,.xlsx,.xls">
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

                    <button class="btn-upload" id="importBtn" style="width: 100%; display: none;">
                        <i class="fas fa-file-import"></i>
                        Import Data
                    </button>

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
        let selectedFile = null;

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // File input handling
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const selectedFileDiv = document.getElementById('selectedFile');
        const importBtn = document.getElementById('importBtn');

        // Drag and drop
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
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });

        // Remove file
        document.getElementById('removeFile').addEventListener('click', () => {
            selectedFile = null;
            fileInput.value = '';
            selectedFileDiv.classList.remove('show');
            importBtn.style.display = 'none';
        });

        // Handle file selection
        function handleFileSelect(file) {
            const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            
            if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
                alert('Please select a valid CSV file');
                return;
            }

            selectedFile = file;
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
            selectedFileDiv.classList.add('show');
            importBtn.style.display = 'block';
        }

        // Format file size
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        // Import button
        document.getElementById('importBtn').addEventListener('click', async () => {
            if (!selectedFile) {
                alert('Please select a file first');
                return;
            }

            const formData = new FormData();
            formData.append('excelFile', selectedFile);

            const progressDiv = document.getElementById('importProgress');
            const progressFill = document.getElementById('progressFill');
            const resultDiv = document.getElementById('importResult');

            progressDiv.style.display = 'block';
            resultDiv.style.display = 'none';
            importBtn.disabled = true;

            // Simulate progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                if (progress <= 90) {
                    progressFill.style.width = progress + '%';
                    progressFill.textContent = progress + '%';
                }
            }, 200);

            try {
                const response = await fetch('../api/zkteco-import.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                clearInterval(progressInterval);
                progressFill.style.width = '100%';
                progressFill.textContent = '100%';

                setTimeout(() => {
                    progressDiv.style.display = 'none';
                    showResult(result);
                    if (result.success) {
                        loadStats();
                    }
                    importBtn.disabled = false;
                }, 500);

            } catch (error) {
                clearInterval(progressInterval);
                progressDiv.style.display = 'none';
                showResult({
                    success: false,
                    message: 'Import failed: ' + error.message
                });
                importBtn.disabled = false;
            }
        });

        // Show import result
        function showResult(result) {
            const resultDiv = document.getElementById('importResult');
            resultDiv.className = 'import-result ' + (result.success ? 'success' : 'error');
            
            if (result.success) {
                const data = result.data;
                resultDiv.innerHTML = `
                    <h3><i class="fas fa-check-circle"></i> Import Completed Successfully!</h3>
                    <div class="result-stats">
                        <div class="result-stat">
                            <h4>${data.total_rows}</h4>
                            <p>Total Rows</p>
                        </div>
                        <div class="result-stat">
                            <h4>${data.imported}</h4>
                            <p>New Records</p>
                        </div>
                        <div class="result-stat">
                            <h4>${data.updated}</h4>
                            <p>Updated</p>
                        </div>
                        <div class="result-stat">
                            <h4>${data.failed}</h4>
                            <p>Failed</p>
                        </div>
                    </div>
                    ${data.errors && data.errors.length > 0 ? `
                        <details style="margin-top: 15px;">
                            <summary style="cursor: pointer; font-weight: bold;">View Errors (${data.errors.length})</summary>
                            <ul style="margin-top: 10px;">
                                ${data.errors.map(err => `<li>${err}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                `;
            } else {
                resultDiv.innerHTML = `
                    <h3><i class="fas fa-exclamation-circle"></i> Import Failed</h3>
                    <p>${result.message}</p>
                `;
            }
            
            resultDiv.style.display = 'block';
        }

        // Load statistics
        async function loadStats() {
            try {
                const response = await fetch('../api/zkteco-import.php?action=stats');
                const result = await response.json();
                
                if (result.success) {
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

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '../logout.php';
            }
        });

        // Load initial stats
        loadStats();
    </script>
</body>
</html>