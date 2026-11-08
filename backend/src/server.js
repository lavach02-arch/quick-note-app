import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5001', 10);

app.listen(PORT, () => {
  console.log(`📝 Quick Note API Server listening at http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - GET    http://localhost:${PORT}/api/notes`);
  console.log(`   - POST   http://localhost:${PORT}/api/notes`);
  console.log(`   - DELETE http://localhost:${PORT}/api/notes/:id`);
  console.log(`   - GET    http://localhost:${PORT}/api/health`);
});
