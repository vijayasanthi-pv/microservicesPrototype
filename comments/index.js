const express  = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors'); //'Cors' enables communication between cross domains which is restricted by browser by default
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

app.get('/posts/:id/comments', async (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
    const commentId = randomBytes(4).toString('hex');
    const comments = commentsByPostId[req.params.id] || [];
    const { content } = req.body;

    comments.push({ id: commentId, content, status: 'pending' });
    commentsByPostId[req.params.id] = comments;

    await axios.post('http://localhost:4005/events',{
        type:'CommentCreated',
        data:{
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    });
    res.status(201).send(comments);

});

app.post('/events', async (req, res) => {
    console.log('Event is received', req.body);

    const { type, data } = req.body;

    if (type === 'CommentModerated'){
        const {id, postId, status, content } = data;
        const comments = commentsByPostId[postId];

        const comment = comments.find(comment => {
            return comment.id === id;
        });
        comment.status = status;

        await axios.post('http://localhost:4005/events',{
            type : 'CommentUpdated',
            data : {
                id,
                status,
                postId,
                content
            }
        });
    }

    res.send({});
});

app.listen(4001, () => {
    console.log('Listening on 4001');
});