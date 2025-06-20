const socket = io();
const username = prompt("Enter your name:")?.trim().slice(0, 30) || "Anonymous";
const dispalyUsers = document.getElementById("users");
console.log("this is usernumber", dispalyUsers);
const map = L.map("map").setView([0, 0], 15); // ([long,latit],zoom)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Omkar Prajapati",
}).addTo(map);

/*
  array-model = [
    {userId: socketId,
    userName : "username",
    postition: [long,latitude],
    },
    {},
    {},
  ]
*/

// const markers = {};
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

const usersnumber = document.getElementById("users");
const box = document.getElementById("box");

usersnumber.onclick = () => {
  if (box.style.display === "none") {
    box.style.display = "flex";
  } else {
    box.style.display = "none";
  }
};

box.addEventListener("click", (e) => {
  if (e.target.tagName.toLowerCase() === "li") {
    const username = e.target.innerText;
    console.log(username);
  }
});

socket.on("receive-location", (data) => {
  const { id, username, longitude, latitude } = data;
  if (id === socket.id && !isDragged) {
    map.setView([latitude, longitude], 16);
  }

  const currentUserIdx = users.findIndex((user) => user.userId === id);

  if (currentUserIdx === -1) {
    const marker = L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(`${username}`);

    marker.on("click", () => {
      map.setView([latitude, longitude], 16);
    });

    users.push({
      map: marker,
      userId: id,
      username,
      longitude,
      latitude,
    });

    document.getElementById("users").innerText = users.length;

    const box = document.getElementById("box");
    box.innerHTML = users.map((user) => `<li>${user.username}</li>`).join("");
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
    document.getElementById("users").innerText = users.length;
    const box = document.getElementById("box");
    box.innerHTML = users.map((user) => `<li>${user.username}</li>`).join("");
  }
});
