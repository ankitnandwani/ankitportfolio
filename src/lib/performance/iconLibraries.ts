import { findModuleSpecifiers } from './moduleImports.ts';

/**
 * The rule of the libraries of icons.
 *
 * The site has one library of icons, and the icons are imported one set or
 * one icon at a time. A file that imports a library as a whole brings every
 * icon of the library with it, and the rule says that no file of the site
 * does it.
 *
 * The rule is a rule on the source, and the measurement of the site reads the
 * source and fails when a file does it. The measurement is in
 * `scripts/measurePerformance.mts`.
 */

/**
 * The libraries of icons of the site.
 *
 * The name of a library is the name of the package itself. A file that
 * imports `react-icons/fi` imports one set of icons, which is allowed; a file
 * that imports `react-icons` imports every set of the library, which is not.
 */
export const ICON_LIBRARIES: string[] = ['react-icons', 'lucide-react'];

/** A file that imports a library of icons as a whole. */
export interface WholeLibraryImport {
  /** The file that imports the library as a whole. */
  file: string;
  /** The library that it imports as a whole. */
  library: string;
}

/**
 * Tells whether a name is the name of a whole library of icons.
 *
 * @param specifier The name of the module, such as `react-icons/fi`.
 * @returns Whether the name is the name of a library as a whole.
 */
export function isWholeLibraryImport(specifier: string): boolean {
  return ICON_LIBRARIES.includes(specifier);
}

/**
 * Finds the files that import a library of icons as a whole.
 *
 * @param files The files of the site and their source.
 * @returns The files that import a library of icons as a whole.
 */
export function findWholeLibraryImports(
  files: { file: string; source: string }[]
): WholeLibraryImport[] {
  const found: WholeLibraryImport[] = [];

  for (const { file, source } of files) {
    const { static: staticSpecifiers } = findModuleSpecifiers(source);

    for (const specifier of staticSpecifiers) {
      if (isWholeLibraryImport(specifier)) {
        found.push({ file, library: specifier });
      }
    }
  }

  return found;
}
