#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

class FrontendAnalyzer {
  constructor(rootPath = ".") {
    this.rootPath = path.resolve(rootPath);
    this.report = {
      projectName: path.basename(this.rootPath),
      timestamp: new Date().toISOString(),
      packageJson: null,
      structure: {},
      components: [],
      pages: [],
      apiCalls: [],
      imports: new Set(),
      dependencies: [],
      devDependencies: [],
      issues: [],
    };
  }

  // Ejecutar el análisis
  async analyze() {
    console.log(
      `${colors.bright}${colors.cyan}🔍 Analizando estructura del frontend...${colors.reset}\n`,
    );

    await this.readPackageJson();
    this.analyzeDirectory(this.rootPath);
    this.findComponents();
    this.findApiCalls();
    this.checkIssues();
    this.generateReport();

    return this.report;
  }

  // Leer package.json
  async readPackageJson() {
    const packagePath = path.join(this.rootPath, "package.json");
    if (fs.existsSync(packagePath)) {
      try {
        const content = await fs.promises.readFile(packagePath, "utf8");
        this.report.packageJson = JSON.parse(content);
        this.report.dependencies = Object.keys(
          this.report.packageJson.dependencies || {},
        );
        this.report.devDependencies = Object.keys(
          this.report.packageJson.devDependencies || {},
        );
        console.log(`${colors.green}✅ package.json encontrado${colors.reset}`);
        console.log(
          `${colors.blue}📦 Tipo: ${this.report.packageJson.type || "CommonJS"}${colors.reset}`,
        );
      } catch (error) {
        this.report.issues.push(`Error leyendo package.json: ${error.message}`);
      }
    } else {
      this.report.issues.push("package.json no encontrado");
    }
  }

  // Analizar directorio recursivamente
  analyzeDirectory(dirPath, relativePath = "") {
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relPath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);

        // Ignorar node_modules, .git y carpetas ocultas
        if (item === "node_modules" || item === ".git" || item.startsWith("."))
          continue;

