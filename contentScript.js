let lastSongId = null;
let afterMax = -1;
let bulkData;

const rainbowConnectionTimings = [
  { noun: "songs", timestamp: 9.0 },   // sung at 9 second mark
  { noun: "rainbows", timestamp: 10.0},  
  { noun: "side", timestamp: 15.0},
  { noun: "Rainbows", timestamp: 18.0},
  { noun: "visions", timestamp: 20.0},
  { noun: "illusions", timestamp: 22.0},
  { noun: "rainbows", timestamp: 25.0},
  { noun: "rainbow", timestamp: 46.0},
  { noun: "connection", timestamp: 47.0},
  { noun: "lovers", timestamp: 49.0},
  { noun: "dreamers", timestamp:51.0},
  { noun: "morning", timestamp: 66.0},
  { noun: "rainbow", timestamp: 98.0},
  { noun: "connection", timestamp: 100.0},
  { noun: "lovers", timestamp: 102.0},
  { noun: "dreamers", timestamp: 104.0},
  { noun: "spell", timestamp: 110.0},
  { noun: "voices", timestamp: 124.0},
  { noun: "name", timestamp: 129.0},
  { noun: "sound", timestamp: 134.0},
  { noun: "sailors", timestamp: 136.0},
  { noun: "voice", timestamp: 138.0},
  { noun: "times", timestamp: 147.0},
  { noun: "rainbow", timestamp: 159.0},
  { noun: "connection", timestamp: 161.0},
  { noun: "lovers", timestamp: 163.0},
  { noun: "dreamers", timestamp: 164.0}
  //chose not to include da de do's timing.
];


async function fetchASLVideo(noun) {
    const config = await fetch(chrome.runtime.getURL('config.json')) //load config.json
    .then(response => response.json())
    .catch(error => {
      console.error('Error loading API key:', error);
      throw error;
    });
  
  const API_KEY = config.apiKey; //created using google cloud and given youtube api permissions
  let searchQuery = `${noun}`;
  if (searchQuery.toLowerCase() === "time") return 'gPHgrgZdlX0'; //craft a youtube query
  if (searchQuery === "kids" || searchQuery === "kid") searchQuery = "children";
  const CHANNEL_ID = 'UCACxqsL_FA-gMD2fwil7ZXA'; //specifically concentrated on the channel ASL Dictionary
  const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&channelId=${CHANNEL_ID}&key=${API_KEY}`;

  try { //fetching video
    const response = await fetch(endpoint);
    const data = await response.json();
    return data.items?.[0]?.id?.videoId || null;
  } catch (error) {
    console.error(`Failed to fetch ASL video for: ${noun}`, error);
    return null;
  }
};

async function fetchCachedASLVideo(noun) {
  const cacheKey = `asl_${noun.toLowerCase()}`;

  return new Promise((resolve) => {
    chrome.storage.local.get([cacheKey], async (result) => {
      if (result[cacheKey]) { // check if we have a cached videoID
        resolve(result[cacheKey]);
      } else { //if not, do it
        const videoId = await fetchASLVideo(noun);
        if (videoId) {
          chrome.storage.local.set({ [cacheKey]: videoId });
        }
        resolve(videoId);
      }
    });
  });
};

async function getASLVideoMap(nounSet) {
  const result = [];

  for (const noun of nounSet) {
    const videoId = await fetchCachedASLVideo(noun);
    result.push({ word: noun, videoId });

    await new Promise((res) => setTimeout(res, 250));
  }

  return result;
};

async function extractLyricsText() {
    const songTitle = document.querySelector('[data-testid="context-item-link"]')?.textContent;
    const artistName = document.querySelector('[data-testid="context-item-info-artist"]')?.textContent;
    const songId = songTitle && artistName ? `${songTitle}-${artistName}` : null;
    let isRainbowConnection = false; //using this to choose our demo song

    lastSongId = songId;

    if ((songTitle && artistName) && (songTitle === "Rainbow Connection") && (artistName === "The Muppets")) {
      //console.log("The song is 'Rainbow Connection' by The Muppets.");
      isRainbowConnection = true;
    } else {
      //console.log("This is not 'Rainbow Connection' by The Muppets.");
    }

    //here our lyric fetcher comes into play
    const response = await fetch(`http://127.0.0.1:5000/lyrics?artist=${artistName}&song=${songTitle}`);
    if (!response.ok) {
      throw new Error("Lyrics not found, nouns cant be printed");
    } else {
      const fetchedNouns = await response.json();
      console.log(fetchedNouns);

      return {fetchedNouns, isRainbowConnection};
    }
    
};

const iframeMap = new Map();

const lazyLoadIframes = () => {
  const placeholders = document.querySelectorAll('.lazy-iframe');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      const div = entry.target;

      if (entry.isIntersecting) {
        // If iframe already created, resume
        if (iframeMap.has(div)) {
          const iframe = iframeMap.get(div);
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo' }),
            '*'
          );
          return;
        }

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = div.dataset.src + "&enablejsapi=1"; // Important for JS API
        iframe.className = "video";
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; encrypted-media');
        iframe.setAttribute('allowfullscreen', '');

        // Replace placeholder
        div.replaceWith(iframe);
        iframeMap.set(div, iframe);
        obs.unobserve(div); // optional: remove observer for replaced div
      } else {
        // Pause if iframe exists and is out of view
        const iframe = iframeMap.get(div);
        if (iframe) {
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo' }),
            '*'
          );
        }
      }
    });
  }, {
    rootMargin: "100px 0px",
    threshold: 0.1
  });

  placeholders.forEach(div => observer.observe(div));
};


