<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schedule Diagnostic</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
        }
        h1 { color: #333; }
        h2 { 
            color: #666; 
            margin-top: 30px; 
            border-bottom: 2px solid #eee; 
            padding-bottom: 10px; 
        }
        .section {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        .btn {
            background: #222;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .btn:hover { background: #111; }
        .btn-success { background: #28a745; }
        .btn-danger { background: #dc3545; }
        .btn-warning { background: #ffc107; color: #000; }
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            max-height: 300px;
            font-size: 12px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 13px;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-box {
            background: #fff;
            border: 2px solid #eee;
            padding: 15px;
            border-radius: 4px;
            text-align: center;
        }
        .stat-number {
            font-size: 36px;
            font-weight: bold;
            color: #222;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Complete Schedule Diagnostic</h1>
        
        <div class="grid">
            <div class="stat-box">
                <div class="stat-number" id="statEmployees">-</div>
                <div class="stat-label">Employees in DB</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="statSchedules">-</div>
                <div class="stat-label">Schedules in DB</div>
            </div>
            <div class="stat-box">
                <div class="stat-number" id="statCurrentWeek">-</div>
                <div class="stat-label">Current Week Schedules</div>
            </div>
        </div>

        <h2>Step 1: Check Database via SQL</h2>
        <div class="section">
            <p><strong>Run these queries in phpMyAdmin to verify data:</strong></p>
            
            <h3>Query 1: Check all employees</h3>
            <pre>SELECT employee_id, name, status FROM employees;</pre>
            
            <h3>Query 2: Check all schedules with JOIN</h3>
            <pre>SELECT 
    s.schedule_id,
    s.employee_id,
    e.name as employee_name,
    s.week_start_date,
    s.day_of_week,
    s.shift_name,
    s.shift_time,
    s.is_next_week
FROM schedules s
LEFT JOIN employees e ON s.employee_id = e.employee_id
ORDER BY s.week_start_date DESC, s.employee_id, s.day_of_week;</pre>

            <h3>Query 3: Check for orphaned schedules (employee doesn't exist)</h3>
            <pre>SELECT s.* 
FROM schedules s 
LEFT JOIN employees e ON s.employee_id = e.employee_id 
WHERE e.employee_id IS NULL;</pre>

            <h3>Query 4: Today's calculated Saturday</h3>
            <pre id="saturdayQuery"></pre>
        </div>

        <h2>Step 2: Test API Responses</h2>
        <div class="section">
            <button class="btn" onclick="testAPI('current')">Test Current Week API</button>
            <button class="btn" onclick="testAPI('next')">Test Next Week API</button>
            <button class="btn" onclick="testAPI('employees')">Test Employees API</button>
            <button class="btn btn-warning" onclick="testAllAPIs()">Test All APIs</button>
            <div id="apiResults"></div>
        </div>

        <h2>Step 3: Raw Database Check (Simulated)</h2>
        <div class="section">
            <button class="btn btn-success" onclick="checkDatabase()">Check Database Content</button>
            <div id="dbCheck"></div>
        </div>

        <h2>Step 4: Dashboard Simulation</h2>
        <div class="section">
            <p>This simulates exactly what your dashboard does:</p>
            <button class="btn" onclick="simulateDashboard()">Simulate Dashboard Load</button>
            <div id="dashboardSim"></div>
        </div>

        <h2>Step 5: Direct Schedule Display Test</h2>
        <div class="section">
            <p>This will render schedules exactly like the dashboard should:</p>
            <button class="btn" onclick="renderScheduleTest()">Render Schedule Table</button>
            <div id="scheduleRender"></div>
        </div>

        <h2>Step 6: Fix Common Issues</h2>
        <div class="section">
            <button class="btn btn-warning" onclick="showFixInstructions()">Show Fix Instructions</button>
            <div id="fixInstructions"></div>
        </div>
    </div>

    <script>
        const API_BASE = '../api/';
        
        // Calculate correct Saturday
        function getLastSaturday() {
            const d = new Date();
            const day = d.getDay();
            const daysBack = (day + 1) % 7;
            d.setDate(d.getDate() - daysBack);
            return d.toISOString().split('T')[0];
        }
        
        const currentSaturday = getLastSaturday();
        
        // Update SQL query with calculated Saturday
        document.getElementById('saturdayQuery').textContent = `-- Current Saturday should be: ${currentSaturday}
-- Check schedules for this date:
SELECT * FROM schedules WHERE week_start_date = '${currentSaturday}';`;

        async function testAPI(type) {
            const div = document.getElementById('apiResults');
            div.innerHTML = '<p>Testing API...</p>';
            
            let url;
            if (type === 'current') url = API_BASE + 'schedules.php?action=current';
            else if (type === 'next') url = API_BASE + 'schedules.php?action=next';
            else if (type === 'employees') url = API_BASE + 'employees.php?action=list';
            
            try {
                const response = await fetch(url);
                const text = await response.text();
                
                let result;
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    div.innerHTML = `<div class="error">
                        <strong>❌ Invalid JSON Response</strong>
                        <p>The API returned invalid JSON. This might be a PHP error:</p>
                        <pre>${text}</pre>
                    </div>`;
                    return;
                }
                
                if (type === 'employees') {
                    document.getElementById('statEmployees').textContent = result.data?.length || 0;
                }
                
                const dataCount = result.data?.length || 0;
                const className = result.success && dataCount > 0 ? 'success' : 
                                 result.success && dataCount === 0 ? 'warning' : 'error';
                
                div.innerHTML = `<div class="${className}">
                    <strong>${result.success ? '✅' : '❌'} ${type.toUpperCase()} API Response</strong>
                    <p>Status: ${result.success ? 'Success' : 'Failed'}</p>
                    <p>Message: ${result.message}</p>
                    <p>Data Count: ${dataCount} records</p>
                    <details>
                        <summary>View Full Response</summary>
                        <pre>${JSON.stringify(result, null, 2)}</pre>
                    </details>
                </div>`;
                
                if (type === 'current') {
                    document.getElementById('statCurrentWeek').textContent = dataCount;
                }
            } catch (error) {
                div.innerHTML = `<div class="error">
                    <strong>❌ API Request Failed</strong>
                    <p>${error.message}</p>
                </div>`;
            }
        }
        
        async function testAllAPIs() {
            await testAPI('employees');
            await new Promise(r => setTimeout(r, 500));
            await testAPI('current');
            await new Promise(r => setTimeout(r, 500));
            await testAPI('next');
        }
        
        async function checkDatabase() {
            const div = document.getElementById('dbCheck');
            div.innerHTML = '<p>Checking database...</p>';
            
            try {
                const [employeeRes, scheduleRes] = await Promise.all([
                    fetch(API_BASE + 'employees.php?action=list'),
                    fetch(API_BASE + 'schedules.php?action=current')
                ]);
                
                const employees = await employeeRes.json();
                const schedules = await scheduleRes.json();
                
                document.getElementById('statEmployees').textContent = employees.data?.length || 0;
                document.getElementById('statSchedules').textContent = schedules.data?.length || 0;
                document.getElementById('statCurrentWeek').textContent = schedules.data?.length || 0;
                
                let html = '<div class="info">';
                html += `<h3>Database Status:</h3>`;
                html += `<p>✅ Employees: ${employees.data?.length || 0} found</p>`;
                html += `<p>✅ Current Week Schedules: ${schedules.data?.length || 0} found</p>`;
                html += `<p>📅 Looking for week starting: ${currentSaturday}</p>`;
                html += '</div>';
                
                if (employees.data && employees.data.length > 0) {
                    html += '<h4>Employees in Database:</h4>';
                    html += '<table><tr><th>ID</th><th>Name</th><th>Department</th><th>Status</th></tr>';
                    employees.data.forEach(emp => {
                        html += `<tr>
                            <td>${emp.employee_id}</td>
                            <td>${emp.name}</td>
                            <td>${emp.department}</td>
                            <td>${emp.status}</td>
                        </tr>`;
                    });
                    html += '</table>';
                }
                
                if (schedules.data && schedules.data.length > 0) {
                    html += '<div class="success"><h4>✅ Schedules Found for Current Week!</h4></div>';
                    html += '<table><tr><th>Employee ID</th><th>Name</th><th>Day</th><th>Shift</th><th>Time</th></tr>';
                    schedules.data.forEach(s => {
                        const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                        html += `<tr>
                            <td>${s.employee_id}</td>
                            <td>${s.employee_name || 'N/A'}</td>
                            <td>${days[s.day_of_week]}</td>
                            <td>${s.shift_name}</td>
                            <td>${s.shift_time}</td>
                        </tr>`;
                    });
                    html += '</table>';
                } else {
                    html += '<div class="warning"><h4>⚠️ No Schedules Found</h4>';
                    html += '<p>Expected week_start_date: ' + currentSaturday + '</p>';
                    html += '<p>Run this SQL to check what dates exist:</p>';
                    html += '<pre>SELECT DISTINCT week_start_date, COUNT(*) FROM schedules GROUP BY week_start_date;</pre>';
                    html += '</div>';
                }
                
                div.innerHTML = html;
            } catch (error) {
                div.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            }
        }
        
        async function simulateDashboard() {
            const div = document.getElementById('dashboardSim');
            div.innerHTML = '<p>Simulating dashboard load...</p>';
            
            try {
                const response = await fetch(API_BASE + 'schedules.php?action=current');
                const result = await response.json();
                
                let html = '<h3>Dashboard Load Simulation:</h3>';
                
                if (!result.success) {
                    html += `<div class="error">
                        <strong>❌ API Error</strong>
                        <p>${result.message}</p>
                    </div>`;
                } else if (!result.data || result.data.length === 0) {
                    html += `<div class="warning">
                        <strong>⚠️ No Data Returned</strong>
                        <p>The dashboard will show: "No schedule configured for this week"</p>
                        <p><strong>Why?</strong> No schedules found with week_start_date = ${currentSaturday}</p>
                    </div>`;
                } else {
                    html += `<div class="success">
                        <strong>✅ Success!</strong>
                        <p>Dashboard will display ${result.data.length} schedule entries</p>
                    </div>`;
                    
                    // Group by employee
                    const byEmployee = {};
                    result.data.forEach(s => {
                        if (!byEmployee[s.employee_id]) {
                            byEmployee[s.employee_id] = {
                                name: s.employee_name,
                                days: Array(7).fill(null)
                            };
                        }
                        byEmployee[s.employee_id].days[s.day_of_week] = {
                            shift_name: s.shift_name,
                            shift_time: s.shift_time
                        };
                    });
                    
                    html += '<p><strong>Dashboard will show:</strong></p>';
                    html += '<pre>' + JSON.stringify(byEmployee, null, 2) + '</pre>';
                }
                
                div.innerHTML = html;
            } catch (error) {
                div.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            }
        }
        
        async function renderScheduleTest() {
            const div = document.getElementById('scheduleRender');
            div.innerHTML = '<p>Rendering schedule table...</p>';
            
            try {
                const response = await fetch(API_BASE + 'schedules.php?action=current');
                const result = await response.json();
                
                if (!result.success || !result.data || result.data.length === 0) {
                    div.innerHTML = `<div class="warning">
                        <p>No schedules to render. Table would show "No schedule configured"</p>
                    </div>`;
                    return;
                }
                
                // Group by employee
                const employeeSchedules = {};
                result.data.forEach(item => {
                    if (!employeeSchedules[item.employee_id]) {
                        employeeSchedules[item.employee_id] = {
                            name: item.employee_name,
                            days: Array(7).fill(null)
                        };
                    }
                    employeeSchedules[item.employee_id].days[item.day_of_week] = {
                        shift_name: item.shift_name,
                        shift_time: item.shift_time
                    };
                });
                
                let html = '<div class="success"><h3>✅ Schedule Table (As Dashboard Should Show):</h3></div>';
                html += '<table style="font-size: 12px;"><thead><tr>';
                html += '<th>Employee</th>';
                html += '<th>Sat</th><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th>';
                html += '</tr></thead><tbody>';
                
                Object.entries(employeeSchedules).forEach(([empId, schedule]) => {
                    html += '<tr>';
                    html += `<td><strong>${schedule.name}</strong></td>`;
                    schedule.days.forEach(day => {
                        if (day) {
                            html += `<td style="background: #f0f0f0;">
                                <div style="font-weight: 500;">${day.shift_name}</div>
                                <small style="color: #666;">${day.shift_time}</small>
                            </td>`;
                        } else {
                            html += '<td style="color: #999;">Day Off</td>';
                        }
                    });
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
                
                div.innerHTML = html;
            } catch (error) {
                div.innerHTML = `<div class="error">Error: ${error.message}</div>`;
            }
        }
        
        function showFixInstructions() {
            const div = document.getElementById('fixInstructions');
            div.innerHTML = `
                <div class="info">
                    <h3>🔧 Common Issues & Fixes:</h3>
                    
                    <h4>Issue 1: Schedules in DB but not showing</h4>
                    <p><strong>Cause:</strong> Wrong week_start_date</p>
                    <p><strong>Fix:</strong> Run this SQL:</p>
                    <pre>-- Check what dates you have
SELECT DISTINCT week_start_date, COUNT(*) as count
FROM schedules 
GROUP BY week_start_date;

-- If wrong date, update to correct Saturday (${currentSaturday})
UPDATE schedules 
SET week_start_date = '${currentSaturday}'
WHERE week_start_date != '${currentSaturday}';</pre>

                    <h4>Issue 2: employee_name is NULL</h4>
                    <p><strong>Cause:</strong> employee_id doesn't match between schedules and employees tables</p>
                    <p><strong>Fix:</strong> Run this SQL to find mismatches:</p>
                    <pre>-- Find schedules with non-existent employees
SELECT s.employee_id, COUNT(*) 
FROM schedules s 
LEFT JOIN employees e ON s.employee_id = e.employee_id 
WHERE e.employee_id IS NULL 
GROUP BY s.employee_id;

-- Delete orphaned schedules
DELETE s FROM schedules s 
LEFT JOIN employees e ON s.employee_id = e.employee_id 
WHERE e.employee_id IS NULL;</pre>

                    <h4>Issue 3: Dashboard JS not loading</h4>
                    <p><strong>Check:</strong> Open browser console (F12) and look for errors</p>
                    <p><strong>Fix:</strong> Make sure dashboard.js is loaded in dashboard.php:</p>
                    <pre>&lt;script src="../js/dashboard.js"&gt;&lt;/script&gt;</pre>

                    <h4>Issue 4: API returning empty but SQL has data</h4>
                    <p><strong>Cause:</strong> Date mismatch or is_next_week flag wrong</p>
                    <p><strong>Fix:</strong> Check is_next_week values:</p>
                    <pre>-- Current week should have is_next_week = 0
SELECT * FROM schedules WHERE week_start_date = '${currentSaturday}' AND is_next_week = 0;</pre>
                </div>
            `;
        }
        
        // Auto-run on load
        window.addEventListener('load', () => {
            checkDatabase();
        });
    </script>
</body>
</html>