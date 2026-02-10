export default function handler(req, res) {
  const config = {
    apiKey: "AIzaSyCZYD98K_6gvtnaQKdDIGEon8sLh9pMzHY",
    authDomain: "satria-a49bb.firebaseapp.com",
    databaseURL: "https://satria-a49bb-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "satria-a49bb",
    storageBucket: "satria-a49bb.firebasestorage.app",
    messagingSenderId: "665562325618",
    appId: "1:665562325618:web:5a3d532973338fe5f058eb"
  };

  res.status(200).json(config);
}