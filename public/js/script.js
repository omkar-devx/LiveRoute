const socket = io();
const username = prompt("Enter your name:")?.trim().slice(0, 30) || "Anonymous";

const map = L.map("map").setView([0, 0], 15); // ([long,latit],zoom)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Omkar Prajapati",
}).addTo(map);

// const generateUniqueId = () => {
//   let id;
//   do {
//     id = Math.random().toString().substr(2, 6);
//   } while (userId[id]);

//   return id;
// };

const markers = {};

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

map.on("drag", () => {
  console.log("moving...");
});

let setIntialView = false;
socket.on("receive-location", (data) => {
  const { id, username, longitude, latitude } = data;
  if (!setIntialView && id == socket.id) {
    map.setView([latitude, longitude], 16);
    setIntialView = true;
  }

  const label = `${username}`;
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(label)
      .openPopup();
  }
});

socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});
