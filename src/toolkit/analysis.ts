import Context from "../context";
import classAnalysis from "./classAnalysis";
import importPackageScan from "./importPackageScan";

export default function analysis(
  filePath: string,
  parent: Context | null,
  config: Config
): Context {
  const contextRef: { current: Context | null } = { current: null };
  const context = new Context({
    ...classAnalysis(filePath, parent, config, contextRef),
  });
  contextRef.current = context;

  const childs = importPackageScan(context, config);
  childs.forEach((path) => {
    context.children.push(analysis(path, context, config));
  });

  return context;
}
