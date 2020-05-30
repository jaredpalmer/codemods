const path = require('path');
/**
 * Corresponds to tsconfig.json paths or webpack aliases
 * E.g. "@/app/store/AppStore" -> "./src/app/store/AppStore"
 */
const pathMapping = {
  components: './src/components',
};

function replacePathAlias(currentFilePath, importPath, pathMap) {
  // if windows env, convert backslashes to "/" first
  currentFilePath = path.posix.join(...currentFilePath.split(path.sep));
  const regex = createRegex(pathMap);
  return importPath.replace(regex, replacer);

  function replacer(_, alias, rest) {
    const mappedImportPath = pathMap[alias] + rest;

    // use path.posix to also create foward slashes on windows environment
    let mappedImportPathRelative = path.posix.relative(
      path.dirname(currentFilePath),
      mappedImportPath
    );
    // append "./" to make it a relative import path
    if (!mappedImportPathRelative.startsWith('../')) {
      mappedImportPathRelative = `./${mappedImportPathRelative}`;
    }

    logReplace(currentFilePath, mappedImportPathRelative);

    return mappedImportPathRelative;
  }
}

function createRegex(pathMap) {
  const mapKeysStr = Object.keys(pathMap).reduce((acc, cur) => `${acc}|${cur}`);
  const regexStr = `^(${mapKeysStr})(.*)$`;
  return new RegExp(regexStr, 'g');
}

const log = true;
function logReplace(currentFilePath, mappedImportPathRelative) {
  if (log)
    console.log(
      'current processed file:',
      currentFilePath,
      '; Mapped import path relative to current file:',
      mappedImportPathRelative
    );
}

module.exports = function transform(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.ImportDeclaration).forEach(replaceNodepathAliases);
  root.find(j.ExportAllDeclaration).forEach(replaceNodepathAliases);

  /**
   * Filter out normal module exports, like export function foo(){ ...}
   * Include export {a} from "mymodule" etc.
   */
  root
    .find(j.ExportNamedDeclaration, (node) => node.source !== null)
    .forEach(replaceNodepathAliases);

  return root.toSource();

  function replaceNodepathAliases(impExpDeclNodePath) {
    impExpDeclNodePath.value.source.value = replacePathAlias(
      file.path,
      impExpDeclNodePath.value.source.value,
      pathMapping
    );
  }
};
