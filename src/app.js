const express = require('express');
const app = express();
const db = require('./config/db');
const doctorRoutes = require('./routes/doctorRoutes');


app.use(express.json());

app.get('/', (req, res) => {
    res.send("Hospital API Running");
});
app.use('/api/doctors', doctorRoutes);

app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1");
        res.json({ message: "Database Connected", rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;