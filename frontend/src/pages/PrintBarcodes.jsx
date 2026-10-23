import { useEffect, useState, useRef } from 'react';
import { api } from '../utils/api';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

export default function PrintBarcodes() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState(new Set());
  const [previewMode, setPreviewMode] = useState(false);
  const pdfRef = useRef(null);

  useEffect(() => {
    api.getParticipants()
      .then(data => {
        setParticipants(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const colleges = [...new Set(participants.map(p => p.college).filter(Boolean))].sort();
  const teams = [...new Set(participants.map(p => p.teamName).filter(Boolean))].sort();

  const filtered = participants.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search.toUpperCase()) ||
      p.teamName.toLowerCase().includes(search.toLowerCase());
    const matchesCollege = !collegeFilter || p.college === collegeFilter;
    const matchesTeam = !teamFilter || p.teamName === teamFilter;
    return matchesSearch && matchesCollege && matchesTeam;
  });

  const toggleSelect = (id) => {
    setSelectedForPrint(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedForPrint.size === filtered.length) {
      setSelectedForPrint(new Set());
    } else {
      setSelectedForPrint(new Set(filtered.map(p => p._id)));
    }
  };

  const generatePDF = (download = true) => {
    const toPrint = participants.filter(p => selectedForPrint.has(p._id));
    if (toPrint.length === 0) return;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const badgeWidth = 90;
    const badgeHeight = 55;
    const margin = 10;
    const gap = 5;
    let x = margin;
    let y = margin;

    toPrint.forEach((p, i) => {
      if (i > 0 && i % 2 === 0) {
        x = margin;
        y += badgeHeight + gap;
      }
      if (y + badgeHeight > 280) {
        doc.addPage();
        x = margin;
        y = margin;
      }

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(x, y, badgeWidth, badgeHeight);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('HORIZONXT 2026', x + 5, y + 8);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Team: ${p.teamName}`, x + 5, y + 15);
      doc.text(`${p.name}`, x + 5, y + 22);
      doc.text(`${p.college}`, x + 5, y + 29);
      doc.text(`${p.role}`, x + 5, y + 36);

      const canvas = document.createElement('canvas');
      JsBarcode(canvas, p.barcode, { format: 'CODE128', width: 1.5, height: 30, displayValue: true, fontSize: 10 });
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', x + 5, y + 40, 80, 15);

      if (i % 2 === 0) x += badgeWidth + gap;
    });

    if (download) {
      doc.save('horizonxt-barcodes.pdf');
    } else {
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      pdfRef.current = url;
      setPreviewMode(true);
    }
  };

  const renderBadge = (p) => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, p.barcode, { format: 'CODE128', width: 2, height: 40, displayValue: true, fontSize: 12 });
    return canvas.toDataURL('image/png');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Print Barcodes</h2>
          <p className="text-gray-600 dark:text-gray-400">Generate printable badges for participants</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => generatePDF(false)}
            disabled={selectedForPrint.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            👁️ Preview PDF
          </button>
          <button
            onClick={() => generatePDF(true)}
            disabled={selectedForPrint.size === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            🖨️ Download PDF ({selectedForPrint.size})
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, barcode, team..."
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={collegeFilter}
            onChange={e => setCollegeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Colleges</option>
            {colleges.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Teams</option>
            {teams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedForPrint.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Select All ({filtered.length})</span>
          </label>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => {
                const barcodeImg = renderBadge(p);
                const isSelected = selectedForPrint.has(p._id);
                return (
                  <div
                    key={p._id}
                    onClick={() => toggleSelect(p._id)}
                    className={`relative cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                        : ''
                    }`}
                  >
                    <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 aspect-[3/2] flex flex-col items-center justify-between">
                      <div className="text-center w-full">
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">HORIZONXT 2026</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{p.teamName}</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate w-full px-1">{p.name}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 truncate w-full px-1">{p.college}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 truncate w-full px-1">{p.role}</div>
                      </div>
                      <img
                        src={barcodeImg}
                        alt={p.barcode}
                        className="mt-2 max-w-full h-16 object-contain"
                      />
                      <div className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">{p.barcode}</div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">✓</div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-500 dark:text-gray-400">
                  No participants match your filters
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {previewMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setPreviewMode(false); URL.revokeObjectURL(pdfRef.current); }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">PDF Preview - {selectedForPrint.size} Badges</h3>
              <div className="flex gap-2">
                <button onClick={() => generatePDF(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Download</button>
                <button onClick={() => { setPreviewMode(false); URL.revokeObjectURL(pdfRef.current); }} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Close</button>
              </div>
            </div>
            <iframe
              src={pdfRef.current}
              className="flex-1 w-full border-0"
              title="Barcode PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}