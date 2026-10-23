import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

export default function Participants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState(new Set());

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

  const generatePDF = () => {
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

    doc.save('horizonxt-barcodes.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Participants</h2>
          <p className="text-gray-600 dark:text-gray-400">{participants.length} total participants</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generatePDF}
            disabled={selectedForPrint.size === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            🖨️ Print Selected ({selectedForPrint.size})
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="w-12 text-center py-3 px-4"></th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Team</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">College</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Barcode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Leader</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="text-center py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedForPrint.has(p._id)}
                        onChange={() => toggleSelect(p._id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{p.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{p.teamName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{p.college}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{p.role}</td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400">{p.barcode}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.isInside
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {p.isInside ? 'Inside' : 'Outside'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.isLeader && <span className="text-yellow-600 dark:text-yellow-400">⭐</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No participants match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}