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
  
  if (req.method === 'GET') {
    const total = await Participant.countDocuments();
    const inside = await Participant.countDocuments({ isInside: true });
    const outside = total - inside;
    return res.json({ total, inside, outside });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
};