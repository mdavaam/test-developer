module.exports = (io, db) => {
    const { customers, queue, activeRooms, chatHistory } = db;

    let agentSocket = null;
    let agentSocketId = null;

    const queueTimers = {};
    const idleTimers = {};
    const idleData = {};

    // ==========================================
    // UTILS
    // ==========================================
    function sendHistory(socket, roomId) {
        const history = chatHistory[roomId] || [];
        setTimeout(() => {
            history.forEach(msg => socket.emit("receive-message", msg));
        }, 80);
    }

    function autoMessage(roomId, text) {
        if (!chatHistory[roomId]) return;

        const msg = {
            room: roomId,
            name: "Agent BOT",
            message: text,
            time: new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit"
            })
        };

        chatHistory[roomId].push(msg);
        io.to(roomId).emit("receive-message", msg);
    }

    // ==========================================
    // AUTO CLOSE — FULL FIX (ANTI RECONNECT)
    // ==========================================
    function autoClose(roomId, email) {

        autoMessage(roomId,
            "Mohon maaf, karena tidak ada respons dari Bapak/Ibu, saya akhiri chat ini."
        );

        // kick all customers in room BEFORE deleting room
        const clients = io.sockets.adapter.rooms.get(roomId);
        if (clients) {
            clients.forEach(socketId => {
                const c = io.sockets.sockets.get(socketId);
                if (c && c.isCustomer) {
                    c.emit("chat-ended");   // tell client to exit
                    c.leave(roomId);
                }
            });
        }

        // delete everything
        delete activeRooms[email];
        delete chatHistory[roomId];
        delete idleData[roomId];

        if (idleTimers[roomId]) {
            clearInterval(idleTimers[roomId]);
            delete idleTimers[roomId];
        }

        io.to("agent_room").emit("customer-left", { email });
    }

    // ==========================================
    // IDLE (1+1 menit)
    // ==========================================
    function startIdle(roomId, email) {
        idleData[roomId] = { lastActive: Date.now(), step: 0 };

        if (idleTimers[roomId]) clearInterval(idleTimers[roomId]);

        idleTimers[roomId] = setInterval(() => {
            const idleSec = Math.floor((Date.now() - idleData[roomId].lastActive) / 1000);

            if (idleSec >= 60 && idleData[roomId].step === 0) {
                autoMessage(roomId, "Saya masih menunggu respons dari Bapak/Ibu.");
                idleData[roomId].step = 1;
            }

            if (idleSec >= 120 && idleData[roomId].step === 1) {
                autoClose(roomId, email);
            }

        }, 900);
    }

    // ==========================================
    // QUEUE TIMER
    // ==========================================
    function startQueueTimer(email, socket) {

        if (queueTimers[email]) clearTimeout(queueTimers[email]);

        queueTimers[email] = setTimeout(() => {

            if (agentSocket) return;

            queueTimers[email] = setTimeout(() => {
                if (!agentSocket) {
                    socket.emit("queue-timeout");
                    socket.disconnect();
                }
            }, 60000);

        }, 60000);
    }

    // ==========================================
    // MAIN SOCKET IO
    // ==========================================
    io.on("connection", (socket) => {

        // ======================================
        // CUSTOMER JOIN QUEUE
        // ======================================
        socket.on("join-queue", (cust) => {

            socket.customer = cust;
            socket.isCustomer = true;

            const prevRoom = activeRooms[cust.email];

            // CASE: ROOM SUDAH DIHAPUS → NO RECONNECT (SUPER FIX)
            if (prevRoom && !chatHistory[prevRoom]) {
                socket.emit("chat-ended");
                return;
            }

            // CASE: Room masih aktif → reconnect
            if (prevRoom) {
                socket.join(prevRoom);
                sendHistory(socket, prevRoom);
                socket.emit("connected-to-agent", { roomId: prevRoom });

                io.to("agent_room").emit("customer-reconnected", {
                    roomId: prevRoom,
                    customer: cust
                });
                return;
            }

            // NEW CUSTOMER
            queue.push({ sid: socket.id, customer: cust });
            startQueueTimer(cust.email, socket);
            checkQueue();
        });


        // ======================================
        // AGENT LOGIN
        // ======================================
        socket.on("agent-login", (name) => {

            if (agentSocket && agentSocketId !== socket.id) {
                try { agentSocket.disconnect(); } catch {}
            }

            agentSocket = socket;
            agentSocketId = socket.id;

            socket.isAgent = true;
            socket.join("agent_room");

            socket.emit("sync-active-customers", { activeCustomers: activeRooms });
            checkQueue();
        });

        // ======================================
        // AGENT JOIN ROOM
        // ======================================
        socket.on("agent-join-room", (roomId) => {
            socket.join(roomId);
            sendHistory(socket, roomId);
            io.to(roomId).emit("agent-joined", { roomId });
        });

        // ======================================
        // SEND MESSAGE
        // ======================================
        socket.on("send-message", (data) => {

            if (socket.isCustomer && idleData[data.room]) {
                idleData[data.room].lastActive = Date.now();
            }

            const msg = {
                room: data.room,
                name: data.name,
                message: data.message,
                time: new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit"
                })
            };

            if (!chatHistory[data.room]) chatHistory[data.room] = [];
            chatHistory[data.room].push(msg);

            io.to(data.room).emit("receive-message", msg);
        });

        // ======================================
        // DISCONNECT
        // ======================================
        socket.on("disconnect", () => {

            const idx = queue.findIndex(q => q.sid === socket.id);
            if (idx !== -1) queue.splice(idx, 1);

            if (socket.id === agentSocketId) {
                agentSocket = null;
                agentSocketId = null;
                io.emit("agent-disconnected");
            }
        });

        // ======================================
        // CONNECT CUSTOMER DARI QUEUE
        // ======================================
        function connectCustomer(qItem) {

            if (!agentSocket) return;

            const custSocket = io.sockets.sockets.get(qItem.sid);
            if (!custSocket) return;

            const roomId = "room_" + Date.now();

            activeRooms[qItem.customer.email] = roomId;
            chatHistory[roomId] = [];

            custSocket.join(roomId);

            // auto greet BOT
            setTimeout(() => {
                autoMessage(roomId,
                    `Halo ${qItem.customer.name}. Saya Agent BOT, apa yang bisa saya bantu?`
                );
            }, 200);

            custSocket.emit("connected-to-agent", { roomId });

            io.to("agent_room").emit("new-customer", {
                roomId,
                customer: qItem.customer
            });

            startIdle(roomId, qItem.customer.email);

            const idx = queue.indexOf(qItem);
            if (idx !== -1) queue.splice(idx, 1);
        }


        function checkQueue() {
            if (agentSocket && queue.length > 0) {
                connectCustomer(queue[0]);
            }
        }
    });
};
