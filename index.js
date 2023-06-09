const express = require('express')
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// middle Ware
app.use(cors());
app.use(express.json());


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

        const classesCollection = client.db("ClickMasterSchool").collection("classes")

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