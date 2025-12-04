const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ======== FAKE DB IN MEMORY ========
let customers = [];
let masterCustomers = [];
let queue = [];
let activeRooms = {};
let chatHistory = {};

// ========== API LOGIN AGENT ==========
app.post("/agent/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, message: "Email & password wajib" });

    const agentName = email.split("@")[0];

    res.json({ success: true, agentName, email });
});

// ========== API REGISTER CUSTOMER ==========
app.post("/customer/register", (req, res) => {
    const { name, email, phone } = req.body;

    const newCustomer = {
        id: Date.now(),
        name,
        email,
        phone,
        created_at: new Date().toISOString().slice(0, 10)
    };

    customers.push(newCustomer);
    res.json({ success: true, customer: newCustomer });
});

// ========== AGENT GET CUSTOMER LIST ==========
app.get("/agent/customers", (req, res) => {
    res.json(customers);
});

// ========== MASTER CUSTOMER RANDOMUSER API ==========
app.get("/agent/master-customers", async (req, res) => {

    console.log("HIT /agent/master-customers");

    try {
        // PAKAI NATIVE FETCH
        const response = await fetch("https://randomuser.me/api/?results=10&page=1");
        const json = await response.json();

        masterCustomers = json.results.map(u => ({
            name: `${u.name.title} ${u.name.first} ${u.name.last}`,
            email: u.email,
            uuid: u.login.uuid,
            username: u.login.username,
            password: u.login.password,
            phone: u.phone,
            cell: u.cell,
            picture: u.picture.medium
        }));

        console.log("LOADED:", masterCustomers.length);
        res.json(masterCustomers);

    } catch (err) {
        console.error("Fetch error:", err);
        res.status(500).json({ error: "Gagal ambil data RandomUser", detail: err.message });
    }
});

// ========== ROUTES ==========
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/customer/index.html"));
});

app.get("/agent", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/agent/index.html"));
});

// ========== SOCKET.IO ==========
require("./socket")(io, {
    customers,
    queue,
    activeRooms,
    chatHistory
});

// ========== RUN SERVER ==========
server.listen(3000, () => {
    console.log("Server ready → http://localhost:3000");
});
