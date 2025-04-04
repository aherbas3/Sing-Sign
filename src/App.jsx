import React from "react";
import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    chrome.storage.local
      .get(["running"])
      .then((result) => {
        console.log("found and set: " + result.running);
        setRunning(result.running);
      })
      .catch(() => {
        console.log("not found but set: false");
        setRunning(false);
      });
  }, []);

  const start = () => {
    chrome.storage.local.set({ running: true }).then(async () => {
      setRunning(true);
      let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const style = document.createElement("style");
          style.textContent = `
            .sing-sign-sidebar {
              background-color: pink;
              display: flex;
              flex-direction: column;
              gap: 20px;
              padding: 20px;
              align-items: center;
              width: 100%;
              height: 100%;
            }

            .sing-sign-box {
              width: 200px;
              height: 200px;
              background-color: gray;
            }
          `;
          document.head.appendChild(style);

          const sideDiv = document.createElement("div");
          sideDiv.classList.add("sing-sign-sidebar");
          document.querySelector(".XOawmCGZcQx4cesyNfVO").prepend(sideDiv);

          for (let i = 0; i < 3; i++) {
            const signBox = document.createElement("div");
            signBox.classList.add("sing-sign-box");

            sideDiv.append(signBox);
          }

          // Hide the sidebar
          document.querySelector(
            ".XOawmCGZcQx4cesyNfVO > aside"
          ).style.display = "none";
        },
      });
    });
  };

  const stop = async () => {
    chrome.storage.local.set({ running: false }).then(async () => {
      setRunning(false);
      let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const sideDiv = document.querySelector(".sing-sign-sidebar");

          document.querySelector(".XOawmCGZcQx4cesyNfVO").removeChild(sideDiv);
          document.querySelector(
            ".XOawmCGZcQx4cesyNfVO > aside"
          ).style.display = "block";
        },
      });
    });
  };

  return (
    <>
      <h1>{running ? "Stop" : "Start"} SingSign?</h1>
      <div className="btn-wrapper">
        <button
          onClick={() => {
            running ? stop() : start();
          }}
        >
          Yes
        </button>
        <button onClick={() => window.close()}>No</button>
      </div>
    </>
  );
}

export default App;
