import type { Tags } from "@/types";
import { create } from "zustand";

import { parseAudioMetadata } from "@/utils/tagparser";

type AudioElem = HTMLAudioElement | null;

const defaultState = {
  audio: null as AudioElem,
  isPlaying: false,
  duration: 0,
  isLooping: false,
  isMuted: false,
  volume: 1,
  isEnded: false,
  currentTime: 0,
  metadata: {
    artist: "Unknown artist",
    title: "Unknown title",
    cover: "",
  },
  metadataParsingController: null as AbortController | null,
  error: "",
  handlers: {
    nextItem: (_: string) => {},
    prevItem: (_: string) => {},
  },
};

type PlayerState = typeof defaultState & {
  actions: {
    seek: (value: number) => void;
    setVolume: (value: number) => void;
    togglePlay: () => void;
    toggleMute: () => void;
    toggleLooping: () => void;
    loadAudio: (url: string, name: string) => void;
    set: (payload: Partial<PlayerState>) => void;
    reset: () => void;
    setCurrentTime: (value: number) => void;
    setHandlers: (handlers: (typeof defaultState)["handlers"]) => void;
  };
};

export const useAudioStore = create<PlayerState>((set, get) => ({
  ...defaultState,
  actions: {
    loadAudio: async (url, name) => {
      const state = get();
      let audio = state.audio;

      if (!audio) {
        audio = new Audio();
        audio.addEventListener("ended", () => {
          set((prev) => {
            prev.handlers.nextItem("audio");
            return { ...prev, isEnded: true, currentTime: 0 };
          });
        });
        audio.addEventListener("loadedmetadata", () =>
          set((prev) => ({
            ...prev,
            isPlaying: true,
            duration: audio?.duration || 0,
          })),
        );
        audio.addEventListener("play", () => set((prev) => ({ ...prev, isPlaying: true })));
        audio.addEventListener("pause", () => set((prev) => ({ ...prev, isPlaying: false })));
      }

      if (audio instanceof HTMLAudioElement) {
        try {
          audio.pause();
          audio.currentTime = 0;

          const controller = new AbortController();
          const signal = controller.signal;

          if (state.metadataParsingController) state.metadataParsingController.abort();

          set((prev) => ({ ...prev, metadataParsingController: controller }));

          const tags = await parseAudioMetadata(url, signal);
          const { artist, title, picture, album } = tags as Tags;
          let cover = "";
          if (picture) cover = URL.createObjectURL(picture);
          const metadata = {
            artist: artist || defaultState.metadata.artist,
            title: title || name,
            cover,
          };
          audio.src = url;
          audio.autoplay = true;
          audio.load();

          if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title,
              artist,
              album,
              artwork: [
                {
                  src: cover,
                  type: "image/jpeg",
                },
              ],
            });
          }
          set((prev) => ({
            ...prev,
            audio,
            isPlaying: true,
            isEnded: false,
            metadata,
            currentTime: 0,
            error: "",
          }));
        } catch (error) {
          if ((error as Error).name !== "AbortError")
            set((prev) => ({ ...prev, error: (error as Error).message }));
        } finally {
          set((prev) => ({ ...prev, metadataParsingController: null }));
        }
      }
    },
    seek: (value) =>
      set((state) => {
        const audio = state.audio;
        if (audio instanceof HTMLAudioElement) {
          audio.currentTime = value;
          return { ...state, currentTime: value };
        }
        return state;
      }),
    setVolume: (value) =>
      set((state) => {
        const audio = state.audio;
        if (audio instanceof HTMLAudioElement) {
          audio.volume = value;
          return { ...state, volume: value };
        }
        return state;
      }),
    setCurrentTime: (value) => set((state) => ({ ...state, currentTime: value })),
    togglePlay: () =>
      set((state) => {
        const { audio, isPlaying } = state;
        const shouldPlay = !isPlaying;
        if (audio instanceof HTMLAudioElement) {
          shouldPlay ? audio.play() : audio.pause();
          return { ...state, isPlaying: shouldPlay };
        }
        return state;
      }),
    toggleMute: () =>
      set((state) => {
        const audio = state.audio;
        if (audio instanceof HTMLAudioElement) {
          audio.muted = !audio.muted;
          return { ...state, isMuted: audio.muted };
        }
        return state;
      }),
    toggleLooping: () =>
      set((state) => {
        const audio = state.audio;
        if (audio instanceof HTMLAudioElement) {
          audio.loop = !audio.loop;
          return { ...state, isLooping: audio.loop };
        }
        return state;
      }),
    set: (payload) => set((state) => ({ ...state, ...payload })),
    reset: () => set(() => ({ ...defaultState })),
    setHandlers: (handlers) => set((state) => ({ ...state, handlers })),
  },
}));
export const audioActions = (state: PlayerState) => state.actions;
