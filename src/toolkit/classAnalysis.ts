import fileRead from "./fileRead";
import {
  parse,
  BaseJavaCstVisitorWithDefaults,
  ClassMemberDeclarationCtx,
  ImportDeclarationCtx,
  ClassModifierCstNode,
  MethodModifierCstNode,
  FieldModifierCstNode,
  PackageDeclarationCtx,
  ConstructorDeclarationCtx,
} from "java-parser";
import Context from "../context";

function modifiersDetect(
  modifiers:
    | ClassModifierCstNode[]
    | MethodModifierCstNode[]
    | FieldModifierCstNode[]
    | undefined
): [boolean, boolean] {
  let isPublic = false,
    isStatic = false;
  if (!modifiers) return [isPublic, isStatic];
  for (let i = 0; i < modifiers.length; i++) {
    if (!!modifiers[i].children.Public) {
      isPublic = true;
    }
    if (!!modifiers[i].children.Static) {
      isStatic = true;
    }
  }
  return [isPublic, isStatic];
}

export default function scan(
  filePath: string,
  ctxRef: { current: Context | null }
): {
  isAnalyzed: boolean;
  packageName: string;
  className: string;
  isConstruct: boolean;
  member: {
    importPackage: ClassMember[];
    childClass: ClassMember[];
    methods: ClassMember[];
    attribute: ClassMember[];
  };
} {
  let isAnalyzed = true;
  let packageName = "";
  let className =
    filePath.match(/^.*?\/([^\/]*)$/)?.[1]?.replace(".java", "") ?? "";
  let isConstruct = false;
  const filecontent = fileRead(filePath);
  const importPackage: ClassMember[] = [];
  const childClass: ClassMember[] = [];
  const methods: ClassMember[] = [];
  const attribute: ClassMember[] = [];
  if (filecontent) {
    class Controller extends BaseJavaCstVisitorWithDefaults {
      packageDeclaration(ctx: PackageDeclarationCtx, param?: any) {
        packageName = ctx.Identifier.map((item) => item.image).join(".");
      }

      constructorDeclaration(ctx: ConstructorDeclarationCtx, param?: any) {
        isConstruct = true;
      }

      importDeclaration(ctx: ImportDeclarationCtx, param?: any) {
        const Inentifiers = ctx.packageOrTypeName?.[0]?.children?.Identifier;
        if (Inentifiers) {
          const name = Inentifiers[Inentifiers.length - 1].image;
          const content = `import ${Inentifiers.map((item) => item.image).join(
            "."
          )};`;
          importPackage.push({
            type: "import",
            isPublic: false,
            isStatic: false,
            name,
            content,
            ctxRef,
          });
        }
      }

      classMemberDeclaration(ctx: ClassMemberDeclarationCtx, param?: any) {
        if (ctx.fieldDeclaration) {
          const modifiers = ctx.fieldDeclaration?.[0]?.children.fieldModifier;
          const [isPublic, isStatic] = modifiersDetect(modifiers);
          const name =
            ctx.fieldDeclaration?.[0]?.children.variableDeclaratorList?.[0]
              .children.variableDeclarator?.[0].children.variableDeclaratorId[0]
              .children.Identifier[0].image;
          const { startOffset, endOffset } =
            ctx.fieldDeclaration?.[0]?.location;
          if (name && endOffset) {
            const content = filecontent.slice(startOffset, endOffset + 1);
            attribute.push({
              type: "attribute",
              isPublic,
              isStatic,
              name,
              content,
              ctxRef,
            });
          }
        }

        // 静态类匹配
        if (ctx.classDeclaration) {
          const modifiers = ctx.classDeclaration?.[0]?.children.classModifier;
          const [isPublic, isStatic] = modifiersDetect(modifiers);
          const name =
            ctx.classDeclaration?.[0]?.children.normalClassDeclaration?.[0]
              .children.typeIdentifier?.[0].children.Identifier[0].image;
          const { startOffset, endOffset } =
            ctx.classDeclaration?.[0].location ?? {};
          if (name && endOffset) {
            const content = filecontent.slice(startOffset, endOffset + 1);
            childClass.push({
              type: "class",
              isPublic,
              isStatic,
              name,
              content,
              ctxRef,
            });
          }
        }

        // 静态方法匹配
        if (ctx.methodDeclaration) {
          const modifiers =
            ctx.methodDeclaration?.[0]?.children?.methodModifier;
          const [isPublic, isStatic] = modifiersDetect(modifiers);
          const name =
            ctx.methodDeclaration?.[0].children?.methodHeader?.[0].children
              .methodDeclarator?.[0].children.Identifier?.[0].image;
          const { startOffset, endOffset } =
            ctx.methodDeclaration?.[0].location ?? {};
          if (endOffset) {
            const content = filecontent.slice(startOffset, endOffset + 1);
            if (!!name && endOffset) {
              methods.push({
                type: "method",
                isPublic,
                isStatic,
                name,
                content,
                ctxRef,
              });
            }
          }
        }
      }
    }
    const controller = new Controller();
    const cst = parse(filecontent);
    controller.visit(cst);
  } else {
    isAnalyzed = false;
  }
  return {
    isAnalyzed,
    packageName,
    className,
    isConstruct,
    member: {
      importPackage,
      childClass,
      methods,
      attribute,
    },
  };
}
