import Context from "../context";
import { randomStr } from "./utils";

const table: Map<string, ClassMember> = new Map();
const constructTable: Map<string, Context> = new Map();

export default function memberExpand(
  context: Context
): [Map<string, ClassMember>, Map<string, Context>] {
  if (context.isAnalyzed) {
    const { packageName, className } = context;
    const classpath = `${packageName}.${className}`;
    function dealItem(item: ClassMember) {
      item.newName = randomStr(
        context.config.random_member_name_str_length[0],
        context.config.random_member_name_str_length[1]
      );
      table.set(`${classpath}.${item.name}`, item);
    }
    if (
      !context.isConstruct &&
      !context.config.construct_white_list.includes(context.packageName) &&
      !context.config.class_white_list.includes(classpath) &&
      context.member.attribute.filter((attr) => !attr.isStatic).length === 0 &&
      context.member.methods.filter((attr) => !attr.isStatic).length === 0
    ) {
      context.member.attribute.forEach(dealItem);
      context.member.childClass.forEach(dealItem);
      context.member.methods.forEach(dealItem);
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
