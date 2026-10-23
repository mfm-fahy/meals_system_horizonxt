import { useState } from 'react';
import { api } from '../utils/api';

export default function ManualEntry() {
  const [email, setEmail] = useState('');
  const [entryType, setEntryType] = useState('entry');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.manualEntry(email.trim(), entryType);
      setResult({ success: true, participant: data, type: entryType });
      setEmail('');
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search.toUpperCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manual Entry</h2>
        <p className="text-gray-600 dark:text-gray-400">Enter participant by email for entry/exit tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Entry Form</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="participant@example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action</label>
              <div className="flex gap-2">
                {['entry', 'exit'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEntryType(type)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      entryType === type
                        ? type === 'entry' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Record ${entryType.charAt(0).toUpperCase() + entryType.slice(1)}`}
            </button>
          </form>

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              {result.success ? (
                <>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    {result.type === 'entry' ? '✅ Entry Recorded' : '✅ Exit Recorded'}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">{result.participant.name}</p>
                  <p className="text-sm text-green-600 dark:text-green-500">{result.participant.email}</p>
                  <p className="text-xs text-green-500 dark:text-green-600 mt-1">{result.participant.teamName}</p>
                </>
              ) : (
                <p className="text-red-800 dark:text-red-300">{result.error}</p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Participants Directory</h3>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or barcode..."
              className="w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Team</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Barcode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.slice(0, 50).map(p => (
                  <tr key={p._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{p.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{p.teamName}</td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400">{p.barcode}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.isInside
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {p.isInside ? '🟢 Inside' : '⚪ Outside'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setEmail(p.email);
                          setEntryType(p.isInside ? 'exit' : 'entry');
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {p.isInside ? 'Exit' : 'Entry'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredParticipants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No participants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {filteredParticipants.length > 50 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                Showing 50 of {filteredParticipants.length} participants
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}