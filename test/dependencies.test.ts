import { readFileSync } from 'node:fs';
import { expect, test } from 'bun:test';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function read(path: string): PackageJson {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as PackageJson;
}

const all = (pkg: PackageJson): Record<string, string> => ({
  ...pkg.devDependencies,
  ...pkg.dependencies,
});

test('packages shared with the code of website-astro have its versions', () => {
  const own = all(read('../package.json'));
  const legacy = [
    read('../vendor/website-astro/web/package.json'),
    read('../vendor/website-astro/api/package.json'),
  ];
  const different = legacy.flatMap((pkg) =>
    Object.entries(all(pkg))
      .filter(([name, version]) => name in own && own[name] !== version)
      .map(([name, version]) => `${name}: ${own[name]} here, ${version} in website-astro`)
  );
  expect(different).toEqual([]);
});
