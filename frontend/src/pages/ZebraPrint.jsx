import { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function ZebraPrint() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [selectedForPrint, setSelectedForPrint] = useState(new Set());
  const [printing, setPrinting] = useState(false);

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

  const handlePrintSingle = async (id) => {
    setPrinting(true);
    try {
      const zpl = await api.getZPL(id);
      await sendToPrinter(zpl);
    } catch (err) {
      alert(err.message || 'Failed to print');
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintBatch = async () => {
    if (selectedForPrint.size === 0) return;
    setPrinting(true);
    try {
      const ids = Array.from(selectedForPrint);
      const zpl = await api.printBatch(ids);
      await sendToPrinter(zpl);
      setSelectedForPrint(new Set());
    } catch (err) {
      alert(err.message || 'Failed to print batch');
    } finally {
      setPrinting(false);
    }
  };

  const sendToPrinter = async (zpl) => {
    const response = await fetch('http://localhost:3001/api/print-raw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zpl })
    });
    if (!response.ok) {
      throw new Error('Printer not configured. Use browser print or configure print server.');
    }
  };

  const downloadZPL = async (ids) => {
    try {
      let zpl;
      if (ids.length === 1) {
        zpl = await api.getZPL(ids[0]);
      } else {
        zpl = await api.printBatch(ids);
      }
      const blob = new Blob([zpl], { type: 'application/zpl' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `barcodes_${new Date().toISOString().slice(0,10)}.zpl`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to download ZPL');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Zebra ZD230 Print</h2>
          <p className="text-gray-600 dark:text-gray-400">Print Team ID, Team Name & Barcode (25×50mm)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => downloadZPL(Array.from(selectedForPrint))}
            disabled={selectedForPrint.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            📥 Download ZPL ({selectedForPrint.size})
          </button>
          <button
            onClick={handlePrintBatch}
            disabled={selectedForPrint.size === 0 || printing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {printing ? 'Printing...' : `🖨️ Print Selected (${selectedForPrint.size})`}
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Team ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Team Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Barcode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">College</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Print</th>
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
                    <td className="py-3 px-4 text-sm font-mono text-gray-900 dark:text-white">{p.teamId || '—'}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{p.teamName || '—'}</td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400">{p.barcode}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{p.college || '—'}</td>
                    <td className="text-center py-3 px-4">
                      <button
                        onClick={() => handlePrintSingle(p._id)}
                        disabled={printing}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No participants match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Printer Setup</h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          For direct printing to Zebra ZD230, you need a print server (Node.js/RAW socket on port 9100) or use the "Download ZPL" button 
          and send the .zpl file via Zebra Setup Utilities / printer web interface.
        </p>
        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
{`// Example ZPL output (25×50mm label):
^XA
^PW406
^LL200
^FO20,20^A0N,25,25^FDTEAM123^FS
^FO20,55^A0N,25,25^FDTeam Alpha^FS
^FO20,90^BY2
^BCN,50,N,N
^FDHZXABC123^FS
^FO20,160^A0N,20,20^FDJohn Doe^FS
^XZ`}
        </pre>
      </div>
    </div>
  );
}