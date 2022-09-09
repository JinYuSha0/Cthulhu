import fs from "fs";

const Cache: Map<string, string> = new Map();

export default function (filePath: string): string {
  if (Cache.has(filePath)) return Cache.get(filePath)!;
  try {
    const content = fs.readFileSync(filePath).toString();
    Cache.set(filePath, content);
    return content;
  } catch {
    return "";
  }
}
