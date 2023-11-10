const express = require('express');
const path = require('path');
const app = express();
const port = 9000;

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use(express.json());

/*
// 404
app.use(function(req, res, next){
    res.status(404);
    res.sendFile(path.join(__dirname, '../frontend/dist/404.html'));
});
*/

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
