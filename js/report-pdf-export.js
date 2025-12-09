// PDF Export function for Reports
function exportReportToPDF() {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const reportType = document.getElementById('reportType').selectedOptions[0].text;
    
    // Get current data
    const totalEmployees = document.getElementById('totalEmployees').textContent;
    const avgAttendance = document.getElementById('avgAttendance').textContent;
    const totalPayroll = document.getElementById('totalPayroll').textContent;
    const totalOvertime = document.getElementById('totalOvertime').textContent;
    const totalDeductions = document.getElementById('totalDeductions').textContent;
    
    // Get payroll summary data
    const totalBasic = document.getElementById('totalBasic').textContent;
    const totalOT = document.getElementById('totalOT').textContent;
    const totalGross = document.getElementById('totalGross').textContent;
    const totalDed = document.getElementById('totalDed').textContent;
    const totalNet = document.getElementById('totalNet').textContent;
    const avgSal = document.getElementById('avgSal').textContent;
    
    // Get table data
    const attendanceRows = document.getElementById('attendanceBody').innerHTML;
    const payrollRows = document.getElementById('payrollBody').innerHTML;
    const departmentRows = document.getElementById('deptBody').innerHTML;
    
    // Convert charts to images
    const attendanceChartImg = document.getElementById('attendanceChart').toDataURL('image/png');
    const payrollChartImg = document.getElementById('payrollChart').toDataURL('image/png');
    const statusChartImg = document.getElementById('statusChart').toDataURL('image/png');
    const componentsChartImg = document.getElementById('componentsChart').toDataURL('image/png');

    // Create the PDF content
    const content = document.createElement('div');
    content.innerHTML = `
        <div style="padding: 30px; font-family: Arial, sans-serif;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #222; padding-bottom: 20px;">
                <h1 style="margin: 0; color: #222; font-size: 32px; font-weight: bold;">Grande.</h1>
                <h2 style="margin: 10px 0 5px 0; color: #666; font-size: 24px;">${reportType}</h2>
                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                    Period: ${startDate ? new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'All Time'} - 
                    ${endDate ? new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Present'}
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">Generated on ${formattedDate}</p>
            </div>

            <!-- Key Metrics -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #222; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
                    <i class="fas fa-chart-bar"></i> Key Metrics
                </h3>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                        <p style="margin: 0; font-size: 11px; color: #666; text-transform: uppercase;">Total Employees</p>
                        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #2196F3;">${totalEmployees}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                        <p style="margin: 0; font-size: 11px; color: #666; text-transform: uppercase;">Avg Attendance</p>
                        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #4CAF50;">${avgAttendance}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                        <p style="margin: 0; font-size: 11px; color: #666; text-transform: uppercase;">Total Net Payroll</p>
                        <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #ff9800;">${totalPayroll}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #03a9f4;">
                        <p style="margin: 0; font-size: 11px; color: #666; text-transform: uppercase;">Total Overtime</p>
                        <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #03a9f4;">${totalOvertime}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #f44336;">
                        <p style="margin: 0; font-size: 11px; color: #666; text-transform: uppercase;">Total Deductions</p>
                        <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #f44336;">${totalDeductions}</p>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div style="margin-bottom: 30px; page-break-inside: avoid;">
                <h3 style="color: #222; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
                    Visual Analytics
                </h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: #333;">Attendance Trend</p>
                        <img src="${attendanceChartImg}" style="width: 100%; height: auto;" />
                    </div>
                    <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: #333;">Department Distribution</p>
                        <img src="${payrollChartImg}" style="width: 100%; height: auto;" />
                    </div>
                    <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: #333;">Status Breakdown</p>
                        <img src="${statusChartImg}" style="width: 100%; height: auto;" />
                    </div>
                    <div style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px; color: #333;">Payroll Components</p>
                        <img src="${componentsChartImg}" style="width: 100%; height: auto;" />
                    </div>
                </div>
            </div>

            <!-- Payroll Summary -->
            <div style="margin-bottom: 30px; page-break-inside: avoid;">
                <h3 style="color: #222; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
                    Payroll Overview
                </h3>
                <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px;">
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #666;">Basic Salary</p>
                        <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #222;">${totalBasic}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #666;">Overtime</p>
                        <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #4CAF50;">${totalOT}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #666;">Gross Pay</p>
                        <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #2196F3;">${totalGross}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #666;">Deductions</p>
                        <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #f44336;">${totalDed}</p>
                    </div>
                    <div style="background: #222; padding: 12px; border-radius: 6px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #ddd;">Net Pay</p>
                        <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #fff;">${totalNet}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #666;">Average</p>
                        <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #222;">${avgSal}</p>
                    </div>
                </div>
            </div>

            <!-- Attendance Details Table -->
            <div style="margin-bottom: 30px; page-break-inside: avoid;">
                <h3 style="color: #222; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
                    Attendance Summary
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">ID</th>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Name</th>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Department</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Present</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Late</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Absent</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Total</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attendanceRows.replace(/<td/g, '<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6;"').replace(/text-right/g, 'text-align: right')}
                    </tbody>
                </table>
            </div>

            <!-- Payroll Details Table -->
            <div style="margin-bottom: 30px; page-break-before: always;">
                <h3 style="color: #222; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
                    Payroll Details
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">ID</th>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Name</th>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Position</th>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Dept</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Basic</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">OT</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Gross</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Ded.</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Net</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payrollRows.replace(/<td/g, '<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6;"').replace(/text-right/g, 'text-align: right').replace(/<strong>/g, '<span style="font-weight: bold;">').replace(/<\/strong>/g, '</span>')}
                    </tbody>
                </table>
            </div>

            <!-- Department Analysis Table -->
            <div style="margin-bottom: 30px; page-break-inside: avoid;">
                <h3 style="color: #222; margin-bottom: 15px; font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
                    Department Analysis
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600;">Department</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Employees</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Avg Attendance</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Total Payroll</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Avg Salary</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">OT</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #dee2e6; font-weight: 600;">Ded.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${departmentRows.replace(/<td/g, '<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6;"').replace(/text-right/g, 'text-align: right').replace(/<strong>/g, '<span style="font-weight: bold;">').replace(/<\/strong>/g, '</span>')}
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; font-size: 11px; color: #999;">
                <p style="margin: 0;">This is a computer-generated report from Grande. Attendance Management System</p>
                <p style="margin: 5px 0 0 0;">Generated on ${formattedDate} by Avery Libran</p>
                <p style="margin: 5px 0 0 0;">© ${today.getFullYear()} Grande. All rights reserved.</p>
            </div>
        </div>
    `;

    // Configure PDF options
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Grande_${reportType.replace(/\s+/g, '_')}_Report_${today.toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: false
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'landscape' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Show loading message
    const originalText = document.querySelector('.btn-export').innerHTML;
    document.querySelector('.btn-export').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
    document.querySelector('.btn-export').disabled = true;

    // Generate PDF
    html2pdf().set(opt).from(content).save().then(() => {
        // Restore button
        document.querySelector('.btn-export').innerHTML = originalText;
        document.querySelector('.btn-export').disabled = false;
        
        // Add audit entry
        addAuditEntry('report', 'PDF Export', `Exported ${reportType} report to PDF`, 'fa-file-pdf');
    });
}
