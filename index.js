import express from "express";
import { Server as socketio } from "socket.io";
import http from "http";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new socketio(server);
const publicPath = path.resolve("./public");

app.set("view engine", "ejs");
app.use(express.static(publicPath));

io.on("connection", function (socket) {
  socket.on("send-location", function (data) {
    // console.log(data);
    io.emit("receive-location", { id: socket.id, ...data });
  });
  socket.on("disconnect", function () {
    io.emit("user-disconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(3000, () => {
  console.log("\nserver is running on port 3000 ");
});
