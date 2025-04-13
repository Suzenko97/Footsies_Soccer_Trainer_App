const express = require('express');
const cors = require('cors');


const app = express();

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Add your API routes here
app.post('/api/login', (req, res) => {
    // Handle login logic
    res.json({ message: 'Login endpoint' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
})