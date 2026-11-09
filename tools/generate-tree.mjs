import fs from "node:fs";
import path from "node:path";

const OUTPUT_FILE = "PROJECT_STRUCTURE.md";

/**
 * Парсить аргументи командного рядка:
 * --depth=2 / -d 2 / --depth 2
 * --size / -s
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let maxDepth = Infinity;
  let showSize = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--depth=")) {
      const val = parseInt(arg.split("=")[1], 10);
      maxDepth = Number.isNaN(val) ? Infinity : val;
    } else if ((arg === "--depth" || arg === "-d") && args[i + 1]) {
      const val = parseInt(args[i + 1], 10);
      maxDepth = Number.isNaN(val) ? Infinity : val;
      i++;
    }

    if (arg === "--size" || arg === "-s") {
      showSize = true;
    }
  }

  return { maxDepth, showSize };
}

/**
 * Конвертує байти в зручний людиночитаний формат
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
}

function loadIgnorePatterns(rootDir) {
  const patterns = [/^\.git$/];

  const gitignorePath = path.join(rootDir, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    return patterns;
  }

  const lines = fs.readFileSync(gitignorePath, "utf-8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const cleanRule = line.replace(/^\/+/, "").replace(/\/+$/, "");
    const regexString = cleanRule
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*");

    patterns.push(new RegExp(`^(?:.*/)?${regexString}$`));
  }

  return patterns;
}

function isIgnored(entryName, relPath, ignorePatterns) {
  const normalizedRelPath = relPath.replace(/\\/g, "/");
  return ignorePatterns.some(
    (pattern) => pattern.test(entryName) || pattern.test(normalizedRelPath),
  );
}

function buildTree(
  currentDir,
  rootDir,
  ignorePatterns,
  options,
  stats,
  currentDepth = 1,
  prefix = "",
) {
  if (currentDepth > options.maxDepth) {
    return "";
  }

  const entries = fs
    .readdirSync(currentDir, { withFileTypes: true })
    .filter((entry) => {
      const relPath = path.relative(rootDir, path.join(currentDir, entry.name));
      return !isIgnored(entry.name, relPath, ignorePatterns);
    })
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  let output = "";

  entries.forEach((entry, index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = prefix + (isLast ? "    " : "│   ");
    const fullPath = path.join(currentDir, entry.name);

    let label = entry.name;

    if (entry.isDirectory()) {
      stats.dirs += 1;
      output += `${prefix}${connector}${label}\n`;
      output += buildTree(
        fullPath,
        rootDir,
        ignorePatterns,
        options,
        stats,
        currentDepth + 1,
        childPrefix,
      );
    } else {
      stats.files += 1;
      if (options.showSize) {
        try {
          const fileStat = fs.statSync(fullPath);
          label += ` (${formatBytes(fileStat.size)})`;
        } catch {
          // Якщо виникла помилка доступу до файлу, лишаємо просто назву
        }
      }
      output += `${prefix}${connector}${label}\n`;
    }
  });

  return output;
}

function run() {
  const rootDir = process.cwd();
  const rootName = path.basename(rootDir);
  const options = parseArgs();
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  const stats = { dirs: 0, files: 0 };
  const ignorePatterns = loadIgnorePatterns(rootDir);
  const treeContent = buildTree(
    rootDir,
    rootDir,
    ignorePatterns,
    options,
    stats,
  );

  const depthInfo = Number.isFinite(options.maxDepth)
    ? `Max depth: ${options.maxDepth}`
    : "Full depth";
  const sizeInfo = options.showSize ? "Sizes included" : "Names only";

  const badges = [
    `![Directories](https://img.shields.io/badge/directories-${stats.dirs}-blue?style=flat-square)`,
    `![Files](https://img.shields.io/badge/files-${stats.files}-success?style=flat-square)`,
    `![Depth](https://img.shields.io/badge/depth-${encodeURIComponent(depthInfo)}-lightgrey?style=flat-square)`,
  ].join(" ");

  const markdownContent = `# Project Structure

${badges}

> Automatically generated on: ${now} UTC  
> Total: **${stats.dirs} directories**, **${stats.files} files**  
> Settings: ${depthInfo} | ${sizeInfo} | Exclusions parsed from \`.gitignore\`

<!-- prettier-ignore -->
\`\`\`text
${rootName}/
${treeContent}\`\`\`
`;

  fs.writeFileSync(path.join(rootDir, OUTPUT_FILE), markdownContent, "utf-8");
  console.log(
    `[tree] Generated ${OUTPUT_FILE} successfully (${stats.dirs} dirs, ${stats.files} files, ${depthInfo}).`,
  );
}

run();
