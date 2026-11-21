# 생일 마켓 미니 CD 플레이어

`index.html`을 브라우저에서 열면 빈 페이지 우하단에 플레이어가 표시됩니다. CD를 누르면 재생하거나 일시정지할 수 있습니다. 아래 순서대로 재생되며 마지막 곡이 끝나면 처음으로 돌아갑니다. 아티스트 이름 옆에 `(cover by singgyul)`이 표시됩니다.

## 페이지에 넣기

`singgyul-cd-player.js`, `singgyul-cd-player.css`, `audio/`를 같은 폴더에 두고 페이지에 아래 태그를 넣습니다. 경로는 정적 파일을 올린 위치에 맞춰 조정합니다.

```html
<singgyul-cd-player></singgyul-cd-player>
<script src="/singgyul-cd-player/singgyul-cd-player.js" defer></script>
```

왼쪽 아래에 두려면 `<singgyul-cd-player side="left"></singgyul-cd-player>`를 사용합니다.

## 곡 정보

1. 겨울아이는 수지 버전으로 표시합니다.
2. Winter Wonderland는 Richard Himber 악단을 표시합니다. [Great American Songbook Foundation](https://thesongbook.org/about/news-media/the-songbook-blog-items/processing-the-richard-himber-collection/)
3. Fly Me to the Moon은 첨부 클립의 표기에 따라 Frank Sinatra 버전으로 표시합니다. [Frank Sinatra 공식 음원](https://www.youtube.com/watch?v=JYuyWrkwpok)
4. 눈은 Zion.T (Feat. 이문세)를 표시합니다. [Zion.T 공식 음원](https://www.youtube.com/watch?v=m4L0_kwPpso)
