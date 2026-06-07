import { useEffect, useState } from "react";

function Home() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("/api/test")
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setMessage("Backend not connected");
      });
  }, []);

  return (
    <div>
      <h1>HRMS Frontend Running</h1>

      <h2>Backend Status:</h2>
      <p>{message}</p>
    </div>
  );
}

export default Home;
