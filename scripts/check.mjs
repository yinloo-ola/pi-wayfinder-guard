// Static sanity checks for pi-matt-pocock-skills.
// Run with: node scripts/check.mjs  (or `npm run check`)
//
// These checks catch the regressions that previously bit this repo:
//   - SKILL.md frontmatter mis-parsed (attribution comment placed before the
//     opening `---` delimiter — pi reported "description is required").
//   - Companion files referenced by a SKILL.md missing from the tree (and thus
//     from `npm pack`).
//   - Skill count drift between the tree and the README/NOTICE/CHANGELOG.
//
// They do NOT exercise pi's runtime — a full `pi -e . --print "ok"` load is
// the stronger signal, but it requires a clean environment (no conflicting
// installed copy of this extension). Run that manually before publishing.

import * as fs from "node:fs";
import * as path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
let failures = 0;

function fail(msg) {
	console.error(`  ✗ ${msg}`);
	failures++;
}
function ok(msg) {
	console.log(`  ✓ ${msg}`);
}

// --- 1. Every SKILL.md has valid frontmatter (description + name) ---
console.log("\n1. SKILL.md frontmatter");

const skillsDir = path.join(root, "skills");
const skillDirs = fs
	.readdirSync(skillsDir)
	.filter((d) => fs.statSync(path.join(skillsDir, d)).isDirectory());

for (const dir of skillDirs) {
	const file = path.join(skillsDir, dir, "SKILL.md");
	if (!fs.existsSync(file)) {
		fail(`skills/${dir}/SKILL.md missing`);
		continue;
	}
	const text = fs.readFileSync(file, "utf8");
	// Must start with the frontmatter delimiter (no comment/HTML before it).
	if (!text.startsWith("---\n")) {
		fail(`skills/${dir}/SKILL.md does not start with \`---\\n\` (attribution comment likely placed before frontmatter)`);
		continue;
	}
	const close = text.indexOf("\n---", 4);
	if (close === -1) {
		fail(`skills/${dir}/SKILL.md has no closing frontmatter delimiter`);
		continue;
	}
	const fm = text.slice(4, close);
	if (!/^name:\s+.+$/m.test(fm)) fail(`skills/${dir}/SKILL.md frontmatter missing \`name:\``);
	if (!/^description:\s+.+$/m.test(fm)) fail(`skills/${dir}/SKILL.md frontmatter missing \`description:\``);
}
ok(`${skillDirs.length} SKILL.md files parse`);

// --- 2. Companion files referenced by SKILL.md exist ---
console.log("\n2. Companion file references");

// Markdown relative links: [text](./file.md) or [text](file.md)
const linkRe = /\[[^\]]+\]\((\.?\/?[^)]+\.md)\)/g;
for (const dir of skillDirs) {
	const file = path.join(skillsDir, dir, "SKILL.md");
	const text = fs.readFileSync(file, "utf8");
	let m;
	while ((m = linkRe.exec(text)) !== null) {
		const ref = m[1];
		// Skip http(s) and absolute paths
		if (/^https?:/.test(ref) || ref.startsWith("/")) continue;
		const resolved = path.resolve(path.dirname(file), ref);
		if (!fs.existsSync(resolved)) {
			fail(`skills/${dir}/SKILL.md references missing file: ${ref}`);
		}
	}
}
ok("companion references resolve");

// --- 3. Skill count consistent across docs ---
console.log("\n3. Skill count consistency");

const count = skillDirs.length;
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

// README "### N skills" heading
const readme = read("README.md");
const readmeHeading = readme.match(/### (\d+) skills/);
if (!readmeHeading) {
	fail("README.md has no `### N skills` heading");
} else if (Number(readmeHeading[1]) !== count) {
	fail(`README says ${readmeHeading[1]} skills, tree has ${count}`);
} else {
	ok(`README heading matches (${count})`);
}

// README attribution: "The N skills are derived"
const readmeAttr = readme.match(/The (\d+) skills are derived/);
if (!readmeAttr) {
	fail("README.md has no `The N skills are derived` line");
} else if (Number(readmeAttr[1]) !== count) {
	fail(`README attribution says ${readmeAttr[1]} skills, tree has ${count}`);
} else {
	ok(`README attribution matches (${count})`);
}

// NOTICE: count of "skills/*/SKILL.md" lines should match
const notice = read("NOTICE");
const noticeSkillLines = (notice.match(/^- skills\/[^/]+\/SKILL\.md$/gm) || []).length;
if (noticeSkillLines !== count) {
	fail(`NOTICE lists ${noticeSkillLines} SKILL.md lines, tree has ${count}`);
} else {
	ok(`NOTICE lists all ${count} skills`);
}

// --- 4. npm pack ships every SKILL.md + companion ---
console.log("\n4. shipped files (npm pack --dry-run)");

const { execSync } = await import("node:child_process");
let packOutput;
try {
	packOutput = execSync("npm pack --dry-run --json 2>/dev/null", { cwd: root, encoding: "utf8" });
} catch (e) {
	// Fallback: some npm versions don't emit clean JSON; use the text form.
	packOutput = execSync("npm pack --dry-run 2>&1", { cwd: root, encoding: "utf8" });
}

// Collect shipped .md paths from pack output. The JSON form lists {path: [...]}.
let shippedMd = [];
try {
	const parsed = JSON.parse(packOutput);
	shippedMd = parsed.flatMap((p) => (p.files || []).map((f) => f.path));
} catch {
	// Text form: lines like "skills/foo/SKILL.md"
	shippedMd = packOutput
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => /^skills\/.*\.md$|^agents\/.*\.md$|^prompts\/.*\.md$/.test(l));
}

// Every SKILL.md must ship
for (const dir of skillDirs) {
	const rel = `skills/${dir}/SKILL.md`;
	if (!shippedMd.some((p) => p.endsWith(rel))) {
		fail(`${rel} not in npm pack output`);
	}
}
// Every companion .md in skills/ must ship
for (const dir of skillDirs) {
	const dirAbs = path.join(skillsDir, dir);
	for (const entry of fs.readdirSync(dirAbs)) {
		if (entry === "SKILL.md") continue;
		if (!entry.endsWith(".md")) continue;
		const rel = `skills/${dir}/${entry}`;
		if (!shippedMd.some((p) => p.endsWith(rel))) {
			fail(`${rel} (companion) not in npm pack output`);
		}
	}
}
ok("all SKILL.md + companion files ship via npm pack");

// --- summary ---
console.log("");
if (failures > 0) {
	console.error(`\n✗ ${failures} check(s) failed`);
	process.exit(1);
}
console.log(`\n✓ all checks passed (${count} skills)`);