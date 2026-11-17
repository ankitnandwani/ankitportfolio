/**
 * The imports of the files of the site, read from their source.
 *
 * The reading is shared by the rules of the site that are rules on the
 * source: the rule of the module of the animation
 * (`src/lib/performance/motionImports.ts`) and the rule of the libraries of
 * icons (`src/lib/performance/iconLibraries.ts`).
 *
 * The imports of the types are left out, because they are not code and they
 * do not bring anything to the page of a visitor.
 */

/** The imports of a file, split by the moment they are loaded. */
export interface ModuleSpecifiers {
  /** The imports that are loaded when the file is. */
  static: string[];
  /** The imports that are loaded later, with `import()`. */
  lazy: string[];
}

/**
 * Reads the modules that a file imports.
 *
 * @param source The source of the file.
 * @returns The modules that the file imports, split by the moment they are
 *   loaded.
 */
export function findModuleSpecifiers(source: string): ModuleSpecifiers {
  const staticSpecifiers = new Set<string>();
  const lazySpecifiers = new Set<string>();

  const staticPatterns = [
    /^[ \t]*import\s+(?!type\b)[^'"]*from\s*['"]([^'"]+)['"]/gm,
    /^[ \t]*import\s*['"]([^'"]+)['"]/gm,
    /^[ \t]*export\s+(?!type\b)(?:\*|\{[^}]*\})\s*from\s*['"]([^'"]+)['"]/gm,
  ];

  for (const pattern of staticPatterns) {
    for (const match of source.matchAll(pattern)) {
      staticSpecifiers.add(match[1]);
    }
  }

  for (const match of source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    lazySpecifiers.add(match[1]);
  }

  return { static: [...staticSpecifiers], lazy: [...lazySpecifiers] };
}
