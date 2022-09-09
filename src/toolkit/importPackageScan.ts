import Context from "../context";

function matchPackage(content: string): string {
  return content.match(/import\s+(.*?);/)?.[1] ?? "";
}

function computeChildFilePath(
  rootPackage: string,
  childPackage: string,
  parentFilePath: string
): string {
  const path = rootPackage.replace(/\./g, "/");
  const diff = childPackage.replace(rootPackage, "").split(".");
  const result = parentFilePath.replace(
    new RegExp(`\/${path}\/.*`),
    `\/${path}${diff.join("/")}.java`
  );
  return result;
}

export default function (context: Context, config: Config) {
  const { filePath } = context;
  const { importPackage } = context.member;
  const { package_white_list } = config;
  const result: Map<string, string> = new Map();

  const packages = importPackage.map(({ content }) => matchPackage(content));
  packages.forEach((packageName) => {
    let include = false;
    let rootPackage = "";
    try {
      package_white_list.forEach((white) => {
        if (packageName.startsWith(white)) {
          include = true;
          rootPackage = white;
          throw new Error();
        }
      });
    } catch {}
    if (include) {
      result.set(
        packageName,
        computeChildFilePath(rootPackage, packageName, filePath)
      );
    }
  });

  return result;
}
