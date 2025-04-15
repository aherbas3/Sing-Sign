let lastSongId = null;

async function extractLyricsText() {
    const songTitle = document.querySelector('[data-testid="context-item-link"]')?.textContent;
    const artistName = document.querySelector('[data-testid="context-item-info-artist"]')?.textContent;
    const songId = songTitle && artistName ? `${songTitle}-${artistName}` : null;

    lastSongId = songId;

    const response = await fetch(`http://127.0.0.1:5000/lyrics?artist=${artistName}&song=${songTitle}`)
    const fetchedNouns = await response.json();

    return fetchedNouns;
}

function createBoxes(data) {
    const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
    const innerHeader = document.querySelector(".sing-sign-header");

    // Remove all old boxes
    const existingBoxes = innerDiv.querySelectorAll(".sing-sign-box");
    existingBoxes.forEach(box => box.remove());

    if (data) {
        if (innerHeader) innerHeader.remove();
        data.forEach(entry => {
            const signBox = document.createElement("div");
            signBox.classList.add("sing-sign-box");
    
            const signText = document.createElement("h2");
            signText.textContent = entry.title;
            signBox.appendChild(signText);
    
            const signImage = document.createElement("img");
            signImage.setAttribute("src", entry.img);
            signBox.appendChild(signImage);
    
            innerDiv.append(signBox);
        });
    } else if (!innerHeader) {
        const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
        const innerHeader = document.createElement("h1");
        innerHeader.classList.add("sing-sign-header");
        innerHeader.innerHTML = "Your signs will appear here!";
        innerDiv.innerHTML = "";
        innerDiv.appendChild(innerHeader);
    }

}

async function fetchVideos(query) {
  const baseUrl = "https://www.googleapis.com/youtube/v3/search";
  
  const apiKey = '';
  const channelId = "UCACxqsL_FA-gMD2fwil7ZXA";
  const url = `${baseUrl}?part=snippet&channelId=${channelId}&q=${encodeURIComponent(query)}&key=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  const regexExactMatch = new RegExp(`(?:^|\\W)${query}(?:$|\\W)`, 'i');
  const regexStartsWith = new RegExp(`^${query}(\\s|,|$)`, 'i');

  // Map and filter videos based on exact word match
  const matchedVideos = data.items
    .map(item => ({
      title: item.snippet.title,
      description: item.snippet.description || '',
      videoId: item.id.videoId
    }))
    .filter(video => regexExactMatch.test(video.title));

  // Sort videos to prioritize those that start with the query followed by space/comma
  const sortedVideos = matchedVideos
    .sort((a, b) => regexStartsWith.test(b.title) - regexStartsWith.test(a.title))
    .slice(0, 1); // Limit to top 3 results

  console.log(sortedVideos)
  return sortedVideos;
}

function mapNounToVideo(nouns) {
    const nounSet = [...new Set(nouns)];
    const videoMap = nounSet.map((noun) => ({
        word: noun,
        video: fetchVideos(noun),
    }));

    // nounSet.forEach(noun => fetchVideos(noun));
    console.log(videoMap);
}

function getSigns(nouns) {
    const innerDiv = document.querySelector(".sing-sign-sidebar-inside");
    // const videoMap = mapNounToVideo(nouns);
    mapNounToVideo(nouns);
    const data = nouns.map((word) => ({
        title: word,
        img: 'https://picsum.photos/id/23/240/135',
    }));

    console.log(data);
    if (innerDiv) {
        createBoxes(data);
    }
}

async function handleLyricsChange() {
    extractLyricsText().then(extractedNouns => {
        nouns = extractedNouns;
        getSigns(nouns);
    });

    // nouns = getCleanNounsFromLyrics(lyrics);
}

setTimeout(
    () => {
        const nowPlayingWidget = document.querySelector('[data-testid="now-playing-widget"]');
        console.log(nowPlayingWidget)
        if (nowPlayingWidget) {
            handleLyricsChange();
            const observer = new MutationObserver(() => {
                handleLyricsChange();
                console.log("change")
            });

            observer.observe(nowPlayingWidget, {
                childList: true,
                subtree: true,
            });
        }
    }, 3000
)