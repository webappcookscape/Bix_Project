export const downloadCsv = (filename, rows, headerMap = null) => {
  if (!rows || rows.length === 0) {
    alert("No data to export");
    return;
  }

  // Determine headers based on map or first row
  const dataKeys = headerMap ? Object.keys(headerMap) : Object.keys(rows[0]);
  const displayHeaders = headerMap ? Object.values(headerMap) : dataKeys;

  const escapeCell = (cell) => {
    if (cell == null) return "";
    const str = String(cell).replace(/"/g, '""');
    if (str.search(/("|,|\n)/g) >= 0) {
      return `"${str}"`;
    }
    return str;
  };

  const csvLines = [
    displayHeaders.map(h => escapeCell(h)).join(","),
    ...rows.map((row) => dataKeys.map((k) => escapeCell(row[k])).join(",")),
  ];

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
