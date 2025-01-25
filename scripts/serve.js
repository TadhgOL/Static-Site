const express = require('express');
const path = require('path');
const app = express();

// Serve static files from dist directory
app.use(express.static('dist'));

// Handle blog routes
app.get('/blog/:post', (req, res) => {
    res.sendFile(path.join(__dirname, `../dist/blog/${req.params.post}.html`));
});

app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/blog/index.html'));
});

// Handle other routes
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, `../dist/${page}.html`);
    res.sendFile(filePath);
});

// Serve index.html as fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 