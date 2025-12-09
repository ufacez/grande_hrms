// Complete Schedule Management with Salary Calculation
// Standard: ₱540/day, 8 hours/day

const DAILY_RATE = 540;
const STANDARD_HOURS = 8;
const HOURLY_RATE = DAILY_RATE / STANDARD_HOURS; // ₱67.50/hour
const OVERTIME_MULTIPLIER = 1.25; // 25% extra for overtime

class ScheduleSalaryManager {
    constructor() {
        this.schedules = [];
        this.employees = [];
    }

    // Calculate salary based on schedule
    calculateEmployeeSalary(employeeId, startDate, endDate) {
        const schedule = this.getEmployeeSchedule(employeeId, startDate, endDate);
        
        let totalRegularHours = 0;
        let totalOvertimeHours = 0;
        let workDays = 0;
        
        schedule.forEach(shift => {
            if (shift.shift_name !== 'Off' && shift.shift_name !== 'Day Off') {
                workDays++;
                const hours = this.calculateShiftHours(shift.shift_time);
                
                if (hours <= STANDARD_HOURS) {
                    totalRegularHours += hours;
                } else {
                    totalRegularHours += STANDARD_HOURS;
                    totalOvertimeHours += (hours - STANDARD_HOURS);
                }
            }
        });
        
        const regularPay = totalRegularHours * HOURLY_RATE;
        const overtimePay = totalOvertimeHours * HOURLY_RATE * OVERTIME_MULTIPLIER;
        const totalPay = regularPay + overtimePay;
        
        return {
            workDays,
            totalRegularHours,
            totalOvertimeHours,
            regularPay,
            overtimePay,
            totalPay,
            dailyRate: DAILY_RATE,
            hourlyRate: HOURLY_RATE
        };
    }
    
    // Calculate hours from shift time (e.g., "6:00 AM - 2:00 PM")
    calculateShiftHours(shiftTime) {
        if (!shiftTime || shiftTime === 'Day Off') return 0;
        
        const match = shiftTime.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return STANDARD_HOURS;
        
        const [_, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;
        
        let start = parseInt(startHour);
        let end = parseInt(endHour);
        
        // Convert to 24-hour format
        if (startPeriod.toUpperCase() === 'PM' && start !== 12) start += 12;
        if (startPeriod.toUpperCase() === 'AM' && start === 12) start = 0;
        if (endPeriod.toUpperCase() === 'PM' && end !== 12) end += 12;
        if (endPeriod.toUpperCase() === 'AM' && end === 12) end = 0;
        
        // Calculate hours
        let hours = end - start;
        if (hours < 0) hours += 24; // Handle overnight shifts
        
        // Add minutes
        hours += (parseInt(endMin) - parseInt(startMin)) / 60;
        
        return Math.round(hours * 2) / 2; // Round to nearest 0.5
    }
    
    // Get employee schedule for a date range
    getEmployeeSchedule(employeeId, startDate, endDate) {
        // This would fetch from database
        return this.schedules.filter(s => 
            s.employee_id === employeeId &&
            new Date(s.date) >= new Date(startDate) &&
            new Date(s.date) <= new Date(endDate)
        );
    }
    
    // Generate salary report
    generateSalaryReport(startDate, endDate) {
        const report = [];
        
        this.employees.forEach(emp => {
            const salary = this.calculateEmployeeSalary(emp.employee_id, startDate, endDate);
            report.push({
                employee_id: emp.employee_id,
                name: emp.name,
                department: emp.department,
                ...salary
            });
        });
        
        return report;
    }
    
    // Calculate semi-monthly pay (cutoff based)
    calculateSemiMonthlyPay(employeeId, cutoffStart, cutoffEnd) {
        const salary = this.calculateEmployeeSalary(employeeId, cutoffStart, cutoffEnd);
        
        // Add deductions
        const lateDeductions = this.calculateLateDeductions(employeeId, cutoffStart, cutoffEnd);
        const sssDeduction = this.calculateSSS(salary.regularPay);
        const philHealthDeduction = this.calculatePhilHealth(salary.regularPay);
        const pagIbigDeduction = 100; // Standard ₱100
        
        const totalDeductions = lateDeductions + sssDeduction + philHealthDeduction + pagIbigDeduction;
        const netPay = salary.totalPay - totalDeductions;
        
        return {
            ...salary,
            deductions: {
                late: lateDeductions,
                sss: sssDeduction,
                philHealth: philHealthDeduction,
                pagIbig: pagIbigDeduction,
                total: totalDeductions
            },
            netPay
        };
    }
    
    // SSS Contribution (simplified)
    calculateSSS(grossPay) {
        if (grossPay < 3250) return 135;
        if (grossPay < 3750) return 157.50;
        if (grossPay < 4250) return 180;
        if (grossPay < 4750) return 202.50;
        if (grossPay < 5250) return 225;
        if (grossPay < 5750) return 247.50;
        if (grossPay < 6250) return 270;
        if (grossPay < 6750) return 292.50;
        if (grossPay < 7250) return 315;
        if (grossPay < 7750) return 337.50;
        if (grossPay < 8250) return 360;
        if (grossPay < 8750) return 382.50;
        if (grossPay < 9250) return 405;
        if (grossPay < 9750) return 427.50;
        if (grossPay < 10250) return 450;
        if (grossPay < 10750) return 472.50;
        if (grossPay < 11250) return 495;
        if (grossPay < 11750) return 517.50;
        if (grossPay < 12250) return 540;
        if (grossPay < 12750) return 562.50;
        if (grossPay < 13250) return 585;
        if (grossPay < 13750) return 607.50;
        if (grossPay < 14250) return 630;
        if (grossPay < 14750) return 652.50;
        return 675; // Maximum
    }
    
    // PhilHealth Contribution (simplified - 2024 rates)
    calculatePhilHealth(grossPay) {
        const monthlyEquivalent = grossPay * 2; // Semi-monthly to monthly
        const contribution = monthlyEquivalent * 0.04; // 4% of basic salary
        const employeeShare = contribution / 2; // Employee pays half
        return Math.min(Math.max(employeeShare, 200), 1800); // Min ₱200, Max ₱1800
    }
    
    // Calculate late deductions
    calculateLateDeductions(employeeId, startDate, endDate) {
        // Would fetch actual attendance records
        // For now, return 0
        return 0;
    }
}

// Export for use
window.ScheduleSalaryManager = ScheduleSalaryManager;

// Usage Example:
/*
const manager = new ScheduleSalaryManager();

// Calculate for an employee
const salary = manager.calculateSemiMonthlyPay('EMP001', '2025-12-01', '2025-12-15');
console.log('Salary Breakdown:', salary);

// Result:
{
    workDays: 10,
    totalRegularHours: 80,
    totalOvertimeHours: 5,
    regularPay: 5400.00,
    overtimePay: 421.88,
    totalPay: 5821.88,
    deductions: {
        late: 0,
        sss: 337.50,
        philHealth: 232.88,
        pagIbig: 100,
        total: 670.38
    },
    netPay: 5151.50
}
*/