# 📹 Real-Time Video Conferencing Web Application (MERN Stack)

This project is a complete, full-stack video conferencing solution built using the MERN (MongoDB, Express, React, Node.js) stack, demonstrating mastery of real-time communication protocols (WebRTC and Socket.IO) and robust user authentication.

## ✨ Features

* **Secure User Authentication:** Full login and registration system using MongoDB, Express, and secure token validation. Passwords are secured using `bcrypt`.
* **Real-Time Video & Audio:** Utilizes **WebRTC** for direct, low-latency Peer-to-Peer (P2P) media streaming between participants.
* **Signaling Server:** Employs **Socket.IO** to handle signaling, connection establishment, and user presence management.
* **Dynamic Room Management:** Users can host meetings to generate a unique, shareable room URL for others to join.
* **In-Meeting Controls:** Includes essential features like toggling video and audio (mute/unmute).
* **Persistent Data:** Uses **MongoDB** to store user profiles and session data.
* **Cloud Deployment:** Fully deployed and running on **Render** (Frontend: Static Site, Backend: Node Server).

## 🏛️ Project Architecture

The application uses a modular, three-tier architecture:

1.  **Client (Frontend):** **React SPA** handles the user interface, manages state, captures local media streams, and initiates the WebRTC process.
2.  **Server (Backend):** **Node.js/Express.js** manages REST API endpoints for user authentication, stores persistent data in MongoDB, and acts as the **Signaling Server** using Socket.IO.
3.  **Database:** **MongoDB Atlas** for secure, persistent storage of user credentials and metadata.
4.  **Real-Time Layer:** **WebRTC** (media streams) and **Socket.IO** (data signaling) work together to establish the P2P connection.

## ⚙️ Technologies Used

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, HTML/CSS/JS | User Interface and Component Logic |
| **Backend** | Node.js, Express.js | REST APIs, Server Logic, Database Interface |
| **Real-Time** | WebRTC | Peer-to-Peer Video/Audio Media Transfer |
| **Signaling** | Socket.IO | Connection Handshake, Peer Discovery, Chat Messaging |
| **Database** | MongoDB | Persistent Storage for User and Meeting Data |
| **Security** | bcrypt, JWT (Token) | Password Hashing and Session Management |
| **Deployment** | Render (Frontend & Backend) | Continuous Integration and Production Hosting |

## 🚀 Setup and Installation (Local Development)

Follow these steps to get a local copy of the project running on your machine.

### Prerequisites

* Node.js (v18.x or later)
* MongoDB Atlas Account (or local MongoDB instance)
* Git

### 1. Clone the Repository

```bash
git clone <your-repo-link>
cd <your-repo-name>
2. Backend Setup
Navigate to the backend directory:

Bash

cd backend
Install dependencies:

Bash

npm install
Configure Environment: Open backend/app.js and update the MongoDB connection string with your Atlas URL if you haven't already.

Start the backend server:

Bash

npm run dev
# The server will run on http://localhost:8000
3. Frontend Setup
Navigate to the frontend directory:

Bash

cd ../frontend
Install dependencies:

Bash

npm install
Configure Environment: Ensure the API and Socket.IO connections point to your local server:

In your frontend configuration file (e.g., src/environment.js), set the base API/Socket URL to http://localhost:8000.

Start the frontend development server:

Bash

npm start
# The app will open in your browser at http://localhost:3000
🌐 Project Deployment (Render)
The application is deployed using Render for reliable production hosting.

Frontend Deployment: Configured as a Static Site on Render, serving the production build.

Backend Deployment: Configured as a Web Service on Render, automatically starting the server using npm start or the process specified in package.json.

Critical Note on CORS: Since the frontend and backend are deployed on different domains (subdomains on Render), Cross-Origin Resource Sharing (CORS) is strictly configured in the backend's app.js and socketManager.js to explicitly allow the frontend's public URL as the origin.

⏭️ Future Work
Multi-Party Calls: Extend the WebRTC signaling logic to support group calls with more than two participants (using an SFU architecture).

End-to-End Encryption: Implement advanced encryption for media streams for enhanced security.

Screen Sharing: Add functionality to share the desktop screen during a meeting.

Mobile App: Develop native mobile applications using React Native.
