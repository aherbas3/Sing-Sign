import requests
from bs4 import BeautifulSoup
import spacy
import re
from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/lyrics')
def fetchLyrics():
    artist = request.args.get('artist')
    song = request.args.get('song')
    if (artist == None or song == None):
        return [], 404
    nlp = spacy.load("en_core_web_sm")

    # composes url with artist and song title
    url = "https://genius.com/" + artist.replace(' ', '-') + "-" + song.replace(' ', '-') + "-lyrics"

    # gets html from http request
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    # uses beautiful soup to find the divs the lyrics are in
    lyricDivs = soup.find_all("div", attrs={"data-lyrics-container": "true"})

    # if lyrics were found
    if lyricDivs:

        # string that will eventually be printed
        lyrics = ""

        # for each lyric-data-container
        for lyricDiv in lyricDivs:

            # remove unwanted text (translation/contributor info)
            for unwanted in lyricDiv.find_all(["div"], attrs={"data-exclude-from-selection": "true"}):
                unwanted.decompose()

            # extracts texts from lyrics
            lyrics += lyricDiv.get_text(separator="\n")
            # removes any bracketed text (e.g., "[Chorus]")
            lyrics = re.sub(r"\[.*?\]", "", lyrics)

        # container for the nouns found in the lyrics
        parsed_nouns = []

        # gets each paragraph of the lyrics
        paragraphs = lyrics.split("\n\n")

        # for each paragraph
        for paragraph in paragraphs:
            # split the paragraph into lines
            lines = paragraph.split("\n")

            # for each line in the paragraph
            for line in lines:
                # uses natural language processing on the line
                doc = nlp(line)

                # for each token processed from the line
                for token in doc:
                    #if the token is a noun
                    if token.pos_ in ["NOUN"]:
                        # add the token to the list for this line
                        parsed_nouns.append(f"{token.text}")

        #a line of whitespace after each paragraph
        return parsed_nouns, 200

    #else if lyrics weren't found
    else:
        return [], 404

if __name__ == '__main__':
    app.run(debug=True)