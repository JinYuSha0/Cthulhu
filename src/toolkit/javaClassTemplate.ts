import fsWrite from "./fsWrite";

export default class JavaClassTemplate {
  public classPath: string;
  public className: string;
  public map: Map<string, string>;
  public config: Config;
  public importMember: ClassMember[] = [];
  public attrMember: ClassMember[] = [];
  public methodMember: MethodMember[] = [];
  public classMember: ChildClassMemeber[] = [];
  private methodContent: string;

  constructor(classPath: string, map: Map<string, string>, config: Config) {
    this.config = config;
    this.classPath = classPath;
    this.map = map;
    const splits = classPath.split(".");
    this.className = splits[splits.length - 1];
    this.delMethodDep = this.delMethodDep.bind(this);
    this.delClassDep = this.delClassDep.bind(this);
  }

  private attrRename(member: ClassMember): string {
    return member.content.replace(
      new RegExp(`${member.name}\\s+=`),
      `${member.newName} =`
    );
  }

  private methodRename(content: string, newName: string): string {
    return content.replace(/\s+\w+\s?\(/, ` ${newName}(`);
  }

  private childClassRename(member: ClassMember): string {
    return member.content
      .replace(
        new RegExp(`class\\s+${member.name}\\s?{`),
        `class ${member.newName} {`
      )
      .replace(new RegExp(`${member.name}\\s?\\(`), `${member.newName} (`);
  }

  private delMethodDep(methodMember: MethodMember) {
    const {
      type,
      name: _name,
      content: _content,
      depends,
      newName,
    } = methodMember;
    let c = _content;

    depends.forEach((dep) => {
      const { content, name } = dep;
      const classPath = content.match(/import\s+(.*?);/)[1];
      const classPathSplit = classPath.split(".");
      const className = classPathSplit[classPathSplit.length - 1];
      let newPath = `${className}`;
      if (name !== className) {
        const getPath = this.map.get(`${classPath}.${name}`);
        const getPathSplit = getPath.split(".");
        newPath = getPathSplit
          .slice(getPathSplit.length - 2, getPathSplit.length)
          .join(".");
      } else if (
        classPath.includes(this.config.root_package) &&
        className !== "BuildConfig"
      ) {
        const _match = c.match(
          new RegExp(`${className}\\..*?([\\(|,|\\)])`, "g")
        );
        if (_match) {
          const match = _match.map((text) => text.slice(0, text.length - 1));
          match.forEach((item) => {
            const a = `${classPath}.${item.match(/[^.]*?\.(.*)/)[1]}`;
            const b = this.map.get(a);
            if (b) {
              const bSplit = b.split(".");
              const call = bSplit.slice(bSplit.length - 2, bSplit.length);
              const classPath = bSplit.slice(0, bSplit.length - 1).join(".");
              const name = bSplit[bSplit.length - 2];
              c = c.replace(new RegExp(item, "g"), call.join("."));
              this.importMember = this.importMember.filter(
                (m) => m.name !== item.split(".")[0]
              );
              this.importMember.push({
                type: "import",
                isPublic: false,
                isStatic: false,
                content: `import ${classPath};`,
                name,
                ctxRef: null,
              });
            }
          });
        }
      }
      try {
        if (className !== name && !(type === "method" && _name === name)) {
          c = c.replace(
            new RegExp(`${name}([\\s|\(|>|\.]+)`, "g"),
            `${newPath}$1`
          );
        }
        // if ()
      } catch {}
    });
    return this.methodRename(c, newName);
  }

  private delClassDep(classMember: ClassMember) {
    return this.childClassRename(classMember);
  }

  private delImportDep(importMember: ClassMember[]) {
    const classPathSet = new Set<string>();
    importMember.forEach((item) => {
      const classPath = item.content.match(/import\s+(.*?);/)[1];
      const classPathSplit = classPath.split(".");
      if (classPathSplit[classPathSplit.length - 1] !== item.name) {
        const newMemberPath = this.map.get(`${classPath}.${item.name}`);
        const newClassPath = newMemberPath.match(/.*(?=\..*)/)[0];
        classPathSet.add(newClassPath);
      } else {
        classPathSet.add(classPath);
      }
    });
    return Array.from(classPathSet)
      .map((path) => `import ${path};`)
      .join("\r\n");
  }

  template() {
    const split = this.classPath.split(".");
    const classPath = split.slice(0, split.length - 1).join(".");
    return `
    package ${this.config.root_package}.${classPath};
    ${this.delImportDep(this.importMember)}
    public class ${this.className} {
        ${this.attrMember.map(this.attrRename).join("\r\n")}
        ${this.methodContent}
        ${this.classMember.map(this.delClassDep).join("\r\n")}
    }`;
  }

  addImport(imp: ClassMember | ClassMember[]) {
    if (imp instanceof Array) {
      this.importMember = [...this.importMember, ...imp];
    } else {
      this.importMember.push(imp);
    }
  }

  addAttr(attr: ClassMember) {
    this.attrMember.push(attr);
  }

  addMethod(method: MethodMember) {
    this.methodMember.push(method);
  }

  addClass(clazz: ChildClassMemeber) {
    this.classMember.push(clazz);
  }

  create() {
    this.methodContent = this.methodMember.map(this.delMethodDep).join("\r\n");
    const content = this.template().replace(
      new RegExp("private", "g"),
      "public"
    );
    fsWrite(this.classPath, content, this.config);
  }
}
