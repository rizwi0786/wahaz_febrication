/**
 * create-admin.js
 *
 * Creates an admin user (or promotes an existing customer to admin).
 * Intentionally ONLY runnable from the server machine — there is no HTTP
 * endpoint for this on purpose.
 *
 * Usage:
 *
 *   # Interactive (prompts for everything)
 *   node scripts/create-admin.js
 *
 *   # Non-interactive via CLI flags
 *   node scripts/create-admin.js --email jane@co.com --name "Jane Doe" --password "S3cret!!"
 *
 *   # Non-interactive via environment variables
 *   ADMIN_EMAIL=jane@co.com ADMIN_NAME="Jane Doe" ADMIN_PASSWORD="S3cret!!" \
 *     node scripts/create-admin.js
 *
 * Behaviour:
 *   - If the email already belongs to a CUSTOMER, the script offers to
 *     promote that account to ADMIN instead of duplicating it.
 *   - If the email already belongs to an ADMIN, the script exits without
 *     touching the record.
 *   - Otherwise a new ADMIN user is created, its password hashed with the
 *     same cost factor used by the auth controller (bcrypt, 12 rounds),
 *     and an empty Cart is attached (matching the register flow).
 */

require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LEN = 8;

// ------------------------------------------------------------------
// Small arg/prompt helpers — no external CLI library on purpose.
// ------------------------------------------------------------------

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    if (!flag.startsWith('--')) continue;
    const key = flag.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    out[key] = value;
  }
  return out;
}

function prompt(question, { hidden = false } = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    if (!hidden) {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }
    // Hidden prompt for passwords — rewrite the displayed character as *.
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode?.(true);
    let value = '';
    const onData = (char) => {
      const c = char.toString('utf8');
      if (c === '\r' || c === '\n' || c === '\u0004') {
        stdin.setRawMode?.(false);
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        rl.close();
        resolve(value);
      } else if (c === '\u0003') {
        // Ctrl+C
        process.exit(1);
      } else if (c === '\u007f' || c === '\b') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        value += c;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

async function confirm(question) {
  const a = (await prompt(`${question} (y/N) `)).trim().toLowerCase();
  return a === 'y' || a === 'yes';
}

// ------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------

function validate({ email, name, password }) {
  const errors = [];
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Invalid email');
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!password || password.length < MIN_PASSWORD_LEN) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LEN} characters`);
  }
  return errors;
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  // Resolve values: CLI flag > env var > interactive prompt
  const email =
    args.email ||
    process.env.ADMIN_EMAIL ||
    (await prompt('Email: ')).trim();

  const name =
    args.name ||
    process.env.ADMIN_NAME ||
    (await prompt('Full name: ')).trim();

  const password =
    args.password ||
    process.env.ADMIN_PASSWORD ||
    (await prompt('Password (min 8 chars): ', { hidden: true }));

  const errors = validate({ email, name, password });
  if (errors.length) {
    console.error('\n❌ Validation failed:');
    for (const e of errors) console.error('  -', e);
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.role === 'ADMIN') {
    console.log(`\n✓ ${email} is already an ADMIN. Nothing to do.`);
    return;
  }

  if (existing) {
    console.log(`\nA CUSTOMER account already exists for ${email}.`);
    const ok = await confirm('Promote this existing account to ADMIN?');
    if (!ok) {
      console.log('Aborted.');
      return;
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'ADMIN',
        password: hashed,
        isVerified: true,
        // Invalidate any active session so the promoted account is forced
        // to log back in with its new credentials.
        refreshToken: null,
      },
    });
    console.log(`\n✓ Promoted ${email} to ADMIN and reset password.`);
    return;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      password: hashed,
      role: 'ADMIN',
      isVerified: true,
      cart: { create: {} },
    },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log('\n✓ Admin created:');
  console.log(`  id:    ${user.id}`);
  console.log(`  name:  ${user.name}`);
  console.log(`  email: ${user.email}`);
  console.log(`  role:  ${user.role}`);
}

main()
  .catch((err) => {
    console.error('\n❌ Failed:', err.message || err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
