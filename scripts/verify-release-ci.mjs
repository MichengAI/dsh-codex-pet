/** 发布前只读校验：标签提交必须已有 main push 的完整双语 CI 成功记录。 */
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export async function verifyCi(api, repository, sha) {
  const pages = await api(`repos/${repository}/actions/workflows/ci.yml/runs?branch=main&event=push&head_sha=${encodeURIComponent(sha)}&per_page=100`);
  const runs = pages.flatMap(page => page.workflow_runs).filter(run => run.head_sha === sha && run.head_branch === 'main' && run.event === 'push').sort((a, b) => b.id - a.id);
  const run = runs[0];
  if (!run || run.status !== 'completed' || run.conclusion !== 'success') throw new Error('标签提交没有已完成且成功的 main push CI；请等待通过后重跑发布。');
  const jobs = (await api(`repos/${repository}/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`)).flatMap(page => page.jobs);
  for (const name of ['test', 'e2e (zh-CN)', 'e2e (en-US)']) {
    if (!jobs.some(job => job.name === name && job.status === 'completed' && job.conclusion === 'success')) throw new Error(`CI 缺少成功检查：${name}`);
  }
  return run.id;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('缺少有效的 GITHUB_REPOSITORY');
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const api = async endpoint => JSON.parse(execFileSync('gh', ['api', '--paginate', '--slurp', endpoint], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
  console.log(`已验证提交 ${sha} 的 CI run ${await verifyCi(api, repository, sha)}`);
}