        if (stat.isDirectory()) {
          // Es directorio
          if (!this.report.structure[relPath]) {
            this.report.structure[relPath] = { files: [], subdirs: [] };
          }
          this.analyzeDirectory(fullPath, relPath);
        } else {
          // Es archivo
          const ext = path.extname(item);
          if (
            [
              ".js",
              ".jsx",
              ".ts",
              ".tsx",
              ".vue",
              ".css",
              ".scss",
              ".mjs",
              ".cjs",
            ].includes(ext)
          ) {
            this.analyzeFile(fullPath, relPath);
          }

          // Agregar a estructura
          const dir =
            path.dirname(relPath) === "." ? "/" : path.dirname(relPath);
          if (!this.report.structure[dir]) {
            this.report.structure[dir] = { files: [], subdirs: [] };
          }
          this.report.structure[dir].files.push({
            name: item,
            path: relPath,
            size: stat.size,
            ext: ext,
          });
        }
      }
    } catch (error) {
      console.error(`Error analizando ${dirPath}:`, error);
    }
  }

  // Analizar archivo individual
  analyzeFile(filePath, relPath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const ext = path.extname(filePath);

      // Buscar imports (ES Modules)
      const importRegex =
        /import\s+.*?\s+from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        this.report.imports.add(match[1] || match[2]);
      }

      // Buscar requires (CommonJS)
      const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        this.report.imports.add(match[1]);
      }

      // Buscar llamadas API
      const apiPatterns = [
        /fetch\s*\(/g,
        /axios\.(get|post|put|delete|patch)/g,
        /\$\.(get|post|ajax)/g,
        /http\.(get|post)/g,
        /api\.(get|post)/g,
      ];

      const lines = content.split("\n");
      const apiLines = [];

      lines.forEach((line, index) => {
        apiPatterns.forEach((pattern) => {
          if (pattern.test(line)) {
            apiLines.push({ line: index + 1, text: line.trim() });
          }
        });
      });

      if (apiLines.length > 0) {
        this.report.apiCalls.push({
          file: relPath,
          lines: apiLines.slice(0, 5), // Limitar a 5 líneas por archivo
        });
      }

      // Identificar componentes (archivos con export de componente)
      const componentPatterns = [
        "export default",
        "export const",
        "export function",
        "export class",
        "export {",
      ];

      const isComponent = componentPatterns.some((pattern) =>
        content.includes(pattern),
      );

      if (isComponent) {
        if (
          relPath.includes("/components/") ||
          relPath.includes("\\components\\")
        ) {
          this.report.components.push(relPath);
        } else if (
          relPath.includes("/pages/") ||
          relPath.includes("\\pages\\") ||
          relPath.includes("/views/") ||
          relPath.includes("\\views\\")
        ) {
          this.report.pages.push(relPath);
        }
      }
    } catch (error) {
      // Ignorar errores de archivos binarios
      if (!error.message.includes("EISDIR")) {
        console.error(`Error analizando ${relPath}:`, error.message);
      }
    }
  }

  // Buscar componentes específicos
  findComponents() {
    // Ya se llenó durante el análisis de archivos
  }

  // Buscar llamadas API específicas
  findApiCalls() {
    // Ya se llenó durante el análisis de archivos
  }

  // Verificar problemas comunes
  checkIssues() {
    // Verificar si hay variables de entorno
    if (
      !fs.existsSync(path.join(this.rootPath, ".env")) &&
      !fs.existsSync(path.join(this.rootPath, ".env.local"))
    ) {
      this.report.issues.push("⚠️ Archivo .env no encontrado");
    }

    // Verificar estructura de carpetas común
    const commonDirs = ["src", "public", "components", "pages", "api"];
    commonDirs.forEach((dir) => {
      if (
        !fs.existsSync(path.join(this.rootPath, dir)) &&
        !fs.existsSync(path.join(this.rootPath, "src", dir))
      ) {
        // No hacer nada, solo informar si queremos
      }
    });

    // Verificar dependencias comunes para API
    const apiDeps = [
      "axios",
      "react-query",
      "@tanstack/react-query",
      "swr",
      "graphql-request",
    ];
    const foundApiDeps = apiDeps.filter(
      (dep) =>
        this.report.dependencies.includes(dep) ||
        this.report.devDependencies.includes(dep),
    );

    if (foundApiDeps.length === 0) {
      this.report.issues.push(
        "ℹ️ No se encontraron librerías API comunes (considera instalar axios o react-query)",
      );
    }

    // Verificar si hay carpeta api
    const apiPaths = [
      path.join(this.rootPath, "src", "api"),
      path.join(this.rootPath, "api"),
      path.join(this.rootPath, "services"),
    ];

    const hasApiFolder = apiPaths.some((p) => fs.existsSync(p));
    if (!hasApiFolder) {
      this.report.issues.push("ℹ️ No se encontró carpeta api/ o services/");
    }
  }

  // Generar reporte
  generateReport() {
    const reportFile = path.join(this.rootPath, "frontend-analysis.json");
    const reportMd = path.join(this.rootPath, "frontend-analysis.md");

    // Guardar JSON
    fs.writeFileSync(reportFile, JSON.stringify(this.report, null, 2));

    // Generar Markdown
    const md = this.generateMarkdown();
    fs.writeFileSync(reportMd, md);

    console.log(`${colors.green}✅ Análisis completado!${colors.reset}`);
    console.log(`${colors.blue}📊 Reporte JSON: ${reportFile}${colors.reset}`);
    console.log(`${colors.blue}📝 Reporte MD: ${reportMd}${colors.reset}`);
  }

  // Generar reporte en Markdown
  generateMarkdown() {
    let md = `# Análisis de Frontend: ${this.report.projectName}\n\n`;
    md += `**Fecha:** ${new Date(this.report.timestamp).toLocaleString()}\n`;
    md += `**Tipo de Módulo:** ${this.report.packageJson?.type || "CommonJS"}\n\n`;

    // Package.json
    md += `## 📦 package.json\n\n`;
    md += `**Nombre:** ${this.report.packageJson?.name || "N/A"}\n`;
    md += `**Versión:** ${this.report.packageJson?.version || "N/A"}\n\n`;

    md += `### Dependencias principales:\n`;
    const mainDeps = [
      "react",
      "vue",
      "angular",
      "next",
      "nuxt",
      "vite",
      "webpack",
    ];
    const foundMain = mainDeps.filter((d) =>
      this.report.dependencies.includes(d),
    );
    md += foundMain.map((d) => `- ${d}`).join("\n") + "\n\n";

    if (foundMain.length === 0) {
      md += "*No se detectó framework principal*\n\n";
    }

    // Estructura de carpetas
    md += `## 📁 Estructura de Carpetas\n\n`;
    md += "```\n";
    const dirs = Object.keys(this.report.structure).sort();
    dirs.forEach((dir) => {
      if (dir !== "/" && dir !== ".") {
        const depth = dir.split(path.sep).length;
        md += `${"  ".repeat(depth)}📁 ${path.basename(dir)}\n`;
        const files = this.report.structure[dir].files || [];
        files.slice(0, 5).forEach((file) => {
          md += `${"  ".repeat(depth + 1)}📄 ${file.name}\n`;
        });
        if (files.length > 5) {
          md += `${"  ".repeat(depth + 1)}... y ${files.length - 5} más\n`;
        }
      }
    });
    md += "```\n\n";

    // Componentes encontrados
    md += `## 🧩 Componentes Encontrados (${this.report.components.length})\n\n`;
    if (this.report.components.length > 0) {
      this.report.components.slice(0, 20).forEach((comp) => {
        md += `- \`${comp}\`\n`;
      });
      if (this.report.components.length > 20) {
        md += `\n*y ${this.report.components.length - 20} más...*\n`;
      }
    } else {
      md += "*No se encontraron componentes en /components*\n";
    }
    md += "\n";

    // Páginas encontradas
    md += `## 📄 Páginas Encontradas (${this.report.pages.length})\n\n`;
    if (this.report.pages.length > 0) {
      this.report.pages.slice(0, 20).forEach((page) => {
        md += `- \`${page}\`\n`;
      });
      if (this.report.pages.length > 20) {
        md += `\n*y ${this.report.pages.length - 20} más...*\n`;
      }
    } else {
      md += "*No se encontraron páginas en /pages*\n";
    }
    md += "\n";

    // Llamadas API
    md += `## 🌐 Llamadas API Detectadas\n\n`;
    if (this.report.apiCalls.length > 0) {
      this.report.apiCalls.slice(0, 10).forEach((api) => {
        md += `- **${api.file}**\n`;
        api.lines.slice(0, 3).forEach((line) => {
          md += `  - Línea ${line.line}: \`${line.text.substring(0, 70)}${line.text.length > 70 ? "..." : ""}\`\n`;
        });
        if (api.lines.length > 3) {
          md += `  - *... y ${api.lines.length - 3} más*\n`;
        }
      });
      if (this.report.apiCalls.length > 10) {
        md += `\n*y ${this.report.apiCalls.length - 10} archivos más con llamadas API*\n`;
      }
    } else {
      md += "*No se detectaron llamadas API explícitas*\n";
    }
    md += "\n";

    // Issues encontrados
    md += `## ⚠️ Issues Detectados\n\n`;
    if (this.report.issues.length > 0) {
      this.report.issues.forEach((issue) => {
        md += `- ${issue}\n`;
      });
    } else {
      md += "*No se encontraron issues*\n";
    }
    md += "\n";

    // Resumen
    md += `## 📊 Resumen\n\n`;
    md += `- **Total archivos analizados:** ${Object.values(this.report.structure).reduce((acc, dir) => acc + (dir.files?.length || 0), 0)}\n`;
    md += `- **Componentes:** ${this.report.components.length}\n`;
    md += `- **Páginas:** ${this.report.pages.length}\n`;
    md += `- **Archivos con llamadas API:** ${this.report.apiCalls.length}\n`;
    md += `- **Issues:** ${this.report.issues.length}\n`;

    return md;
  }
}

// Ejecutar el análisis
const analyzer = new FrontendAnalyzer(process.argv[2] || ".");
analyzer.analyze().then((report) => {
  console.log(
    `\n${colors.bright}${colors.green}📋 Resumen del análisis:${colors.reset}`,
  );
  console.log(
    `${colors.cyan}📁 Total archivos: ${Object.values(report.structure).reduce((acc, dir) => acc + (dir.files?.length || 0), 0)}${colors.reset}`,
  );
  console.log(
    `${colors.cyan}🧩 Componentes: ${report.components.length}${colors.reset}`,
  );
  console.log(
    `${colors.cyan}📄 Páginas: ${report.pages.length}${colors.reset}`,
  );
  console.log(
    `${colors.cyan}🌐 Archivos con API: ${report.apiCalls.length}${colors.reset}`,
  );
  console.log(
    `${colors.yellow}⚠️ Issues: ${report.issues.length}${colors.reset}`,
  );

  console.log(
    `\n${colors.bright}${colors.magenta}📊 Revisa los archivos generados para más detalles!${colors.reset}`,
  );
});
