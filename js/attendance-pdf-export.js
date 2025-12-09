// PDF Export function
function exportToPDF() {
    // Create a formatted date for the report
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Create the content for PDF
    const content = document.createElement('div');
    content.innerHTML = `
        <div style="padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #333;">Grande.</h1>
                <h2 style="margin: 10px 0; color: #666;">Attendance Report</h2>
                <p style="margin: 0; color: #666;">${formattedDate}</p>
            </div>

            <div style="margin-bottom: 30px;">
                <h3 style="color: #333; margin-bottom: 10px;">Attendance Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <h4 style="margin: 0; color: #28a745;">Present</h4>
                        <p style="margin: 5px 0 0 0; font-size: 20px;">${document.getElementById('presentCount').textContent}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <h4 style="margin: 0; color: #dc3545;">Absent</h4>
                        <p style="margin: 5px 0 0 0; font-size: 20px;">${document.getElementById('absentCount').textContent}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <h4 style="margin: 0; color: #ffc107;">Late</h4>
                        <p style="margin: 5px 0 0 0; font-size: 20px;">${document.getElementById('lateCount').textContent}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
                        <h4 style="margin: 0; color: #17a2b8;">On Leave</h4>
                        <p style="margin: 5px 0 0 0; font-size: 20px;">${document.getElementById('leaveCount').textContent}</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 style="color: #333; margin-bottom: 10px;">Detailed Records</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Employee ID</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Name</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Date</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Time In</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Time Out</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Status</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attendanceRecords.map(record => `
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${record.employeeId}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${record.employeeName}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${formatDate(record.date)}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${record.timeIn}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${record.timeOut}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                    <span style="
                                        padding: 5px 10px;
                                        border-radius: 15px;
                                        font-size: 12px;
                                        background-color: ${
                                            record.status === 'Present' ? '#d4edda' :
                                            record.status === 'Late' ? '#fff3cd' :
                                            record.status === 'Absent' ? '#f8d7da' : '#d1ecf1'
                                        };
                                        color: ${
                                            record.status === 'Present' ? '#28a745' :
                                            record.status === 'Late' ? '#ffc107' :
                                            record.status === 'Absent' ? '#dc3545' : '#17a2b8'
                                        };"
                                    >${record.status}</span>
                                </td>
                                <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${calculateHoursWorked(record.timeIn, record.timeOut)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 30px; text-align: right; font-size: 12px; color: #666;">
                <p>Generated on ${formattedDate}</p>
                <p>Grande. Attendance Management System</p>
            </div>
        </div>
    `;

    // Configure PDF options
    const opt = {
        margin: 1,
        filename: `attendance_report_${today.toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'landscape' }
    };

    // Generate PDF
    html2pdf().set(opt).from(content).save();
}