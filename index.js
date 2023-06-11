const express = require('express')
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middle Ware
app.use(cors());
app.use(express.json());

// verify access using jwt
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    //send error msg if no authorization token 
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    //get the access token
    const token = authorization.split(' ')[1];

    //verify token with jwt 
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        // send error if token is no valid 
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }
        // the request information decoded and it put to req and send to next 
        req.decoded = decoded;
        next();
    });
}

//verify User email
const verifyUser = (req, res, next) => {
    const email = req.query.email;
    if (!email) {
        res.send([]);
    }
    const decodedEmail = req.decoded.email;
    //check for api req user is valid user
    if (decodedEmail !== email) {
        res.status(403).send({ error: true, message: "Forbidden access" })
    }
    req.email = email;
    next()
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qrkrfrq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        //jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({ token });
        })

        //collections in database
        const classesCollection = client.db("ClickMasterSchool").collection("classes");
        const instructorsCollection = client.db("ClickMasterSchool").collection("instructors");
        const usersCollection = client.db("ClickMasterSchool").collection("users");
        const selectedClassCollection = client.db("ClickMasterSchool").collection("selectedClasses");


        /*--------------------
        user data related apis
        ---------------------*/

        //add user info
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //get all user data 
        app.get('/users', verifyJWT, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        //update user role
        app.patch('/users', verifyJWT, async (req, res) => {
            const { email, role } = req.body;
            const filter = { email: email };
            const updateRole = {
                $set: {
                    role: role
                }
            }
            const result = await usersCollection.updateOne(filter, updateRole);
            res.send(result);
        })

        /*--------------------
        class data related apis
        ---------------------*/

        // get all class data
        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result)
        })

        //get top 6 class data based on enrolled number
        app.get('/classes/top', async (req, res) => {
            const sort = { enrolled: -1 };
            const result = await classesCollection.find().sort(sort).limit(6).toArray();
            res.send(result)
        })

        /*--------------------
        Instructors data related apis
        ---------------------*/

        //get all instructor data
        app.get('/instructors', async (req, res) => {
            const result = await instructorsCollection.find().toArray();
            res.send(result);
        })

        //get top 6 six instructor data
        app.get('/instructors/top', async (req, res) => {
            const result = await instructorsCollection.find().limit(6).toArray();
            res.send(result)
        })

        /*--------------------
        selected class / cart data related apis
        Students
        ---------------------*/

        //add selected class item for student dashboard
        app.post('/classes/selected', async (req, res) => {
            const item = req.body;
            const result = await selectedClassCollection.insertOne(item);
            res.send(result);
        })

        //get selected class item
        app.get('/classes/selected', verifyJWT, verifyUser, async (req, res) => {
            const query = { email: req.email }; // sending req.email from verifyUser
            const result = await selectedClassCollection.find(query).toArray();
            res.send(result);
        })

        // delete selected class item
        app.delete('/classes/selected/:id', verifyJWT, verifyUser, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await selectedClassCollection.deleteOne(query);
            res.send(result);
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Click Master school server is running')
})

app.listen(port, () => {
    console.log(`Click Master school server is running on port ${port}`)
})