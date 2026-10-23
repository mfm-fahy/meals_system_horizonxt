const mongoose = require('mongoose');

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

let Participant;
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  Participant = mongoose.models.Participant || mongoose.model('Participant', participantSchema);
}

module.exports = async (req, res) => {
  await connectDB();
  
  const { barcode } = req.query;
  
  if (req.method === 'GET') {
    const participant = await Participant.findOne({ barcode });
    if (!participant) return res.status(404).json({ error: 'Not found' });
    return res.json(participant);
  }
  
  if (req.method === 'POST') {
    const { type } = req.body;
    if (!['entry', 'exit'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const participant = await Participant.findOne({ barcode });
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
    return res.json(participant);
  }
  
  res.status(405).json({ error: 'Method not allowed' });
};