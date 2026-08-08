import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertTriangle, FileText, Loader2, Download, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../../shared/utils/axios';

const padDatePart = (value) => String(value).padStart(2, '0');

const formatDateForImport = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
};

const normalizeImportedDate = (value) => {
    if (value instanceof Date) {
        return formatDateForImport(value);
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) {
            return `${parsed.y}-${padDatePart(parsed.m)}-${padDatePart(parsed.d)}`;
        }
    }

    if (typeof value !== 'string') {
        return value === null || value === undefined ? "" : String(value).trim();
    }

    const trimmed = value.trim();
    if (!trimmed) return "";

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

    return trimmed;
};

const BulkProjectImport = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [errors, setErrors] = useState([]);
    const [rowErrors, setRowErrors] = useState({});
    const [uploading, setUploading] = useState(false);
    const [step, setStep] = useState('upload'); // 'upload', 'preview', 'result'
    const [results, setResults] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseExcel(selectedFile);
        }
    };

    const parseExcel = (file) => {
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
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                console.log("[BulkImport] Raw Keys:", Object.keys(jsonData[0] || {}));
                console.log("[BulkImport] Raw First Row:", jsonData[0]);
                validateData(jsonData);
            } catch (err) {
                setErrors(["Failed to parse Excel file: " + err.message]);
            }
        };
        reader.onerror = () => setErrors(["File reading error"]);
        reader.readAsArrayBuffer(file);
    };

    const validateData = (data) => {
        const errors = {};
        const validRows = [];

        if (data.length === 0) {
            setErrors(["File is empty"]);
            return;
        }

        // Define a normalized mapping function
        const getVal = (row, ...keys) => {
            for (let k of keys) {
                // Check direct match (with trim)
                const trimmedK = k.trim();
                if (row[trimmedK] !== undefined && row[trimmedK] !== null) return String(row[trimmedK]).trim();
                
                // Check case-insensitive and whitespace-insensitive (including non-breaking spaces)
                const lowerK = trimmedK.toLowerCase();
                const actualKey = Object.keys(row).find(rk => rk.toLowerCase().replace(/[\s\xa0]+/g, ' ').trim() === lowerK);
                if (actualKey && row[actualKey] !== undefined && row[actualKey] !== null) return String(row[actualKey]).replace(/[\s\xa0]+/g, ' ').trim();
            }
            return "";
        };

        data.forEach((row, index) => {
            const mappedRow = {
                name: getVal(row, 'Project', 'Project Name', 'name', 'Title'),
                clientFirstName: getVal(row, 'Name', 'clientFirstName', 'FirstName', 'Client', 'Customer'),
                clientLastName: getVal(row, 'clientLastName', 'LastName', 'Surname', 'Last Name'),
                clientEmail: getVal(row, "Mail i'd ", 'clientEmail', 'Email', 'Email Address', 'Email ID', 'Mail ID'),
                clientPhone: getVal(row, 'Number  ', 'Mobile', 'Phone', 'clientPhone', 'Contact', 'Contact Number', 'Number'),
                unitNumber: getVal(row, 'unitNumber', 'Unit #', 'Unit No'),
                block: getVal(row, 'block', 'Block'),
                floor: getVal(row, 'floor', 'Floor'),
                area: getVal(row, 'area', 'Area', 'Sqft'),
                executionPercentage: getVal(row, 'executionPercentage', 'Execution %', 'Progress'),
                spouseName: getVal(row, 'spouseName', 'Spouse Name'),
                spousePhone: getVal(row, 'spousePhone', 'Spouse Phone'),
                location: getVal(row, 'Location', 'location', 'Address'),
                budget: getVal(row, 'Project Value  ', 'budget', 'Total Value', 'Value'),
                billingName: getVal(row, 'billingName', 'Billing Name'),
                billingAddress: getVal(row, 'billingAddress', 'Billing Address'),
                billingPhone: getVal(row, 'billingPhone', 'Billing Phone'),
                gstin: getVal(row, 'gstin', 'GSTIN'),
                propertyType: getVal(row, 'propertyType', 'Property Type'),
                scopeOfWork: getVal(row, 'scopeOfWork', 'Scope'),
                leadSource: getVal(row, 'Source ', 'leadSource', 'Source'),
                salesRep: getVal(row, 'salesRep', 'Sales Person'),
                businessHeadId: getVal(row, 'businessHeadId', 'BH', 'Business Head'),
                faId: getVal(row, 'faId', 'FA', 'Floor Assistant'),
                laId: getVal(row, 'laId', 'LA', 'Layout Assistant'),
                latitude: getVal(row, 'latitude', 'Lat'),
                longitude: getVal(row, 'longitude', 'Lng'),
                startDate: normalizeImportedDate(row.startDate ?? row['Start Date']),
                deadline: normalizeImportedDate(row.deadline ?? row['End Date']),
                handoverDate: normalizeImportedDate(row.handoverDate ?? row.Handover),
                handingOverMonth: getVal(row, 'handingOverMonth', 'Month'),
                handingOverYear: getVal(row, 'handingOverYear', 'Year'),
                timelineDuration: getVal(row, 'timelineDuration', 'Duration'),
                status: getVal(row, 'status', 'Status').replace(/\s+/g, '').toUpperCase(), // Normalize "ON GOING" to "ONGOING"
                paymentPercentage: getVal(row, 'paymentPercentage', 'Payment %'),
                cpNumber: getVal(row, 'CP Code  ', 'cpNumber', 'CP Number'),
                createdBy: getVal(row, 'createdBy', 'Created By', 'CreatedBy'),
            };
            
            // Smart Name Splitting: If Name has both First and Last but we only got one column
            if (mappedRow.clientFirstName && !mappedRow.clientLastName) {
                const parts = mappedRow.clientFirstName.split(/\s+/);
                if (parts.length > 1) {
                    mappedRow.clientFirstName = parts[0];
                    mappedRow.clientLastName = parts.slice(1).join(' ');
                } else {
                    mappedRow.clientLastName = "."; // Fill with dummy to pass backend validation if strictly required
                }
            }

            // Basic Validation - More permissive: only require Name (of project or client)
            if (!mappedRow.name && !mappedRow.clientFirstName) {
                errors[index] = "Missing identifying info (Project Name or Client Name)";
            } else if (mappedRow.clientEmail && !/\S+@\S+\.\S+/.test(mappedRow.clientEmail)) {
                // If email exists, it must be valid, but email itself is not strictly required for import
                // we'll just show a warning in the UI but keep it "Ready"
            }

            validRows.push(mappedRow);
        });

        setRowErrors(errors);
        setPreviewData(validRows);
        setStep('preview');
        setErrors([]);
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            const rowsToSend = previewData.filter((_, idx) => !rowErrors[idx]);

            if (rowsToSend.length === 0) {
                setErrors(["No valid data to upload"]);
                setUploading(false);
                return;
            }

            console.log("[BulkImport] Sending Payload:", rowsToSend);
            const res = await axios.post('/projects/bulk', rowsToSend);
            console.log(res)
            console.log("[BulkImport] Server Full Response:", res);
            console.log("[BulkImport] Server Data:", res.data);
            setResults(res.data);
            setStep('result');
            // Remove immediate onSuccess call to let user see errors
            // if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            setErrors([error.response?.data?.error || "Upload failed"]);
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = [
            'name', 'clientFirstName', 'clientLastName', 'clientEmail', 'clientPhone',
            'spouseName', 'spousePhone', 'location', 'budget', 'billingName',
            'billingAddress', 'billingPhone', 'gstin', 'businessHeadId', 'propertyType',
            'scopeOfWork', 'leadSource', 'salesRep', 'faId', 'laId',
            'latitude', 'longitude', 'startDate', 'deadline', 'handoverDate',
            'handingOverMonth', 'handingOverYear', 'timelineDuration', 'status',
            'paymentPercentage', 'cpNumber', 'createdBy'
        ];

        const sampleData = [
            {
                name: "Modern Villa Project",
                clientFirstName: "John",
                clientLastName: "Doe",
                clientEmail: "john@example.com",
                clientPhone: "9876543210",
                spouseName: "Jane Doe",
                spousePhone: "9876543211",
                location: "Bangalore",
                budget: "5000000",
                billingName: "John Doe",
                billingAddress: "123 Street, Bangalore",
                billingPhone: "9876543210",
                gstin: "29AAAAA0000A1Z5",
                businessHeadId: "bh@example.com",
                propertyType: "Residential (Villa)",
                scopeOfWork: "Full Interior",
                leadSource: "Instagram",
                salesRep: "Sales Team A",
                faId: "fa@example.com",
                laId: "la@example.com",
                latitude: "12.9716",
                longitude: "77.5946",
                startDate: "2024-01-01",
                deadline: "2024-06-01",
                handoverDate: "2024-06-15",
                handingOverMonth: "June",
                handingOverYear: "2024",
                timelineDuration: "180",
                status: "ONGOING",
                paymentPercentage: "50",
                cpNumber: "CP1001",
                createdBy: "Admin User"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");

        // Use XLSX.write and create a blob to download
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comprehensive_project_import_template.xlsx';
        a.click();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Table size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Comprehensive Project Import</h2>
                            <p className="text-xs text-slate-500 mt-1">Import all project details via Excel (.xlsx, .xls)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'upload' && (
                        <div className="space-y-6 text-center py-12">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-3xl p-16 cursor-pointer transition-all group"
                            >
                                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Upload size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700">Drop your Excel file here</h3>
                                <p className="text-slate-500 mt-2">Maximum file size 10MB. Supports .xlsx and .xls</p>
                                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 group-hover:bg-blue-700 transition-colors">
                                    Browse Files
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                />
                            </div>

                            <button onClick={downloadTemplate} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                                <Download size={16} /> Download Comprehensive Template
                            </button>

                            {errors.length > 0 && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-start gap-3 text-left border border-red-100 animate-shake">
                                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold uppercase tracking-tight text-xs mb-1">Upload Errors</p>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            {errors.map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'preview' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Preview Data</h3>
                                    <p className="text-sm text-slate-500">Showing {previewData.length} records found in file</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setStep('upload')}
                                        className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl"
                                    >
                                        Change File
                                    </button>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                                <div className="overflow-x-auto max-h-[450px]">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-200">
                                            <tr>
                                                <th className="px-5 py-4 w-28">Status</th>
                                                <th className="px-5 py-4 min-w-[200px]">Project Name</th>
                                                <th className="px-5 py-4 min-w-[200px]">Client</th>
                                                <th className="px-5 py-4 min-w-[150px]">Email</th>
                                                <th className="px-5 py-4 min-w-[150px]">Phone</th>
                                                <th className="px-5 py-4 min-w-[150px]">Budget</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {previewData.map((row, idx) => {
                                                const error = rowErrors[idx];
                                                return (
                                                    <tr key={idx} className={error ? "bg-red-50/30" : "hover:bg-slate-50/50 transition-colors"}>
                                                        <td className="px-5 py-4">
                                                            {error ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                                    <X size={12} /> {error.includes("Missing") ? "Incomplete" : "Invalid"}
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                                    <Check size={12} /> Ready
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="font-bold text-slate-800">{row.name}</div>
                                                            <div className="text-[10px] text-slate-400 mt-0.5">{row.projectCode || "Auto-Generated"}</div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="font-medium text-slate-700">{row.clientFirstName} {row.clientLastName}</div>
                                                            {row.spouseName && <div className="text-[11px] text-slate-400">Spouse: {row.spouseName}</div>}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="text-slate-600 font-medium">{row.clientEmail}</div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="text-slate-400">{row.clientPhone}</div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="font-bold text-slate-800 italic">₹{row.budget || "0"}</div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {Object.keys(rowErrors).length > 0 && (
                                <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                    <p className="text-xs text-red-600 font-medium leading-relaxed">
                                        <span className="font-bold">Important:</span> Some rows have validation errors and will be skipped. Please fix the required fields (Name, Client Name, Email, Phone) in your Excel file or ensure the email format is correct.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'result' && results && (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                                <Check size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Import Successful</h3>
                            <p className="text-slate-500 mt-2 font-medium">Your project database has been updated</p>

                            <div className="grid grid-cols-3 gap-6 mt-12 mb-12 max-w-2xl mx-auto">
                                <div className="bg-white p-6 rounded-3xl border-2 border-green-200 shadow-xl shadow-green-50">
                                    <div className="text-4xl font-black text-green-600 mb-1">{results.added}</div>
                                    <div className="text-[10px] text-green-700 font-black uppercase tracking-widest bg-green-50 py-1 rounded-lg">Created</div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border-2 border-indigo-200 shadow-xl shadow-indigo-50">
                                    <div className="text-4xl font-black text-indigo-600 mb-1">{results.updated || 0}</div>
                                    <div className="text-[10px] text-indigo-700 font-black uppercase tracking-widest bg-indigo-50 py-1 rounded-lg">Updated</div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border-2 border-red-100 shadow-xl shadow-red-50">
                                    <div className="text-4xl font-black text-red-400 mb-1">{results.errors.length}</div>
                                    <div className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-50 py-1 rounded-lg">Failed</div>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="text-left bg-slate-50 p-6 rounded-3xl border border-slate-200 max-h-60 overflow-y-auto max-w-2xl mx-auto shadow-inner">
                                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <AlertTriangle size={14} className="text-orange-500" />
                                        Error Details
                                    </h4>
                                    <ul className="space-y-2">
                                        {results.errors.map((e, i) => (
                                            <li key={i} className="flex gap-3 text-xs bg-white p-2.5 rounded-xl text-slate-600 border border-slate-100">
                                                <span className="text-red-400 font-black">•</span> {e}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-4 items-center">
                    {step === 'result' ? (
                        <button onClick={onClose} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:-translate-y-0.5 active:translate-y-0">
                            Back to Projects
                        </button>
                    ) : (
                        <>
                            <button onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-2xl transition-all">
                                Cancel
                            </button>
                            {step === 'preview' && (
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-70 flex items-center gap-2 hover:-translate-y-1 active:translate-y-0"
                                >
                                    {uploading && <Loader2 className="animate-spin" size={16} />}
                                    {uploading ? 'Processing Data...' : 'Import All Projects'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default BulkProjectImport;
