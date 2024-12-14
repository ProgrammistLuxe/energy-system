export interface Difference {
  [key: string]: {
    currentValue: string;
    oldValue: string;
  };
}
