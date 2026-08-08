import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertTriangle, FileText, Loader2, Download } from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../../shared/utils/axios'; // Correct relative path

const BulkEmployeeImport = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [errors, setErrors] = useState([]); // File level errors
    const [rowErrors, setRowErrors] = useState({}); // Row index -> error message
    const [uploading, setUploading] = useState(false);
    const [step, setStep] = useState('upload'); // 'upload', 'preview', 'result'
    const [results, setResults] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                validateData(results.data);
            },
            error: (err) => {
                setErrors(["Failed to parse CSV: " + err.message]);
            }
        });
    };

    const validateData = (data) => {
        const errors = {};
        const validRows = [];

        if (data.length === 0) {
            setErrors(["File is empty"]);
            return;
        }

        // Check columns
        const requiredCols = ['name', 'email', 'role', 'password'];
        const headers = Object.keys(data[0]).map(h => h.trim().toLowerCase());
        const missing = requiredCols.filter(col => !headers.includes(col));

        if (missing.length > 0) {
            setErrors([`Missing required columns: ${missing.join(', ')}`]);
            return;
        }

        data.forEach((row, index) => {
            if (!row.email || !row.name || !row.role || !row.password) {
                errors[index] = "Missing required fields";
            } else if (!/\S+@\S+\.\S+/.test(row.email)) {
                errors[index] = "Invalid email format";
            }
            validRows.push(row);
        });

        setRowErrors(errors);
        setPreviewData(validRows);
        setStep('preview');
        setErrors([]);
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            // Filter out rows with local validation errors before sending?
            // Or send everything and let backend reject duplicates?
            // Sending only valid format rows.
            const rowsToSend = previewData.filter((_, idx) => !rowErrors[idx]);

            if (rowsToSend.length === 0) {
                setErrors(["No valid data to upload"]);
                setUploading(false);
                return;
            }

            const res = await axios.post('/employees/bulk', rowsToSend);
            setResults(res.data);
            setStep('result');
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error(error);
            setErrors([error.response?.data?.error || "Upload failed"]);
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const csv = "name,email,role,password,department,phone\nJohn Doe,john@cookscape.com,EMPLOYEE,SecurePass123,Installation,9876543210\nJane Smith,jane@cookscape.com,CLIENT_RELATIONSHIP_EXECUTIVE,SecurePass123,Sales,9876543211";
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employee_import_template.csv';
        a.click();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Bulk Import Employees</h2>
                        <p className="text-xs text-slate-500 mt-1">Add multiple users via CSV file</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'upload' && (
                        <div className="space-y-6 text-center py-8">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-2xl p-12 cursor-pointer transition-all group"
                            >
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                </div>
                                <h3 className="font-semibold text-slate-700">Click to upload CSV</h3>
                                <p className="text-sm text-slate-500 mt-2">or drag and drop file here</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    className="hidden"
                                />
                            </div>

                            <button onClick={downloadTemplate} className="text-sm text-blue-600 font-medium hover:underline flex items-center justify-center gap-2">
                                <Download size={14} /> Download CSV Template
                            </button>

                            {errors.length > 0 && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 text-left">
                                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Error</p>
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
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-700">Preview Data ({previewData.length} rows)</h3>
                                <button onClick={() => setStep('upload')} className="text-xs text-slate-500 hover:text-slate-700">Change File</button>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Email</th>
                                            <th className="px-4 py-3">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {previewData.map((row, idx) => {
                                            const error = rowErrors[idx];
                                            return (
                                                <tr key={idx} className={error ? "bg-red-50/50" : "hover:bg-slate-50"}>
                                                    <td className="px-4 py-3">
                                                        {error ? (
                                                            <span className="text-red-500 flex items-center gap-1 text-xs font-bold"><X size={14} /> Invalid</span>
                                                        ) : (
                                                            <span className="text-green-500 flex items-center gap-1 text-xs font-bold"><Check size={14} /> Valid</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-slate-700">{row.name}</td>
                                                    <td className="px-4 py-3 text-slate-500">{row.email}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{row.role}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {errors.length > 0 && (
                                <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                    {errors[0]}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'result' && results && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Import Complete!</h3>

                            <div className="grid grid-cols-3 gap-4 mt-8 mb-8">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <div className="text-2xl font-bold text-green-600">{results.added}</div>
                                    <div className="text-xs text-green-700 font-medium uppercase tracking-wider">Added</div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <div className="text-2xl font-bold text-orange-600">{results.skipped}</div>
                                    <div className="text-xs text-orange-700 font-medium uppercase tracking-wider">Skipped</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
                                    <div className="text-xs text-red-700 font-medium uppercase tracking-wider">Errors</div>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="text-left bg-red-50 p-4 rounded-xl max-h-40 overflow-y-auto">
                                    <h4 className="font-bold text-red-700 text-sm mb-2">Error Log:</h4>
                                    <ul className="space-y-1 text-xs text-red-600">
                                        {results.errors.map((e, i) => <li key={i}>• {e}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    {step === 'result' ? (
                        <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
                            Close
                        </button>
                    ) : (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">
                                Cancel
                            </button>
                            {step === 'preview' && (
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                                >
                                    {uploading && <Loader2 className="animate-spin" size={16} />}
                                    {uploading ? 'Importing...' : 'Confirm Import'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default BulkEmployeeImport;
