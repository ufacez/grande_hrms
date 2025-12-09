// payslip-print.js - Separate print functionality for payslips
// Add this as a new file and include it in your HTML

(function() {
    'use strict';

    // Create print-specific styles
    const printStyles = `
        @media print {
            /* Hide everything on the page */
            body > *:not(#payslipModal) {
                display: none !important;
            }
            
            .dashboard,
            .sidebar,
            .main-content,
            .header,
            .logout-btn,
            nav,
            footer {
                display: none !important;
            }
            
            /* Reset body for clean print */
            body {
                margin: 0;
                padding: 0;
                background: white !important;
            }
            
            /* Position payslip modal for printing */
            #payslipModal {
                display: block !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            #payslipModal .modal-content {
                box-shadow: none !important;
                border: none !important;
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
                background: white !important;
                transform: none !important;
            }
            
            /* Hide modal header and close button */
            #payslipModal .modal-header {
                display: none !important;
            }
            
            /* Hide the print button when printing */
            #payslipModal .print-btn {
                display: none !important;
            }
            
            /* Show only the payslip content */
            .payslip {
                display: block !important;
                visibility: visible !important;
            }
            
            /* Ensure payslip content is visible and well-formatted */
            .payslip {
                width: 100%;
                background: white;
                color: black;
            }
            
            .payslip-header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
            }
            
            .payslip-header h2 {
                color: #333;
                margin: 0;
                font-size: 24px;
            }
            
            .payslip-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
                padding: 15px;
                background: #f9f9f9;
                border: 1px solid #ddd;
            }
            
            .info-group p {
                margin: 5px 0;
                font-size: 12px;
                line-height: 1.6;
            }
            
            .payslip-details {
                margin-top: 20px;
            }
            
            .section-title {
                font-weight: bold;
                font-size: 14px;
                margin: 15px 0 10px 0;
                padding: 8px;
                background: #333;
                color: white;
                text-transform: uppercase;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 10px;
                border-bottom: 1px solid #ddd;
                font-size: 12px;
            }
            
            .detail-row.total {
                font-weight: bold;
                font-size: 16px;
                background: #f0f0f0;
                border: 2px solid #333;
                margin-top: 10px;
                padding: 12px 10px;
            }
            
            /* Remove any background colors that might waste ink */
            * {
                background: white !important;
                color: black !important;
            }
            
            .detail-row.total,
            .section-title {
                background: #f0f0f0 !important;
            }
            
            /* Ensure page breaks appropriately */
            .payslip {
                page-break-inside: avoid;
            }
            
            /* Add company info or footer if needed */
            @page {
                margin: 1cm;
            }
        }
    `;

    // Inject print styles into the document
    function injectPrintStyles() {
        const styleId = 'payslip-print-styles';
        
        // Check if styles already exist
        if (!document.getElementById(styleId)) {
            const styleElement = document.createElement('style');
            styleElement.id = styleId;
            styleElement.textContent = printStyles;
            document.head.appendChild(styleElement);
        }
    }

    // Enhanced print function
    window.printPayslip = function(employeeId) {
        // Inject print styles if not already done
        injectPrintStyles();
        
        // Optional: Add a slight delay to ensure modal is fully rendered
        setTimeout(() => {
            window.print();
        }, 100);
    };

    // Override the print button's onclick in generated payslips
    window.enhancePrintButton = function() {
        const printButtons = document.querySelectorAll('.print-btn');
        printButtons.forEach(btn => {
            // Remove existing onclick
            btn.removeAttribute('onclick');
            
            // Add new event listener
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                injectPrintStyles();
                setTimeout(() => window.print(), 100);
            });
        });
    };

    // Auto-enhance print buttons when payslip modal content changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                window.enhancePrintButton();
            }
        });
    });

    // Start observing when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const payslipContent = document.getElementById('payslipContent');
        if (payslipContent) {
            observer.observe(payslipContent, {
                childList: true,
                subtree: true
            });
        }
        
        // Inject styles immediately
        injectPrintStyles();
    });

    // Also inject styles immediately if script loads after DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectPrintStyles);
    } else {
        injectPrintStyles();
    }

})();