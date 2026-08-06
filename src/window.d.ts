export {};

declare global {
  interface Window {
    threecut: {
      app: {
        getUserDataPath: () => Promise<string>;
      };
    };
  }
}
