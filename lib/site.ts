// Add the video to public/videos, then set e.g. '/videos/birthday.mp4'.
// Keep null until the actual video is ready: no missing video requests or fake play button.
export const heroMedia: { poster: string; video: string | null } = {
  poster: '/birthday-hero.png',
  video: null,
};
