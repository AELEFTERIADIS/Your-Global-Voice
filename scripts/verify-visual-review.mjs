// A changed visual baseline is a reviewed design decision, never an auto-fix.
import { hasHumanApproval } from './visual-review-policy.mjs';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
const event=JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH,'utf8'));
const head=event.pull_request?.head.sha || process.env.GITHUB_SHA;
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const base=event.pull_request?.base.sha || event.before || git('rev-parse',`${head}^`);
if(/^0+$/.test(base)) throw new Error('Cannot verify visual baseline review for an initial repository push.');
const changed=git('diff','--name-only',base,head,'--','tests/visual/baselines');
if(!changed) process.exit(0);
// One-time adoption of the already approved, unchanged published design.
const approvedBootstrap='1f0dc3d5a29be444a5e1e9007e5878cb6ee39849';
if(base===approvedBootstrap && !git('ls-tree','-r','--name-only',base,'tests/visual/baselines')) {
 console.log('Initial baselines preserve the approved published design at '+approvedBootstrap);process.exit(0);
}
const repo=process.env.GITHUB_REPOSITORY;
async function get(path) {
 const r=await fetch(`https://api.github.com/repos/${repo}/${path}`,{headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json'}});
 if(!r.ok) throw new Error(`Cannot verify visual review: GitHub HTTP ${r.status}`);
 return r.json();
}
const prs=event.pull_request ? [event.pull_request] : await get(`commits/${head}/pulls`);
for(const pr of prs) {
 const reviews=[];
 for(let page=1;page<=30;page++) {
  const batch=await get(`pulls/${pr.number}/reviews?per_page=100&page=${page}`);
  reviews.push(...batch);if(batch.length<100) break;
  if(page===30) throw new Error('Too many reviews to verify safely.');
 }
 if(hasHumanApproval(reviews,pr.head.sha)) {
  console.log(`Human approval verified for visual baseline change in PR #${pr.number}`);process.exit(0);
 }
}
throw new Error('Visual baselines changed without human approval of the current PR revision. Review screenshots/diffs, approve the PR, then re-run this workflow. Do not regenerate snapshots automatically.');