function createBoxes(data) {
  //console.log('JUST ENTERED CREATEBOXES. DATA IS', data);
  const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
  // Limit to a set number of boxes
  const maxBoxes = 3;

  if (data.length > 1) { //given list of all nouns and their video ids. some video ids will be null. should only be reached once
    bulkData = data.filter(item => item.videoId !== null);
    for (let i = 0; i < Math.min(3, data.length); i++) { //only display the first three boxes
      const initialBox = data[i];
      
      if (initialBox && initialBox.title && initialBox.videoId) {
        const signBox = document.createElement("div");
        signBox.classList.add("sing-sign-box");

        signBox.appendChild(createSignBox(initialBox.videoId));
        innerDiv.appendChild(signBox);
      } else {
           console.warn(`Data at index ${i} is invalid:`, initialBox);
      }
    }
    console.log('finished first 3');
  } else { //given just one box and its the current one. will continuously be reached as the lyrics progress
    afterMax++; //console.log('afterMax is', afterMax);
    const followingBox = bulkData[maxBoxes + afterMax];
    
    if (followingBox && followingBox.title && followingBox.videoId) { //end goal: current noun being sung is the top box
      innerDiv.removeChild(innerDiv.firstChild); //get rid of the old box
      const signBox = document.createElement("div");
      signBox.classList.add("sing-sign-box");

      signBox.appendChild(createSignBox(followingBox.videoId));
      innerDiv.appendChild(signBox); //add the 3rd next box to the bottom
    } else {
      console.warn(`Data is invalid:`, followingBox);
    }
  }

  innerDiv.scrollTop = 0;
  }




function mapNounToVideo(nouns) {
    const nounSet = [...new Set(nouns)];
    getASLVideoMap(nounSet).then((videoMap) => {
        console.log(videoMap); //individual words
        const data = nouns.map((noun) => {
            const match = videoMap.find((entry) => entry.word === noun);
            return {
                title: noun,
                videoId: match ? match.videoId : null
            };
        });

        createBoxes(data); //this is sending all the nouns including those without videoIds
        //lazyLoadIframes();
    });
}

async function handleLyricsChange() {
  extractLyricsText().then((result) => {
    const { fetchedNouns, isRainbowConnection } = result;
    const nouns = fetchedNouns; 

    if (nouns.length > 0) {
      const innerHeader = document.querySelector(".sing-sign-header");
      if (innerHeader) {
          innerHeader.textContent = "Loading...";
          mapNounToVideo(nouns);
      }
    } else {
        const innerHeader = document.querySelector(".sing-sign-header");
        innerHeader.textContent = "No Lyrics were found for this song :(";
    }
  });
}

function createSignBox(videoId) { //had to add because Spotify's CSP blocks inline scripts, and i was injecting JS. now i'm switching to DOM methods
  const iframe = document.createElement("iframe"); //see here!
  iframe.className = "video";
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&enablejsapi=1`;
  iframe.frameBorder = "0";
  iframe.allow = "autoplay; encrypted-media";
  iframe.allowFullscreen = true;

  return iframe;
}

function resetSidebar() {
    const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
    if (innerDiv) {
        const innerHeader = document.createElement("h1");
        innerHeader.classList.add("sing-sign-header");
        innerHeader.innerHTML = "Your signs will appear here!";
        innerDiv.innerHTML = "";
        innerDiv.appendChild(innerHeader);
    }
}

setTimeout(
    async () => {
        const nowPlayingWidget = document.querySelector('[data-testid="now-playing-widget"]');
        if (nowPlayingWidget) {
            const observer = new MutationObserver(() => {
                chrome.storage.local.get(["running"]).then((result) => {
                    if (result.running) {
                        handleLyricsChange();
                        resetSidebar();
                    }
                });
            });

            observer.observe(nowPlayingWidget, {
                childList: true,
                subtree: true,
            });
        }
    }, 3000);

setTimeout(() => { //in the future, i'd like to directly call the spotify api to gain this information and the artist/song name. it's more reliable and polished
  const playbackElement = document.querySelector('[data-testid="playback-position"]');

  if (playbackElement) {
    let lastValue = playbackElement.textContent;

    const observer = new MutationObserver(() => { //watch for changes
      const currentValue = playbackElement.textContent;
      if (currentValue !== lastValue) {
        console.log("Playback time:", currentValue);
        lastValue = currentValue;

        const currentTimeInSeconds = parseTimeStringToSeconds(currentValue);
        handleTimedSigns(currentTimeInSeconds);
      }
    });

    observer.observe(playbackElement, {
      characterData: true,
      childList: true,
      subtree: true
    });
  } else {
    console.warn("playback-element not found.");
  }
}, 3000);


chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.running && namespace === "local") {
    if (changes.running.newValue) {
        handleLyricsChange();
        resetSidebar();
    }
  }
});

function parseTimeStringToSeconds(timeString) {
  const [minutes, seconds] = timeString.split(':').map(Number);
  return minutes * 60 + seconds;
}

function handleTimedSigns(currentTime) {
  if (!lastSongId || !lastSongId.includes("Rainbow Connection")) return; //only works when the song is Rainbow Connection (demo song)

  const nounEntry = rainbowConnectionTimings.find(entry => //using our timing map, check if the current time is closely matching one of our timestamps within half a second
    Math.abs(entry.timestamp - currentTime) < 0.5
  );

  if (nounEntry) {
    fetchCachedASLVideo(nounEntry.noun).then(videoId => {
      if (videoId) {
        const data = [{ title: nounEntry.noun, videoId }];
        createBoxes(data); //will send only send one element, and it's the current one being sung
        //lazyLoadIframes();
        //console.log('JUST SENT TIMED DATE TO CREATEBOXES', data);
      }
    });
  }
}
