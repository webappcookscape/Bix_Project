import * as XLSX from 'xlsx';

const padDatePart = (value) => String(value).padStart(2, '0');

const formatDateForApi = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
};

const normalizeExcelDateValue = (value) => {
    if (value instanceof Date) {
        return formatDateForApi(value) || value;
    }

    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();
    if (!trimmed) return value;

    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
        const [, day, month, year] = slashMatch;
        return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
    }

    const dashMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dashMatch) {
        const [, year, month, day] = dashMatch;
        return `${year}-${padDatePart(month)}-${padDatePart(day)}`;
    }

    return value;
};

const normalizeExcelRow = (row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, normalizeExcelDateValue(value)])
);

/**
 * Exports data to an Excel file
 * @param {Array} data - Array of objects to export
 * @param {String} fileName - Name of the file (without extension)
 * @param {Array} headers - Optional array of custom header labels
 */
export const exportToExcel = (data, fileName = 'export', headers = null) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    if (headers) {
        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
};

/**
 * Reads an Excel file and returns JSON data
 * @param {File} file - The uploaded file object
 * @returns {Promise<Array>} - Resolves with an array of objects
 */
export const readExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { 
                    type: 'array',
                    cellDates: true,
                    cellNF: false,
                    cellText: false
                });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false,
                    dateNF: 'yyyy-mm-dd' // Standardize date format for backend
                });
                resolve(json.map(normalizeExcelRow));
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

import ExcelJS from 'exceljs';

/**
 * Downloads a sample Excel template for data import with dropdown menus
 * @param {String} type - 'walkin', 'workreport', or 'monthly'
 * @param {Object} options - { bhs: Array of names, showrooms: Array of strings }
 */
