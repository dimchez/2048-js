class BufferLoader {
    #context;
    #urls;
    #onLoadCallback;

    #buffersList;
    #loadCount;

    constructor(context, urls, callback) {
        this.#context = context;
        this.#urls = urls;
        this.#onLoadCallback = callback;

        this.#buffersList = new Array();
        this.#loadCount = 0;
    }

    load() {
        for (let index = 0; index < this.#urls.length; ++index) {
            this.#loadBuffer(this.#urls[index], index);
        }
    }

    #loadBuffer(url, index) {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
  
        const loader = this;
  
        request.onload = function() {
            loader.#context.decodeAudioData(
                request.response,
                function(buffer) {
                    if (!buffer) {
                        console.error('error decoding file data: ' + url);
                        return;
                    }
                    
                    loader.#buffersList[index] = buffer;
                    loader.#loadCount += 1;
                    
                    if (loader.#loadCount == loader.#urls.length)
                        loader.#onLoadCallback(loader.#buffersList);
                    },
                function(error) {
                    console.error('decodeAudioData error', error);
                }
            );
        };
  
        request.onerror = function() {
            console.error('BufferLoader: XHR error');
        }
    
        request.send();
    }
}

class GameAudio {
    #context;
    #urls;
    #loader;
    #soundOn;

    #buffersList;

    constructor(soundOn) {
        this.#context = new AudioContext();
        this.#urls = [ './audio/move.wav', './audio/score.wav', './audio/game-over.wav' ];

        const onLoad = this.#onLoad.bind(this);

        this.#loader = new BufferLoader(this.#context, this.#urls, onLoad);

        this.#soundOn = soundOn;
    }

    set soundOn(value) {
        this.#soundOn = value;
    }

    load() {
        this.#loader.load();
    }

    playMove() {
        if (!this.#soundOn || !this.#buffersList || !this.#buffersList.length) {
            return;
        }

        const source = this.#context.createBufferSource();
        source.buffer = this.#buffersList[0];
        source.connect(this.#context.destination);
        source.start(0);
    }

    playScore() {
        if (!this.#soundOn || !this.#buffersList || !this.#buffersList.length || this.#buffersList.length < 2) {
            return;
        }

        const source = this.#context.createBufferSource();
        source.buffer = this.#buffersList[1];
        source.connect(this.#context.destination);
        source.start(0);
    }

    playGameOver() {
        if (!this.#soundOn || !this.#buffersList || !this.#buffersList.length || this.#buffersList.length < 3) {
            return;
        }

        const source = this.#context.createBufferSource();
        source.buffer = this.#buffersList[2];
        source.connect(this.#context.destination);
        source.start(0);
    }

    #onLoad(buffersList) {
        this.#buffersList = buffersList;
    }
}
