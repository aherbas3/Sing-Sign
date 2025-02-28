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
          const newBtn = document.createElement("button");
          newBtn.className = "Button-sc-1dqy6lx-0 sing-sign-button";
          newBtn.innerHTML = "Click";
          document.querySelector(".mwpJrmCgLlVkJVtWjlI1").appendChild(newBtn);
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
          const newBtn = document.querySelector(".sing-sign-button");
          document.querySelector(".mwpJrmCgLlVkJVtWjlI1").removeChild(newBtn);
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