export const downloadTemplate = async (type, options = {}) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');
    
    let headers = [];
    let sampleData = {};
    let fileName = '';
    
    // Default options
    const showrooms = options.showrooms || ['MTRS', 'OMR', 'PORUR', 'COIMBATORE'];
    const bhs = options.bhs && options.bhs.length > 0 ? options.bhs : ['Leo Jenison', 'Sanghatamizh', 'Rajkumar', 'Pugazh', 'Shanmugham'];
    const statuses = ['Y', 'N'];
    const walkinStatuses = ['ACTIVE', 'IN PROGRESS', 'COMPLETED'];

    switch (type) {
        case 'walkin':
            headers = [
                { header: 'clientName', key: 'clientName', width: 20 },
                { header: 'contactNumber', key: 'contactNumber', width: 15 },
                { header: 'project', key: 'project', width: 20 },
                { header: 'showroom', key: 'showroom', width: 15 },
                { header: 'bhName', key: 'bhName', width: 20 },
                { header: 'status', key: 'status', width: 15 },
                { header: 'dateOfVisit', key: 'dateOfVisit', width: 15 },
                { header: 'inTime', key: 'inTime', width: 10 },
                { header: 'outTime', key: 'outTime', width: 10 },
                { header: 'remarks', key: 'remarks', width: 30 }
            ];
            sampleData = {
                clientName: 'Rahul Sharma',
                contactNumber: '9876543210',
                project: 'Villas',
                showroom: 'MTRS',
                bhName: bhs[0],
                status: 'IN PROGRESS',
                dateOfVisit: '01/04/2026',
                inTime: '10:00',
                outTime: '11:30',
                remarks: 'Walk-in for modular kitchen'
            };
            fileName = 'walkin_template.xlsx';
            break;
            
        case 'workreport':
            headers = [
                { header: 'date', key: 'date', width: 15 },
                { header: 'clientName', key: 'clientName', width: 20 },
                { header: 'contact', key: 'contact', width: 15 },
                { header: 'showroom', key: 'showroom', width: 15 },
                { header: 'bhName', key: 'bhName', width: 20 },
                { header: 'status', key: 'status', width: 10 },
                { header: 'site', key: 'site', width: 20 },
                { header: 'star', key: 'star', width: 8 },
                { header: 'remarks', key: 'remarks', width: 30 }
            ];
            sampleData = {
                date: '01/04/2026',
                clientName: 'Anjali Gupta',
                contact: '8765432109',
                showroom: 'MTRS',
                bhName: bhs[0],
                status: 'Y',
                site: 'MG Road',
                star: 5,
                remarks: 'Client interested in wardrobes'
            };
            fileName = 'workreport_template.xlsx';
            break;
            
        case 'monthly':
            headers = [
                { header: 'month', key: 'month', width: 10 },
                { header: 'year', key: 'year', width: 10 },
                { header: 'calls', key: 'calls', width: 10 },
                { header: 'srv', key: 'srv', width: 10 },
                { header: 'proposals', key: 'proposals', width: 10 },
                { header: 'orders', key: 'orders', width: 10 },
                { header: 'value', key: 'value', width: 10 }
            ];
            sampleData = {
                month: 4,
                year: 2026,
                calls: 150,
                srv: 45,
                proposals: 20,
                orders: 12,
                value: 45.5
            };
            fileName = 'monthly_performance_template.xlsx';
            break;
    }

    worksheet.columns = headers;
    worksheet.addRow(sampleData);

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' }
    };

    // Add a hidden sheet for dropdown lists to avoid character limits in formulae
    const listsSheet = workbook.addWorksheet('Lists');
    listsSheet.state = 'hidden';

    // Populate Lists sheet
    showrooms.forEach((val, index) => {
        listsSheet.getCell(`A${index + 1}`).value = val;
    });
    bhs.forEach((val, index) => {
        listsSheet.getCell(`B${index + 1}`).value = val;
    });
    walkinStatuses.forEach((val, index) => {
        listsSheet.getCell(`C${index + 1}`).value = val;
    });
    statuses.forEach((val, index) => {
        listsSheet.getCell(`D${index + 1}`).value = val;
    });

    // Add Data Validations (Dropdowns) using ranges from the Lists sheet
    if (type === 'walkin' || type === 'workreport') {
        const rowCount = 100; // Apply to first 100 rows
        
        for (let i = 2; i <= rowCount; i++) {
            // Showroom Dropdown (Column D in both)
            worksheet.getCell(`D${i}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`Lists!$A$1:$A$${showrooms.length}`],
                showErrorMessage: true,
                errorTitle: 'Invalid Showroom',
                error: 'Please select a showroom from the list'
            };

            if (type === 'walkin') {
                // BH Name Dropdown (Column E for Walkin)
                worksheet.getCell(`E${i}`).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: [`Lists!$B$1:$B$${bhs.length}`],
                    showErrorMessage: true,
                    errorTitle: 'Invalid BH Name',
                    error: 'Please select a Business Head from the list'
                };

                // Status Dropdown (Column F for Walkin)
                worksheet.getCell(`F${i}`).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: [`Lists!$C$1:$C$${walkinStatuses.length}`],
                    showErrorMessage: true,
                    errorTitle: 'Invalid Status',
                    error: 'Please select ACTIVE, IN PROGRESS, or COMPLETED'
                };
            }

            if (type === 'workreport') {
                // BH Name Dropdown (Column E for WorkReport)
                worksheet.getCell(`E${i}`).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: [`Lists!$B$1:$B$${bhs.length}`],
                    showErrorMessage: true,
                    errorTitle: 'Invalid BH Name',
                    error: 'Please select a Business Head from the list'
                };
                
                // Status Dropdown (Column F for WorkReport)
                worksheet.getCell(`F${i}`).dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: [`Lists!$D$1:$D$${statuses.length}`],
                    showErrorMessage: true,
                    errorTitle: 'Invalid Status',
                    error: 'Please select Y or N'
                };

                // Quality Rating (Column H for WorkReport)
                worksheet.getCell(`H${i}`).dataValidation = {
                    type: 'whole',
                    operator: 'between',
                    allowBlank: true,
                    showInputMessage: true,
                    formulae: [1, 10],
                    promptTitle: 'Rating',
                    prompt: 'Enter a value between 1 and 10',
                    errorTitle: 'Invalid Rating',
                    error: 'Rating must be between 1 and 10'
                };
            }
        }
    }

    // Write to buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
};
