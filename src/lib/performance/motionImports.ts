/**
 * Where the animation library of the site is imported from.
 *
 * The library is imported through one module of the site,
 * `src/components/motion/`, and this module reads the source of the site to
 * find out whether a page uses the animation of the library or not.
 *
 * The walk follows the imports that are loaded when the page is, and it does
 * not follow the imports that are loaded later. A component that is loaded
 * with `next/dynamic` or with `React.lazy` is not in the first load of the
 * page, so the library that it uses is not in the first load of the page
 * either.
 *
 * The reason of the walk is the rule of the first load: a page that does not
 * animate must not download the runtime of the library. The rule is in
 * `src/lib/performance/firstLoad.ts`, and the measurement is in
 * `scripts/measurePerformance.mts`.
 */

/** The module of the site through which the library of the animation is imported. */
export const MOTION_MODULE = 'src/components/motion';

/** The name of the library of the animation itself. */
export const MOTION_LIBRARY = 'framer-motion';

/** The files of the repository, read by their path from the root. */
export interface SourceTree {
  /**
   * Reads the source of a file of the repository.
   *
   * @param file The path of the file, from the root of the repository.
   * @returns The source of the file, or null when the file is not there.
   */
  read(file: string): string | null;
}

/** What the walk found in the source of the site. */
export interface AnimationImportReport {
  /** The files that were read. */
  visited: string[];
  /** The files that import the library of the animation without the module of the site. */
  directLibraryImports: string[];
  /** The files that import the module of the site of the animation. */
  motionModuleImports: string[];
  /** The files that are loaded later and that use the animation. */
  lazyAnimationImports: string[];
  /** Whether the first load of the tree uses the animation of the library. */
  usesAnimation: boolean;
}

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
 * The imports of the types are left out, because they are not code and they
 * do not bring the library of the animation with them.
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

/**
 * Turns the name of a module into the path of a file of the repository.
 *
 * The names of the packages are not followed: they are in `node_modules` and
 * the library of the animation is only counted when it is imported by a file
 * of the site.
 *
 * @param specifier The name of the module, such as `@/src/components/motion`.
 * @param fromFile The path of the file that imports it.
 * @returns The path of the module, from the root of the repository, or null
 *   when the name is the name of a package.
 */
export function resolveModulePath(specifier: string, fromFile: string): string | null {
  if (specifier.startsWith('@/')) {
    return specifier.slice(2);
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const folder = fromFile.split('/').slice(0, -1).join('/');
    const joined = `${folder}/${specifier}`;
    const parts: string[] = [];

    for (const part of joined.split('/')) {
      if (part === '.' || part === '') {
        continue;
      }

      if (part === '..') {
        parts.pop();
        continue;
      }

      parts.push(part);
    }

    return parts.join('/');
  }

  return null;
}

/**
 * Finds the file of the repository that a module name points at.
 *
 * @param modulePath The path of the module, from the root of the repository.
 * @param tree The files of the repository.
 * @returns The path of the file, or null when there is no such file.
 */
export function findModuleFile(modulePath: string, tree: SourceTree): string | null {
  const candidates = [
    modulePath,
    `${modulePath}.tsx`,
    `${modulePath}.ts`,
    `${modulePath}.jsx`,
    `${modulePath}.js`,
    `${modulePath}.mts`,
    `${modulePath}.mjs`,
    `${modulePath}/index.tsx`,
    `${modulePath}/index.ts`,
    `${modulePath}/index.js`,
  ];

  for (const candidate of candidates) {
    if (tree.read(candidate) !== null) {
      return candidate;
    }
  }

  return null;
}

/**
 * Tells whether a file is the module of the site of the animation.
 *
 * The folder of the module holds the CSS of the motion of the site as well,
 * and a stylesheet is not the module of the library.
 *
 * @param file The path of the file, from the root of the repository.
 * @returns Whether the file is the module of the animation.
 */
export function isMotionModule(file: string): boolean {
  if (!file.startsWith(`${MOTION_MODULE}/`)) {
    return false;
  }

  return !/\.(css|scss|sass|less)$/.test(file);
}

/**
 * The imports that one walk found.
 */
interface AnimationImports {
  /** The files that import the library of the animation without the module of the site. */
  direct: Set<string>;
  /** The files that import the module of the site of the animation. */
  motion: Set<string>;
  /** The files that were read. */
  visited: Set<string>;
  /** The files that are loaded later, by the file that loads them. */
  lazy: { file: string; specifier: string }[];
}

/**
 * Walks the imports that are loaded when a file is and tells whether the
 * animation of the library is among them.
 *
 * @param entry The file the walk starts at.
 * @param tree The files of the repository.
 * @param found The imports that the walk found.
 * @returns Whether the tree uses the animation of the library.
 */
function walkStaticImports(entry: string, tree: SourceTree, found: AnimationImports): boolean {
  const queue: string[] = [entry];
  let usesAnimation = false;

  while (queue.length > 0) {
    const file = queue.shift() as string;

    if (found.visited.has(file)) {
      continue;
    }

    found.visited.add(file);

    const source = tree.read(file);

    if (source === null) {
      continue;
    }

    const { static: staticSpecifiers, lazy: lazySpecifiers } = findModuleSpecifiers(source);

    for (const specifier of lazySpecifiers) {
      found.lazy.push({ file, specifier });
    }

    for (const specifier of staticSpecifiers) {
      if (specifier === MOTION_LIBRARY) {
        found.direct.add(file);
        usesAnimation = true;
        continue;
      }

      const modulePath = resolveModulePath(specifier, file);

      if (modulePath === null) {
        continue;
      }

      const moduleFile = findModuleFile(modulePath, tree);

      if (moduleFile === null) {
        continue;
      }

      if (isMotionModule(moduleFile)) {
        found.motion.add(file);
        usesAnimation = true;
        continue;
      }

      queue.push(moduleFile);
    }
  }

  return usesAnimation;
}

/**
 * Walks the source of the site and finds out whether it uses the animation of
 * the library.
 *
 * The walk follows the imports that are loaded when the page is. The imports
 * that are loaded later are listed, but they are not followed: a component
 * that is loaded with `next/dynamic` is not in the first load of the page.
 *
 * @param entry The file the walk starts at, from the root of the repository.
 * @param tree The files of the repository.
 * @returns What the walk found.
 */
export function findAnimationImports(entry: string, tree: SourceTree): AnimationImportReport {
  const found: AnimationImports = {
    direct: new Set<string>(),
    motion: new Set<string>(),
    visited: new Set<string>(),
    lazy: [],
  };
  const lazyAnimationImports = new Set<string>();

  walkStaticImports(entry, tree, found);

  for (const { file, specifier } of found.lazy) {
    if (specifier === MOTION_LIBRARY) {
      lazyAnimationImports.add(file);
      continue;
    }

    const modulePath = resolveModulePath(specifier, file);

    if (modulePath === null) {
      continue;
    }

    const moduleFile = findModuleFile(modulePath, tree);

    if (moduleFile === null) {
      continue;
    }

    const lazyFound: AnimationImports = {
      direct: new Set<string>(),
      motion: new Set<string>(),
      visited: new Set<string>(),
      lazy: [],
    };

    if (walkStaticImports(moduleFile, tree, lazyFound)) {
      lazyAnimationImports.add(moduleFile);
    }
  }

  return {
    visited: [...found.visited],
    directLibraryImports: [...found.direct],
    motionModuleImports: [...found.motion],
    lazyAnimationImports: [...lazyAnimationImports],
    usesAnimation: found.direct.size > 0 || found.motion.size > 0,
  };
}
