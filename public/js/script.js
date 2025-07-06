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

function requestLocation() {
  if (navigator.geolocation) {
    console.log(navigator.geolocation);
    navigator.geolocation.watchPosition(
      (position) => {
        console.log("position", position);
        if (position) {
          document.getElementById("location").style.display = "none";
          document.getElementById("message").style.display = "none";
          // document.getElementById("message-box").style.display = "none";
        }
        const { longitude, latitude } = position.coords;
        socket.emit("send-location", { username, latitude, longitude });
      },
      (error) => {
        console.error(error.message);
        if (error.message === "User denied Geolocation") {
        }
      },
      { enableHighAccuracy: true, timeout: 2000, maximumAge: 0 }
    );
  }
}

requestLocation();

const retryBtn = document.getElementById("location");
retryBtn.addEventListener("click", () => {
  if (navigator.permissions) {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      console.log("inside permission");
      requestLocation();
    });
  } else {
    console.log("outside permission");
    requestLocation();
  }
});

const routeBtn = document.getElementById("routeBtn");
let routingStart = false;
const updateRoute = () => {
  const user1Id = document.getElementById("user1").value;
  const user2Id = document.getElementById("user2").value;
  const user1 = users.find((user) => user.userId === user1Id);
  const user2 = users.find((user) => user.userId === user2Id);

  if (!user1 || !user2 || user1 == user2) {
    alert("choose valid user");
    return;
  }

  if (window.routeControl) {
    map.removeControl(window.routeControl);
  }

  window.routeControl = L.Routing.control({
    waypoints: [
      L.latLng(user1.latitude, user1.longitude),
      L.latLng(user2.latitude, user2.longitude),
    ],
    routeWhileDragging: false,
    draggableWaypoints: false,
    addWaypoints: false,
    createMarker: () => null,
  }).addTo(map);
};

routeBtn.addEventListener("click", () => {
  if (!routingStart) {
    updateRoute();
    routeBtn.innerText = "exit";
    document.getElementById("reroute").style.display = "block";
    routingStart = true;
  } else {
    if (window.routeControl) {
      map.removeControl(window.routeControl);
      window.routeControl = null;
    }
    routeBtn.innerHTML = "route";
    document.getElementById("user1").value = "";
    document.getElementById("user2").value = "";
    document.getElementById("reroute").style.display = "none";
    routingStart = false;
  }
});

const reroute = document.getElementById("reroute");
reroute.addEventListener("click", () => {
  updateRoute();
});

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

    const selectedUser1 = document.getElementById("user1");
    const selectedUser2 = document.getElementById("user2");

    const userOptions = users
      .map((user) => `<option value="${user.userId}">${user.username}</option>`)
      .join("");
    selectedUser1.innerHTML =
      `<option value="" disabled selected>select User1</option>` + userOptions;
    selectedUser2.innerHTML =
      `<option value="" disabled selected>select User2</option>` + userOptions;
  } else {
    users[currentUserIdx].latitude = latitude;
    users[currentUserIdx].longitude = longitude;
    users[currentUserIdx].map.setLatLng([latitude, longitude]);
  }
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
