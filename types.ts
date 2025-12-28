
export interface HistoricalEvent {
  id: string;
  title: string;
  period: string;
  description: string;
  image: string;
  keywords: string[];
}

export interface DialogueItem {
  speaker: string;
  text: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export interface PodcastContent {
  event: HistoricalEvent;
  script: DialogueItem[];
  audioBuffer?: AudioBuffer;
}
