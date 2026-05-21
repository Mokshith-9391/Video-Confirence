const IS_PROD = window.location.hostname.includes("onrender.com");
const server = IS_PROD ?
    "https://videoconfirence.onrender.com" :
    `http://${window.location.hostname}:8000`;

export default server;