interface Restaurant {
  name: string;
}

declare global {
  interface AllTypes {
    restaurant: Restaurant;
  }
}

export {};
