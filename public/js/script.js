const socket = io();
const username = prompt("Enter your name:")?.trim().slice(0, 30) || "Anonymous";

const map = L.map("map").setView([0, 0], 15); // ([long,latit],zoom)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Omkar Prajapati",
}).addTo(map);

/*
  object-model = [
    {userId: socketId,
    userName : "username",
    postition: [long,latitude],
    },
    {},
    {},
  ]

*/
const markers = {};
let users = [];

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { longitude, latitude } = position.coords;
      socket.emit("send-location", { username, latitude, longitude });
    },
    (error) => {
      console.error(error);
    },
    { enableHighAccuracy: true, timeout: 2000, maximumAge: 0 }
  );
}

let isDragged = false;
map.on("drag", () => {
  isDragged = true;
});

socket.on("receive-location", (data) => {
  const { id, username, longitude, latitude } = data;
  if (id === socket.id && !isDragged) {
    map.setView([latitude, longitude], 16);
  }

  const currentUserIdx = users.findIndex((user) => user.userId === id);

  if (currentUserIdx === -1) {
    users.push({
      map: L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(`${username}`)
        .openPopup(),
      userId: id,
      username,
      longitude,
      latitude,
    });
  } else {
    users[currentUserIdx].map.setLatLng([latitude, longitude]);
  }

  console.log("this is users", users);
});

socket.on("user-disconnected", (id) => {
  const user = users.find((user) => user.userId === id);
  if (user) {
    map.removeLayer(user.map);
    users = users.filter((user) => user.userId !== id);
  }
});
