import path from "path";
import fs from "fs";
import Context from "../context";
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
  MethodDeclaratorCtx,
  FqnOrRefTypePartFirstCtx,
  VariableDeclaratorIdCtx,
} from "java-parser";
import { deduplicationByField } from "./utils";

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

export default function analysis(
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
    methods: MethodMember[];
    attribute: ClassMember[];
  };
} {
  let isAnalyzed = true;
  let packageName = "";
  let className =
    filePath
      .match(new RegExp(`^.*?\\${path.sep}([^\\${path.sep}]*)$`))?.[1]
      ?.replace(".java", "") ?? "";
  let isConstruct = false;
  const filecontent = fileRead(filePath);
  const importPackage: ClassMember[] = [];
  const childClass: ClassMember[] = [];
  const methods: MethodMember[] = [];
  const attribute: ClassMember[] = [];
  class MethodController extends BaseJavaCstVisitorWithDefaults {
    private isMethod = false;
    public methodMember: MethodMember;
    private variableDeclaratorIds: Set<string> = new Set();
    private fqnOrRefTypePartFirsts: Set<string> = new Set();
    private formalParameterLists: Set<string> = new Set();

    constructor(methodMember: MethodMember) {
      super();
      this.methodMember = methodMember;
    }

    methodDeclarator(ctx: MethodDeclaratorCtx, param?: any) {
      this.isMethod = !!methods.find(
        (item) => item.name === ctx.Identifier[0].image
      );
      ctx.formalParameterList?.[0].children.formalParameter.forEach((item) => {
        const image =
          item.children.variableParaRegularParameter?.[0].children
            .variableDeclaratorId?.[0].children.Identifier?.[0].image;
        if (image) this.formalParameterLists.add(image);
      });
    }

    // 方法内的零时遍历
    variableDeclaratorId(ctx: VariableDeclaratorIdCtx, param?: any) {
      this.variableDeclaratorIds.add(ctx.Identifier[0].image);
    }

    // 引用的对象
    fqnOrRefTypePartFirst(ctx: FqnOrRefTypePartFirstCtx, param?: any) {
      const name = ctx.fqnOrRefTypePartCommon[0].children.Identifier?.[0].image;
      if (!!name) {
        this.fqnOrRefTypePartFirsts.add(name);
      }
    }

    // 方法依赖分析
    dependsAnalysis(
      packageName: string,
      imports: ClassMember[],
      attribute: ClassMember[]
    ) {
      const dependNames = new Set([...Array.from(this.fqnOrRefTypePartFirsts)]);
      // 零时变量
      this.variableDeclaratorIds.forEach((v) => {
        dependNames.delete(v);
      });
      // 函数入参变量
      this.formalParameterLists.forEach((v) => {
        dependNames.delete(v);
      });
      dependNames.forEach((v) => {
        const importDep = imports.find((item) => item.name === v);
        if (importDep) {
          this.methodMember.depends.push(importDep);
          return;
        }

        const attrDep = attribute.find((item) => item.name === v);
        if (attrDep) {
          this.methodMember.depends.push(attrDep);
          return;
        }

        // 同目录下依赖
        const filename = filePath.match(
          new RegExp(`^.*?\\${path.sep}([^\\${path.sep}]*)$`)
        )?.[1];
        if (filename) {
          const path = filePath.replace(filename, `${v}.java`);
          if (fs.existsSync(path)) {
            const content = `import ${packageName}.${v};`;
            this.methodMember.depends.push({
              type: "import",
              isPublic: false,
              isStatic: false,
              name: v,
              content,
              ctxRef,
            });
          }
        }
      });
    }
  }
  const methodControllers: MethodController[] = [];
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
              const methodMember: MethodMember = {
                type: "method",
                isPublic,
                isStatic,
                name,
                content,
                ctxRef,
                depends: [],
              };
              methods.push(methodMember);
              const methodController = new MethodController(methodMember);
              methodController.visit(ctx.methodDeclaration);
              methodControllers.push(methodController);
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
  methodControllers.forEach((controller) =>
    controller.dependsAnalysis(packageName, importPackage, attribute)
  );
  let importPackageConcat: ClassMember[] = [...importPackage];
  methods.map((method) => {
    importPackageConcat = importPackageConcat.concat(method.depends);
  });
  const finallyDeps = deduplicationByField<ClassMember>(
    importPackageConcat,
    "content"
  );
  return {
    isAnalyzed,
    packageName,
    className,
    isConstruct,
    member: {
      importPackage: finallyDeps,
      childClass,
      methods,
      attribute,
    },
  };
}
