const http = require('http');

const server = http.createServer((req, res) => {
    res.end("Hospital Backend Running");
});

server.listen(3000, () => {
    console.log("Server started on port 3000");
});