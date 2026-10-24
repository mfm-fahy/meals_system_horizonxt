import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import ManualEntry from './pages/ManualEntry';
import Participants from './pages/Participants';
import PrintBarcodes from './pages/PrintBarcodes';
import Meals from './pages/Meals';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="manual" element={<ManualEntry />} />
            <Route path="participants" element={<Participants />} />
            <Route path="print" element={<PrintBarcodes />} />
            <Route path="meals" element={<Meals />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;