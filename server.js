
const restify = require('restify');
const corsMiddleWare = require('restify-cors-middleware');
const MongoDB = require('mongodb');
const ObjectID = require('mongodb').ObjectID;
const config = require('./config/config');
const server = restify.createServer({
    name: 'Simple API',
    version: '1.0.0'
});
const cors = corsMiddleWare({
    origins: ['*'],
    allowHeaders: ['X-App-Version'],
    exposeHeaders: []
});

server.use(restify.plugins.jsonBodyParser({ mapParams: true }));
server.pre(cors.preflight);
server.use(cors.actual);

server.listen(config.port, () => {
    MongoDB.connect(config.db.uri, (err, dbo) => {
        if (err) {
            process.exit(1);
        };

        const db = dbo.db(config.db.name);
        const collection = db.collection('employees');

        server.post('/api/employees', (req, res, next) => {
            const entity = req.body;
            collection.insertOne(entity)
                .then(doc => res.send(200, doc.ops[0]))
                .catch(err => res.send(500, err));
            next();
        });

        server.get('/api/employees', (req, res, next) => {
            collection.find({}).toArray()
                .then(docs => res.send(200, docs))
                .catch(err => res.send(500, err));
            next();
        });

        server.get('/api/employees/:id', (req, res, next) => {
            let query = { id: req.params.id };
            collection.find(query).toArray()
                .then(docs => res.send(200, docs[0]))
                .catch(err => res.send(500, err));
            next();
        });

        server.put('/api/employees/:id', (req, res, next) => {
            const entity = req.body;
            let query = { _id: ObjectID(req.params.id) },
                body = { $set: entity }
            collection.findOneAndUpdate(query, body)
                .then(doc => res.send(204, doc))
                .catch(err => res.send(500, err));
            next();
        });

        server.del('/api/employees/:id', (req, res, next) => {
            collection.findOneAndDelete({ _id: ObjectID(req.params.id) })
                .then(doc => res.send(204))
                .catch(err => res.send(500, err));
            next();
        });
    });
});