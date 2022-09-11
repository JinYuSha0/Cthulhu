import fs from "fs";
import path from "path";

export default function (pathname: string, content: string, config: Config) {
  const pathSplit = pathname.split(".");
  const dirpath = path.join(
    config.output,
    pathSplit.slice(0, pathSplit.length - 2).join(path.sep)
  );
  if (pathSplit.length > 1) {
    fs.mkdirSync(dirpath, {
      recursive: true,
    });
  }
  fs.writeFileSync(
    path.join(dirpath, `${pathSplit[pathSplit.length - 1]}.java`),
    content
  );
}
