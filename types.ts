export interface Participant {
  id: string;
  name: string;
  color: string;
}

export interface WheelState {
  rotation: number; // in degrees
  velocity: number; // degrees per frame
  isSpinning: boolean;
  winner: Participant | null;
}
