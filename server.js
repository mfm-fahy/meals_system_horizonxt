const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const XLSX = require('xlsx');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = (process.env.MONGODB_URI || 'mongodb://localhost:27017') + '/horizonxt';

const participantSchema = new mongoose.Schema({
  registrationId: String,
  teamId: String,
  inviteCode: String,
  teamName: String,
  projectTitle: String,
  selectedChallenge: String,
  college: String,
  department: String,
  yearOfStudy: String,
  name: String,
  email: String,
  phone: String,
  role: String,
  skills: String,
  linkedin: String,
  isLeader: Boolean,
  status: String,
  barcode: { type: String, unique: true },
  isInside: { type: Boolean, default: false },
  lastEntryTime: Date,
  lastExitTime: Date,
  entryExitLogs: [{
    type: { type: String, enum: ['entry', 'exit'] },
    timestamp: { type: Date, default: Date.now },
    method: { type: String, enum: ['barcode', 'manual'] }
  }]
}, { timestamps: true });

const Participant = mongoose.model('Participant', participantSchema);

function generateBarcode() {
  return 'HZX' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

async function importExcelData() {
  try {
    const workbook = XLSX.readFile(path.join(__dirname, '../Downloads/HORIZONXT 2026.xlsx'));
    let totalImported = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      for (const row of data) {
        const members = [
          { prefix: 'Member 1', isLeader: row['Member 1 Is Leader?'] === 'Yes' },
          { prefix: 'Member 2', isLeader: row['Member 2 Is Leader?'] === 'Yes' },
          { prefix: 'Member 3', isLeader: row['Member 3 Is Leader?'] === 'Yes' },
          { prefix: 'Member 4', isLeader: row['Member 4 Is Leader?'] === 'Yes' }
        ];

        for (const member of members) {
          const name = row[`${member.prefix} Name`];
          if (!name || name.toString().trim() === '') continue;

          const email = row[`${member.prefix} Email`] || '';
          const existing = await Participant.findOne({ email: email.toLowerCase().trim() });
          if (existing) continue;

          const participant = new Participant({
            registrationId: row['Registration ID'],
            teamId: row['Team ID'],
            inviteCode: row['Invite Code'],
            teamName: row['Team Name'],
            projectTitle: row['Project Title'],
            selectedChallenge: row['Selected Challenge'],
            college: row['College / University'],
            department: row['Department'],
            yearOfStudy: row['Year of Study'],
            name: name.toString().trim(),
            email: email.toString().trim().toLowerCase(),
            phone: row[`${member.prefix} Phone Number`]?.toString().trim() || '',
            role: row[`${member.prefix} Role / Designation`]?.toString().trim() || '',
            skills: row[`${member.prefix} Skills`]?.toString().trim() || '',
            linkedin: row[`${member.prefix} LinkedIn Profile`]?.toString().trim() || '',
            isLeader: member.isLeader,
            status: row[`${member.prefix} Status`]?.toString().trim() || 'active',
            barcode: generateBarcode()
          });

          await participant.save();
          totalImported++;
        }
      }
    }
    console.log(`Imported ${totalImported} participants`);
  } catch (error) {
    console.error('Import error:', error);
  }
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/import', async (req, res) => {
  await importExcelData();
  res.json({ message: 'Import completed' });
});

app.get('/api/participants', async (req, res) => {
  const participants = await Participant.find().sort({ createdAt: -1 });
  res.json(participants);
});

app.get('/api/participants/overview', async (req, res) => {
  const total = await Participant.countDocuments();
  const inside = await Participant.countDocuments({ isInside: true });
  const outside = total - inside;
  res.json({ total, inside, outside });
});

app.get('/api/participants/:barcode', async (req, res) => {
  const participant = await Participant.findOne({ barcode: req.params.barcode });
  if (!participant) return res.status(404).json({ error: 'Not found' });
  res.json(participant);
});

app.post('/api/participants/:barcode/scan', async (req, res) => {
  const { type } = req.body;
  if (!['entry', 'exit'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const participant = await Participant.findOne({ barcode: req.params.barcode });
  if (!participant) return res.status(404).json({ error: 'Not found' });

  if (type === 'entry' && participant.isInside) {
    return res.status(400).json({ error: 'Already inside' });
  }
  if (type === 'exit' && !participant.isInside) {
    return res.status(400).json({ error: 'Not inside' });
  }

  participant.isInside = type === 'entry';
  if (type === 'entry') participant.lastEntryTime = new Date();
  else participant.lastExitTime = new Date();

  participant.entryExitLogs.push({
    type,
    timestamp: new Date(),
    method: 'barcode'
  });

  await participant.save();
  res.json(participant);
});

app.post('/api/participants/manual', async (req, res) => {
  const { email, type } = req.body;
  if (!email || !['entry', 'exit'].includes(type)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const participant = await Participant.findOne({ email: email.toLowerCase().trim() });
  if (!participant) return res.status(404).json({ error: 'Not found' });

  if (type === 'entry' && participant.isInside) {
    return res.status(400).json({ error: 'Already inside' });
  }
  if (type === 'exit' && !participant.isInside) {
    return res.status(400).json({ error: 'Not inside' });
  }

  participant.isInside = type === 'entry';
  if (type === 'entry') participant.lastEntryTime = new Date();
  else participant.lastExitTime = new Date();

  participant.entryExitLogs.push({
    type,
    timestamp: new Date(),
    method: 'manual'
  });

  await participant.save();
  res.json(participant);
});

app.get('/api/participants/:id/barcode', async (req, res) => {
  const participant = await Participant.findById(req.params.id);
  if (!participant) return res.status(404).json({ error: 'Not found' });
  res.json({ barcode: participant.barcode, name: participant.name });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(3001, () => console.log('Server running on port 3001'));
  })
  .catch(err => console.error('MongoDB connection error:', err));