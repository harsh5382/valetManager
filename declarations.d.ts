declare module "expo-file-system" {
  export const documentDirectory: string | null;
  export function moveAsync(options: {
    from: string;
    to: string;
  }): Promise<void>;
}
