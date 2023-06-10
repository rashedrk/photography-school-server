const express = require('express')
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// middle Ware
app.use(cors());
app.use(express.json());

//verify access using jwt
// const verifyJWT = (req,res,next) => {
//     const authorization = 
// }


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
        app.post('/jwt', (req,res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            res.send({token});
        })

        const classesCollection = client.db("ClickMasterSchool").collection("classes");
        const instructorsCollection = client.db("ClickMasterSchool").collection("instructors");
        const usersCollection = client.db("ClickMasterSchool").collection("users");

        /*--------------------
        user data related apis
        ---------------------*/

        //add user info
        app.post('/users', async(req, res) => {
            const user = req.body;
            const query = {email: user.email};
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({message: 'user already exists'})
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


        /*--------------------
        class data related apis
        ---------------------*/

        // get all class data
        app.get('/classes', async(req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result)
        })

        //get top 6 class data based on enrolled number
        app.get('/classes/top', async(req,res) => {
            const sort= {enrolled : -1};
            const result = await classesCollection.find().sort(sort).limit(6).toArray();
            res.send(result)
        })

        /*--------------------
        Instructors data related apis
        ---------------------*/

        //get all instructor data
        app.get('/instructors', async(req,res) => {
            const result = await instructorsCollection.find().toArray();
            res.send(result);
        })

        //get top 6 six instructor data
        app.get('/instructors/top', async(req,res) => {
            const result = await instructorsCollection.find().limit(6).toArray();
            res.send(result)
        })

        /*--------------------
        cart data related apis
        ---------------------*/
        //get carts item
        app.get('/carts')



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