const ADJECTIVES = [
  'Bright', 'Silent', 'Happy', 'Curious', 'Neon', 'Cosmic', 'Swift',
  'Bold', 'Calm', 'Clever', 'Cool', 'Dark', 'Dreamy', 'Electric',
  'Fuzzy', 'Gentle', 'Glowing', 'Golden', 'Grand', 'Icy', 'Jade',
  'Lucky', 'Mighty', 'Mystic', 'Noble', 'Pale', 'Quick', 'Quiet',
  'Radiant', 'Rosy', 'Royal', 'Ruby', 'Rusty', 'Sandy', 'Shiny',
  'Silver', 'Sleek', 'Smooth', 'Solar', 'Speedy', 'Stormy', 'Sunny',
  'Tiny', 'Turbo', 'Vivid', 'Wild', 'Witty', 'Zesty', 'Blue', 'Green',
  'Purple', 'Amber', 'Crimson', 'Teal', 'Violet', 'Scarlet', 'Indigo',
  'Lunar', 'Stellar', 'Daring', 'Fierce', 'Frosty', 'Humble', 'Jolly',
];

const ANIMALS = [
  'Fox', 'Tiger', 'Panda', 'Wolf', 'Falcon', 'Hawk', 'Eagle', 'Bear',
  'Lynx', 'Otter', 'Deer', 'Crow', 'Raven', 'Cobra', 'Viper', 'Shark',
  'Whale', 'Dolphin', 'Penguin', 'Parrot', 'Owl', 'Rabbit', 'Badger',
  'Ferret', 'Gecko', 'Iguana', 'Jaguar', 'Koala', 'Lemur', 'Meerkat',
  'Narwhal', 'Ocelot', 'Panther', 'Quokka', 'Raccoon', 'Salamander',
  'Tapir', 'Uakari', 'Wombat', 'Yak', 'Zebu', 'Bison', 'Capybara',
  'Dingo', 'Elk', 'Flamingo', 'Gorilla', 'Hedgehog', 'Ibis', 'Jackal',
  'Kiwi', 'Llama', 'Moose', 'Newt', 'Opossum', 'Peacock', 'Quail',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = randomInt(10, 99);
  return `${adj}${animal}${num}`;
}

export function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9]{3,30}$/.test(username);
}
