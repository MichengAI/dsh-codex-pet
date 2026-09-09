/** 发布前核对版本与双语日志，避免标签指向错误版本或生成空 Release。 */
import { readFileSync, writeFileSync } from 'node:fs';
const [tag, output] = process.argv.slice(2);
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version) || tag !== `v${version}` || !output) {
  throw new Error('正式发布标签必须与 package.json 版本一致，并提供说明输出路径');
}
function section(file) {
  const text = readFileSync(file, 'utf8');
  const heading = `## [${version}] - `;
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line => line.startsWith(heading));
  if (start < 0) throw new Error(`${file} 缺少 ${version} 版本记录`);
  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  const body = lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim();
  if (!body.startsWith('- ')) throw new Error(`${file} 版本记录为空或格式不正确`);
  return body;
}
const zh = section('CHANGELOG.zh-CN.md'), en = section('CHANGELOG.md');
if (!/[\u4e00-\u9fff]/.test(zh) || !/[a-zA-Z]/.test(en)) throw new Error('发布说明缺少中文或英文');
writeFileSync(output, `## 中文\n\n${zh}\n\n## English\n\n${en}\n`, 'utf8');
