export interface FileStore {
  read(file: string): Promise<string>;
  write(file: string, content: string): Promise<void>;
}
