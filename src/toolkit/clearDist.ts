import fs from "fs";
import path from "path";

export default function () {
  fs.rmSync(path.join(__dirname, "../../dist"), { recursive: true });
  fs.mkdirSync(path.join(__dirname, "../../dist"));
}
