(() => {
  const tag = 'singgyul-cd-player';
  if (customElements.get(tag)) return;

  const assetBase = new URL('./', document.currentScript.src);
  const tracks = [
    { title: '겨울아이', artist: '수지', file: '겨울아이.mp3', color: 'birthday' },
    { title: 'Winter Wonderland', artist: 'Richard Himber 악단', file: 'winter_wonderland.mp3', color: 'winter' },
    { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', file: 'fly_me_to_the_moon.mp3', color: 'moon' },
    { title: '눈', artist: 'Zion.T (Feat. 이문세)', file: '눈.mp3', color: 'snow' },
  ];

  class SinggyulCdPlayer extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;

      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <section class="player" aria-label="띵귤 커버곡 재생기" hidden>
          <button class="play" type="button" aria-label="재생" title="재생">
            <span class="disc" aria-hidden="true"></span>
            <span class="play-icon" aria-hidden="true"></span>
          </button>
          <div class="track" aria-live="polite" aria-atomic="true">
            <span class="track-title"></span>
            <span class="artist"></span>
          </div>
          <button class="skip previous" type="button" aria-label="이전 곡" title="이전 곡"></button>
          <button class="skip next" type="button" aria-label="다음 곡" title="다음 곡"></button>
          <p class="error" role="status"></p>
          <audio preload="none" hidden></audio>
        </section>
      `;

      const player = root.querySelector('.player');
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = new URL('singgyul-cd-player.css', assetBase).href;
      stylesheet.addEventListener('load', () => { player.hidden = false; }, { once: true });
      root.prepend(stylesheet);

      const audio = root.querySelector('audio');
      const title = root.querySelector('.track-title');
      const artist = root.querySelector('.artist');
      const play = root.querySelector('.play');
      const error = root.querySelector('.error');
      let currentIndex = 0;
      let trackVersion = 0;

      audio.volume = 0.35;

      function updateTransport() {
        const active = !audio.paused && !audio.ended;
        const label = active ? '일시정지' : '재생';
        play.toggleAttribute('data-active', active);
        play.setAttribute('aria-label', label);
        play.title = label;
        if (!active) player.removeAttribute('data-spinning');
      }

      async function startPlayback(automatic = false) {
        const version = trackVersion;
        error.textContent = '';
        if (audio.error) audio.load();
        try {
          await audio.play();
        } catch (failure) {
          if (version === trackVersion && failure.name !== 'AbortError') {
            error.textContent = automatic && failure.name === 'NotAllowedError' ? '' : 'CD를 다시 눌러 주세요.';
            updateTransport();
          }
        }
      }

      function loadTrack(index, resume) {
        trackVersion += 1;
        currentIndex = (index + tracks.length) % tracks.length;
        const track = tracks[currentIndex];
        audio.pause();
        audio.src = new URL(`audio/${track.file}`, assetBase).href;
        audio.load();
        player.dataset.disc = track.color;
        title.textContent = track.title;
        title.title = track.title;
        artist.textContent = `${track.artist} (cover by singgyul)`;
        artist.title = artist.textContent;
        error.textContent = '';
        updateTransport();
        if (resume) void startPlayback();
      }

      play.addEventListener('click', () => {
        if (audio.paused) void startPlayback();
        else audio.pause();
      });
      root.querySelector('.previous').addEventListener('click', () => loadTrack(currentIndex - 1, !audio.paused));
      root.querySelector('.next').addEventListener('click', () => loadTrack(currentIndex + 1, !audio.paused));
      const resumeOnInteraction = (event) => {
        // The player's own controls already handle the gesture.
        if (event.composedPath().includes(this)) return;
        if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
        void startPlayback(true);
      };
      const stopWaitingForInteraction = () => {
        document.removeEventListener('click', resumeOnInteraction);
        document.removeEventListener('keydown', resumeOnInteraction);
      };
      this.stopWaitingForInteraction = stopWaitingForInteraction;
      document.addEventListener('click', resumeOnInteraction);
      document.addEventListener('keydown', resumeOnInteraction);
      audio.addEventListener('play', () => {
        stopWaitingForInteraction();
        updateTransport();
      });
      audio.addEventListener('pause', updateTransport);
      audio.addEventListener('playing', () => {
        player.setAttribute('data-spinning', '');
        error.textContent = '';
      });
      audio.addEventListener('waiting', () => player.removeAttribute('data-spinning'));
      audio.addEventListener('ended', () => loadTrack(currentIndex + 1, true));
      audio.addEventListener('error', () => {
        error.textContent = '음원을 읽을 수 없어요.';
        player.removeAttribute('data-spinning');
        updateTransport();
      });

      loadTrack(0, false);
      void startPlayback(true);
    }

    disconnectedCallback() {
      this.stopWaitingForInteraction?.();
      this.shadowRoot?.querySelector('audio').pause();
    }
  }

  customElements.define(tag, SinggyulCdPlayer);
})();
