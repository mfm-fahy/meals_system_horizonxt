import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, inside: 0, outside: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOverview()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Participants', value: stats.total, color: 'bg-blue-500', icon: '👥' },
    { label: 'Currently Inside', value: stats.inside, color: 'bg-green-500', icon: '🏢' },
    { label: 'Outside', value: stats.outside, color: 'bg-orange-500', icon: '🚶' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">HorizonXT 2026 Hackathon - Entry/Exit Tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map(card => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {loading ? '—' : card.value}
                </p>
              </div>
              <div className={`w-14 h-14 ${card.color} rounded-xl flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { path: '/scanner', title: 'Scan Barcode', desc: 'Scan entry/exit barcodes', icon: '📷' },
          { path: '/manual', title: 'Manual Entry', desc: 'Enter by email manually', icon: '⌨️' },
          { path: '/participants', title: 'View Participants', desc: 'Manage all participants', icon: '👥' },
          { path: '/print', title: 'Print Barcodes', desc: 'Generate printable badges', icon: '🖨️' },
        ].map(item => (
          <Link key={item.path} to={item.path} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}