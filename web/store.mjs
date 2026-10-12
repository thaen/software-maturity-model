import * as sqlite from 'node:sqlite';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { validateCatalog, COLLECTIONS } from './public/catalog.js';

const fields = {
  nodes: ['parentId', 'level', 'title', 'description', 'guidance', 'origin'],
  mitigations: [
    'parentId',
    'kind',
    'title',
    'description',
    'purpose',
    'mechanism',
    'scope',
    'evidence',
    'maturity',
    'limits',
    'adverseEffects',
    'origin',
  ],
  criteria: ['mitigationId', 'kind', 'statement', 'evidence'],
  applicability: [
    'changeId',
    'mitigationId',
    'effect',
    'inherit',
    'inheritedFrom',
    'reason',
    'condition',
    'mechanism',
  ],
  rules: ['title', 'condition', 'description'],
  ruleMitigations: ['ruleId', 'mitigationId'],
  relations: ['sourceId', 'targetId', 'kind', 'reason', 'scope'],
  outcomes: ['title', 'description'],
};
const fk = (field, table) =>
  `FOREIGN KEY (${field}) REFERENCES ${table}(id) DEFERRABLE INITIALLY DEFERRED`;
const constraints = {
  nodes: [
    fk('parentId', 'nodes'),
    "CHECK(level IN ('category','subcategory','kind'))",
    "CHECK(origin IN ('skill','draft','user'))",
  ],
  mitigations: [fk('parentId', 'mitigations'), "CHECK(kind IN ('group','control'))"],
  criteria: [fk('mitigationId', 'mitigations')],
  applicability: [
    fk('changeId', 'nodes'),
    fk('mitigationId', 'mitigations'),
    fk('inheritedFrom', 'applicability'),
    "CHECK(effect IN ('include','exclude'))",
    'CHECK(inherit IN (0,1))',
  ],
  ruleMitigations: [fk('ruleId', 'rules'), fk('mitigationId', 'mitigations')],
  relations: [
    fk('sourceId', 'mitigations'),
    fk('targetId', 'mitigations'),
    "CHECK(kind IN ('requires','alternative','shared_failure'))",
    'CHECK(sourceId <> targetId)',
  ],
};
export class CatalogStore {
  constructor({
    databaseFile,
    dataFile,
    seedFile = new URL('./data/catalog.seed.json', import.meta.url),
  }) {
    mkdirSync(dirname(databaseFile), { recursive: true });
    const Database = sqlite.Database || sqlite.DatabaseSync;
    this.db = new Database(databaseFile, { timeout: 5000 });
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    const version = this.db.prepare('PRAGMA user_version').get().user_version;
    if (version > 1)
      throw new Error('The database schema is newer than this application supports.');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.exec(
        'CREATE TABLE IF NOT EXISTS catalog (id INTEGER PRIMARY KEY CHECK(id=1), schemaVersion INTEGER NOT NULL, revision INTEGER NOT NULL, updatedAt TEXT, description TEXT) STRICT;',
      );
      for (const [table, columns] of Object.entries(fields)) {
        this.db.exec(
          `CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, position INTEGER NOT NULL, ${columns.map((column) => `${column} ${column === 'inherit' ? 'INTEGER' : 'TEXT'}`).join(', ')}, ${(constraints[table] || []).concat('CHECK(position >= 0)').join(', ')}) STRICT;`,
        );
      }
      this.db.exec(
        `CREATE TABLE IF NOT EXISTS applicabilityOutcomes (applicabilityId TEXT NOT NULL REFERENCES applicability(id), outcomeId TEXT NOT NULL REFERENCES outcomes(id), position INTEGER NOT NULL, PRIMARY KEY(applicabilityId, outcomeId)) STRICT; PRAGMA user_version=1; COMMIT;`,
      );
    } catch (error) {
      this.db.exec('ROLLBACK');
      this.db.close();
      throw error;
    }
    if (!this.db.prepare('SELECT id FROM catalog').get()) {
      const seed = JSON.parse(readFileSync(seedFile, 'utf8'));
      let initial = seed;
      if (dataFile && existsSync(dataFile)) {
        const legacy = validateCatalog(JSON.parse(readFileSync(dataFile, 'utf8')));
        if (legacy.schemaVersion === 2) initial = legacy;
        else {
          const ids = new Set(legacy.nodes.map((row) => row.id));
          initial = {
            ...seed,
            ...legacy,
            schemaVersion: 2,
            applicability: seed.applicability.filter((row) => ids.has(row.changeId)),
          };
          // Preserve edited change definitions. Add only missing selection guidance from the seed.
          initial.nodes = legacy.nodes.map((row) => ({
            ...row,
            guidance:
              row.level === 'category' &&
              seed.nodes
                .find((n) => n.id === row.id)
                ?.guidance?.includes('The source coverage guidance') &&
              !row.guidance?.includes('The source coverage guidance')
                ? (row.guidance || '') +
                  seed.nodes
                    .find((n) => n.id === row.id)
                    .guidance.slice(
                      seed.nodes
                        .find((n) => n.id === row.id)
                        .guidance.indexOf('\n\nThe source coverage guidance'),
                    )
                : (row.guidance ?? seed.nodes.find((n) => n.id === row.id)?.guidance),
          }));
        }
      }
      this.replace(validateCatalog(initial), null);
    }
  }
  load() {
    const meta = this.db
      .prepare('SELECT schemaVersion, revision, updatedAt, description FROM catalog WHERE id=1')
      .get();
    const catalog = Object.fromEntries(Object.entries(meta).filter(([, value]) => value !== null));
    for (const [table, columns] of Object.entries(fields)) {
      catalog[table] = this.db
        .prepare(`SELECT id, ${columns.join(', ')} FROM ${table} ORDER BY position`)
        .all()
        .map((row) =>
          Object.fromEntries(
            Object.entries(row).filter(
              ([key, value]) => value !== null || key === 'parentId' || key === 'inheritedFrom',
            ),
          ),
        );
    }
    for (const row of catalog.applicability) {
      row.inherit = Boolean(row.inherit);
      row.outcomeIds = this.db
        .prepare(
          'SELECT outcomeId FROM applicabilityOutcomes WHERE applicabilityId=? ORDER BY position',
        )
        .all(row.id)
        .map((link) => link.outcomeId);
    }
    return validateCatalog(catalog);
  }
  replace(incoming, expectedRevision = incoming.revision) {
    if (incoming.schemaVersion !== 2)
      incoming = {
        ...incoming,
        schemaVersion: 2,
        ...Object.fromEntries(COLLECTIONS.map((name) => [name, []])),
      };
    incoming = validateCatalog(incoming);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const current = this.db.prepare('SELECT revision FROM catalog WHERE id=1').get();
      if (current && expectedRevision !== current.revision) {
        const error = new Error(
          'The catalog changed in another tab. Reload before making more changes.',
        );
        error.status = 409;
        throw error;
      }
      const saved = {
        ...incoming,
        revision: current ? current.revision + 1 : incoming.revision,
        updatedAt: current
          ? new Date().toISOString()
          : incoming.updatedAt || new Date().toISOString(),
      };
      this.db.exec('DELETE FROM applicabilityOutcomes;');
      for (const table of Object.keys(fields)) this.db.exec(`DELETE FROM ${table};`);
      for (const [table, columns] of Object.entries(fields)) {
        const insert = this.db.prepare(
          `INSERT INTO ${table} (id, position, ${columns.join(', ')}) VALUES (${['id', 'position', ...columns].map(() => '?').join(', ')})`,
        );
        saved[table].forEach((row, position) =>
          insert.run(
            row.id,
            position,
            ...columns.map((column) =>
              column === 'inherit' ? Number(row[column]) : (row[column] ?? null),
            ),
          ),
        );
      }
      const outcome = this.db.prepare('INSERT INTO applicabilityOutcomes VALUES (?, ?, ?)');
      saved.applicability.forEach((row) =>
        row.outcomeIds.forEach((id, index) => outcome.run(row.id, id, index)),
      );
      this.db
        .prepare('INSERT OR REPLACE INTO catalog VALUES (1, ?, ?, ?, ?)')
        .run(2, saved.revision, saved.updatedAt, saved.description ?? null);
      this.db.exec('COMMIT');
      return this.load();
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  close() {
    this.db.close();
  }
}
