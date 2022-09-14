import Context from "../context";

const table: Map<string, ClassMember> = new Map();
const constructTable: Map<string, Context> = new Map();

export default function memberExpand(
  context: Context
): [Map<string, ClassMember>, Map<string, Context>] {
  if (context.isAnalyzed) {
    const { packageName, className } = context;
    const classpath = `${packageName}.${className}`;
    if (
      !context.isConstruct &&
      !context.config.construct_white_list.includes(context.packageName) &&
      !context.config.class_white_list.includes(classpath) &&
      context.member.attribute.filter((attr) => !attr.isStatic).length === 0 &&
      context.member.methods.filter((attr) => !attr.isStatic).length === 0
    ) {
      context.member.attribute.forEach((item) => {
        table.set(`${classpath}.$${item.name}`, item);
      });
      context.member.childClass.forEach((item) => {
        table.set(`${classpath}.$${item.name}`, item);
      });
      context.member.methods.forEach((item) => {
        table.set(`${classpath}.$${item.name}`, item);
      });
    } else {
      constructTable.set(context.className, context);
    }
    if (context.children.length) {
      context.children.forEach((ctx) => {
        memberExpand(ctx);
      });
    }
  }
  return [table, constructTable];
}
