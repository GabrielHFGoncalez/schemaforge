/**
 * SchemaForge Studio
 * High-Performance Client-Side Database Schema Converter & AI Data Sanitizer
 * 100% In-Browser. Zero telemetry. Zero server calls.
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    activeTab: 'converter', // 'converter' | 'sanitizer'
    converter: {
      sourceFormat: 'sql',
      targetFormat: 'prisma',
      input: '',
      output: ''
    },
    sanitizer: {
      mode: 'placeholder', // 'placeholder' | 'synthetic' | 'pseudonym'
      maskPasswords: true,
      maskEmails: true,
      maskPhones: true,
      maskCpfCnpj: true,
      maskCards: true,
      maskKeys: true,
      maskIps: true,
      input: '',
      output: '',
      stats: {
        total: 0,
        emails: 0,
        passwords: 0,
        phones: 0,
        cpfCnpj: 0,
        cards: 0,
        keys: 0,
        ips: 0
      }
    }
  };

  // --- PRESETS ---
  const PRESETS = {
    converter: {
      sql: `-- E-Commerce & SaaS Sample SQL Schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL
);`,

      prisma: `// Prisma Schema Sample
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            Int          @id @default(autoincrement())
  email         String       @unique
  name          String?
  role          String       @default("user")
  isActive      Boolean      @default(true)
  createdAt     DateTime     @default(now())
  posts         Post[]
}

model Post {
  id            Int          @id @default(autoincrement())
  title         String
  content       String?
  published     Boolean      @default(false)
  authorId      Int
  author        User         @relation(fields: [authorId], references: [id])
  createdAt     DateTime     @default(now())
}`,

      drizzle: `// Drizzle ORM Sample (pgTable)
import { pgTable, serial, text, varchar, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('member'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  authorId: integer('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
});`
    },

    sanitizer: {
      sqlDump: `-- Production Database Dump Sample (DO NOT PASTE TO PUBLIC AI WITHOUT SANITIZING)
INSERT INTO users (id, name, email, password_hash, cpf, phone, ip_address, stripe_customer) VALUES
(101, 'Carlos Eduardo Silva', 'carlos.silva@empresa.com.br', '$2a$12$e8YkYk91x0v9FpQO8i/9qeqG7Q1Zp6L1l0b4c8d9e0f1g2h3i4j5', '284.912.837-10', '(11) 98451-2299', '187.54.12.90', 'cus_N8yK2xLqZ0w1P'),
(102, 'Mariana Costa Mendes', 'mariana.mendes@fintech.io', '$2b$10$wK3nF7b8v9C1x2Z3a4B5C6D7E8F9A0B1C2D3E4F5G6H7I8J9K0L1', '512.439.102-88', '+55 (21) 97123-4567', '201.86.230.15', 'cus_O9zL3yMrA1x2Q'),
(103, 'Johnathan Vance', 'jvance@globalcloud.net', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '092.118.443-05', '+1 (415) 555-0198', '54.210.88.19', 'cus_P0aM4zNsB2y3R');

-- API Keys & Payment logs
UPDATE config SET value = 'sk_test_51Ny9g2LtH9Qc3Vb1m8K7r5T4w2Z1a9X8y7W6v5U4t3S2R1q0P' WHERE key = 'stripe_secret';
UPDATE credentials SET token = 'sample_api_token_ghp_mock4Bv71kLa0q8zW9x1R4e2T6y8U0i2O4' WHERE service = 'github_sync';
INSERT INTO audit_logs (id, event, payload) VALUES (554, 'checkout_failed', '{"card":"4532-1100-8899-2341","cvv":"412","user":"carlos.silva@empresa.com.br"}');`,

      apiPayload: `{
  "status": "success",
  "client": {
    "name": "Beatriz Alcantara",
    "email": "beatriz.alcantara@gmail.com",
    "cpf": "382.901.445-72",
    "cnpj": "12.345.678/0001-90",
    "phone": "+55 (31) 99887-1122",
    "last_login_ip": "177.136.254.11",
    "api_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkJlYXRyaXoiLCJpYXQiOjE1MTYyMzkwMjJ9.4pz-vhnRz1bA0o3rX2F-X5K3_6xW0J2y8Z-",
    "secret": "AKIAIOSFODNN7EXAMPLE",
    "billing": {
      "card_number": "5412 7512 3412 3456",
      "holder": "BEATRIZ ALCANTARA"
    }
  }
}`
    }
  };

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    setupTabSwitching();
    setupConverterEvents();
    setupSanitizerEvents();
    setupModalEvents();
    setupGlobalTools();

    // Default load
    loadConverterPreset('sql');
    loadSanitizerPreset('sqlDump');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // --- TAB SWITCHING ---
  function setupTabSwitching() {
    const tabConverter = document.getElementById('tab-btn-converter');
    const tabSanitizer = document.getElementById('tab-btn-sanitizer');
    const viewConverter = document.getElementById('view-converter');
    const viewSanitizer = document.getElementById('view-sanitizer');

    tabConverter.addEventListener('click', () => {
      state.activeTab = 'converter';
      tabConverter.classList.add('bg-slate-800', 'text-emerald-400', 'border-emerald-500/50');
      tabConverter.classList.remove('text-slate-400', 'border-transparent');
      tabSanitizer.classList.remove('bg-slate-800', 'text-emerald-400', 'border-emerald-500/50');
      tabSanitizer.classList.add('text-slate-400', 'border-transparent');

      viewConverter.classList.remove('hidden');
      viewSanitizer.classList.add('hidden');
    });

    tabSanitizer.addEventListener('click', () => {
      state.activeTab = 'sanitizer';
      tabSanitizer.classList.add('bg-slate-800', 'text-emerald-400', 'border-emerald-500/50');
      tabSanitizer.classList.remove('text-slate-400', 'border-transparent');
      tabConverter.classList.remove('bg-slate-800', 'text-emerald-400', 'border-emerald-500/50');
      tabConverter.classList.add('text-slate-400', 'border-transparent');

      viewSanitizer.classList.remove('hidden');
      viewConverter.classList.add('hidden');
    });
  }

  // --- SCHEMA CONVERTER LOGIC ---
  function setupConverterEvents() {
    const srcSelect = document.getElementById('converter-source-format');
    const tgtSelect = document.getElementById('converter-target-format');
    const inputArea = document.getElementById('converter-input');
    const outputArea = document.getElementById('converter-output');
    const convertBtn = document.getElementById('converter-run-btn');
    const copyBtn = document.getElementById('converter-copy-btn');
    const downloadBtn = document.getElementById('converter-download-btn');
    const clearBtn = document.getElementById('converter-clear-btn');

    // Preset buttons
    document.querySelectorAll('[data-preset-converter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.getAttribute('data-preset-converter');
        loadConverterPreset(type);
      });
    });

    srcSelect.addEventListener('change', (e) => {
      state.converter.sourceFormat = e.target.value;
      runConversion();
    });

    tgtSelect.addEventListener('change', (e) => {
      state.converter.targetFormat = e.target.value;
      runConversion();
    });

    inputArea.addEventListener('input', () => {
      state.converter.input = inputArea.value;
      runConversion();
    });

    convertBtn.addEventListener('click', () => {
      runConversion();
      showToast('Schema convertido com sucesso!', 'success');
    });

    copyBtn.addEventListener('click', () => {
      if (!outputArea.value.trim()) return;
      navigator.clipboard.writeText(outputArea.value).then(() => {
        showToast('Código copiado para a área de transferência!', 'success');
      });
    });

    downloadBtn.addEventListener('click', () => {
      const code = outputArea.value;
      if (!code.trim()) return;
      const extMap = {
        prisma: 'schema.prisma',
        drizzle: 'schema.ts',
        sql: 'schema.sql',
        typescript: 'types.ts',
        jsonSchema: 'schema.json'
      };
      const filename = extMap[state.converter.targetFormat] || 'schema.txt';
      downloadTextFile(filename, code);
      showToast(`Arquivo ${filename} baixado!`, 'info');
    });

    clearBtn.addEventListener('click', () => {
      inputArea.value = '';
      outputArea.value = '';
      state.converter.input = '';
      state.converter.output = '';
      showToast('Área limpa.', 'info');
    });
  }

  function loadConverterPreset(format) {
    const inputArea = document.getElementById('converter-input');
    const srcSelect = document.getElementById('converter-source-format');
    const tgtSelect = document.getElementById('converter-target-format');

    srcSelect.value = format;
    state.converter.sourceFormat = format;

    if (format === 'sql') tgtSelect.value = 'prisma';
    else if (format === 'prisma') tgtSelect.value = 'drizzle';
    else if (format === 'drizzle') tgtSelect.value = 'sql';
    state.converter.targetFormat = tgtSelect.value;

    inputArea.value = PRESETS.converter[format] || '';
    state.converter.input = inputArea.value;
    runConversion();
  }

  function runConversion() {
    const inputArea = document.getElementById('converter-input');
    const outputArea = document.getElementById('converter-output');
    const raw = inputArea.value;
    state.converter.input = raw;

    if (!raw.trim()) {
      outputArea.value = '';
      return;
    }

    try {
      // Step 1: Parse to Schema Model IR
      const schemaIR = parseSchema(raw, state.converter.sourceFormat);

      // Step 2: Generate target code
      const generated = generateSchema(schemaIR, state.converter.targetFormat);
      outputArea.value = generated;
      state.converter.output = generated;
    } catch (err) {
      outputArea.value = `// Erro na conversão:\n// ${err.message}\n\n// Dica: Verifique se o formato selecionado corresponde à sintaxe de entrada.`;
    }
  }

  // Intermediate Model Parser
  function parseSchema(source, format) {
    if (format === 'sql') return parseSQL(source);
    if (format === 'prisma') return parsePrisma(source);
    if (format === 'drizzle') return parseDrizzle(source);
    return parseSQL(source);
  }

  function parseSQL(sql) {
    const tables = [];
    const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?[\w]+[`"']?)\s*\(([\s\S]*?)\);/gi;

    let match;
    while ((match = tableRegex.exec(cleanSql)) !== null) {
      const tableName = match[1].replace(/[`"']/g, '').trim();
      const body = match[2];
      const lines = splitSqlColumns(body);
      const fields = [];

      for (let rawLine of lines) {
        let line = rawLine.trim();
        if (!line) continue;

        // Skip standalone constraints for now, check primary key constraint
        if (/^PRIMARY\s+KEY\s*\((.*?)\)/i.test(line)) {
          const pkCols = line.match(/^PRIMARY\s+KEY\s*\((.*?)\)/i)[1].replace(/[`"'\s]/g, '').split(',');
          fields.forEach(f => {
            if (pkCols.includes(f.name)) f.isPrimary = true;
          });
          continue;
        }

        if (/^(CONSTRAINT|FOREIGN\s+KEY|UNIQUE|CHECK|INDEX)\b/i.test(line)) {
          continue;
        }

        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;

        const colName = parts[0].replace(/[`"']/g, '');
        const rawType = parts[1].toUpperCase();

        const isPrimary = /PRIMARY\s+KEY/i.test(line);
        const isNullable = !/NOT\s+NULL/i.test(line) && !isPrimary;
        const isUnique = /UNIQUE/i.test(line);
        const isAutoInc = /AUTO_INCREMENT|SERIAL|BIGSERIAL/i.test(line) || /DEFAULT\s+nextval/i.test(line);

        let defaultValue = null;
        const defaultMatch = line.match(/DEFAULT\s+([^,]+)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1].trim().replace(/^['"]|['"]$/g, '');
        }

        // Detect foreign key inline
        let references = null;
        const refMatch = line.match(/REFERENCES\s+([`"']?\w+[`"']?)\s*\(([`"']?\w+[`"']?)\)/i);
        if (refMatch) {
          references = {
            table: refMatch[1].replace(/[`"']/g, ''),
            field: refMatch[2].replace(/[`"']/g, '')
          };
        }

        fields.push({
          name: colName,
          type: normalizeSqlType(rawType),
          isPrimary,
          isNullable,
          isUnique,
          isAutoInc,
          defaultValue,
          references
        });
      }

      tables.push({ name: tableName, fields });
    }

    if (tables.length === 0) {
      throw new Error("Nenhuma instrução 'CREATE TABLE' válida encontrada.");
    }

    return { tables };
  }

  function splitSqlColumns(body) {
    const results = [];
    let current = '';
    let parenDepth = 0;
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if ((ch === "'" || ch === '"') && body[i - 1] !== '\\') {
        if (!inQuote) {
          inQuote = true;
          quoteChar = ch;
        } else if (quoteChar === ch) {
          inQuote = false;
        }
      }

      if (!inQuote) {
        if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth--;
        else if (ch === ',' && parenDepth === 0) {
          results.push(current);
          current = '';
          continue;
        }
      }
      current += ch;
    }
    if (current.trim()) results.push(current);
    return results;
  }

  function normalizeSqlType(sqlType) {
    const t = sqlType.split('(')[0];
    switch (t) {
      case 'INT':
      case 'INTEGER':
      case 'SMALLINT':
      case 'TINYINT':
      case 'SERIAL':
        return 'integer';
      case 'BIGINT':
      case 'BIGSERIAL':
        return 'bigint';
      case 'VARCHAR':
      case 'CHAR':
      case 'TEXT':
      case 'MEDIUMTEXT':
      case 'LONGTEXT':
        return 'string';
      case 'BOOLEAN':
      case 'BOOL':
        return 'boolean';
      case 'DECIMAL':
      case 'NUMERIC':
      case 'REAL':
      case 'DOUBLE':
      case 'FLOAT':
        return 'float';
      case 'TIMESTAMP':
      case 'TIMESTAMPTZ':
      case 'DATETIME':
      case 'DATE':
        return 'datetime';
      case 'JSON':
      case 'JSONB':
        return 'json';
      case 'UUID':
        return 'uuid';
      default:
        return 'string';
    }
  }

  function parsePrisma(source) {
    const tables = [];
    const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
    let match;

    while ((match = modelRegex.exec(source)) !== null) {
      const modelName = match[1];
      const body = match[2];
      const lines = body.split('\n');
      const fields = [];

      for (let rawLine of lines) {
        let line = rawLine.trim();
        if (!line || line.startsWith('//') || line.startsWith('@@')) continue;

        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;

        const fieldName = parts[0];
        let rawType = parts[1];

        // Relation detection (capitalized model reference without native scalar)
        const isArray = rawType.endsWith('[]');
        const isOptional = rawType.endsWith('?');
        const cleanType = rawType.replace(/[?\[\]]/g, '');

        const isScalar = ['Int', 'BigInt', 'String', 'Boolean', 'DateTime', 'Json', 'Float', 'Decimal', 'Bytes'].includes(cleanType);
        if (!isScalar) {
          // Relation field, omit from basic column list unless foreign key
          continue;
        }

        const isPrimary = line.includes('@id');
        const isUnique = line.includes('@unique');
        const isAutoInc = line.includes('@default(autoincrement())');
        let defaultValue = null;

        const defMatch = line.match(/@default\(([^)]+)\)/);
        if (defMatch) {
          defaultValue = defMatch[1].replace(/['"]/g, '');
        }

        fields.push({
          name: fieldName,
          type: normalizePrismaType(cleanType),
          isPrimary,
          isNullable: isOptional,
          isUnique,
          isAutoInc,
          defaultValue,
          references: null
        });
      }

      tables.push({ name: modelName, fields });
    }

    if (tables.length === 0) {
      throw new Error("Nenhum bloco 'model ModelName { ... }' encontrado no schema Prisma.");
    }

    return { tables };
  }

  function normalizePrismaType(prismaType) {
    switch (prismaType) {
      case 'Int': return 'integer';
      case 'BigInt': return 'bigint';
      case 'String': return 'string';
      case 'Boolean': return 'boolean';
      case 'Float':
      case 'Decimal': return 'float';
      case 'DateTime': return 'datetime';
      case 'Json': return 'json';
      case 'Bytes': return 'binary';
      default: return 'string';
    }
  }

  function parseDrizzle(source) {
    const tables = [];
    const tableRegex = /(?:export\s+const\s+)?(\w+)\s*=\s*(?:pgTable|mysqlTable|sqliteTable)\s*\(\s*['"](\w+)['"]\s*,\s*\{([\s\S]*?)\}\s*\);/g;
    let match;

    while ((match = tableRegex.exec(source)) !== null) {
      const varName = match[1];
      const tableName = match[2] || varName;
      const body = match[3];
      const lines = body.split('\n');
      const fields = [];

      for (let rawLine of lines) {
        let line = rawLine.trim();
        if (!line || line.startsWith('//')) continue;

        const colMatch = line.match(/^(\w+)\s*:\s*(\w+)\s*\((?:['"]([^'"]+)['"])?[^)]*\)(.*)/);
        if (colMatch) {
          const colKey = colMatch[1];
          const funcType = colMatch[2];
          const dbColName = colMatch[3] || colKey;
          const chain = colMatch[4] || '';

          const isPrimary = chain.includes('.primaryKey(');
          const isNullable = !chain.includes('.notNull(') && !isPrimary;
          const isUnique = chain.includes('.unique(');
          const isAutoInc = funcType === 'serial' || chain.includes('.autoincrement(');

          fields.push({
            name: dbColName,
            type: normalizeDrizzleType(funcType),
            isPrimary,
            isNullable,
            isUnique,
            isAutoInc,
            defaultValue: null,
            references: null
          });
        }
      }

      tables.push({ name: tableName, fields });
    }

    if (tables.length === 0) {
      throw new Error("Nenhuma tabela Drizzle válida (pgTable, mysqlTable ou sqliteTable) encontrada.");
    }

    return { tables };
  }

  function normalizeDrizzleType(funcType) {
    switch (funcType) {
      case 'serial':
      case 'integer':
      case 'smallint': return 'integer';
      case 'bigint':
      case 'bigserial': return 'bigint';
      case 'text':
      case 'varchar':
      case 'char': return 'string';
      case 'boolean': return 'boolean';
      case 'numeric':
      case 'real':
      case 'doublePrecision': return 'float';
      case 'timestamp':
      case 'date': return 'datetime';
      case 'json':
      case 'jsonb': return 'json';
      case 'uuid': return 'uuid';
      default: return 'string';
    }
  }

  // Schema Generator
  function generateSchema(ir, targetFormat) {
    switch (targetFormat) {
      case 'prisma': return toPrisma(ir);
      case 'drizzle': return toDrizzle(ir);
      case 'sql': return toSql(ir);
      case 'typescript': return toTypeScript(ir);
      case 'jsonSchema': return toJsonSchema(ir);
      default: return toPrisma(ir);
    }
  }

  function toPrisma(ir) {
    let out = `// Generated with SchemaForge Studio\n// 100% Client-Side Generator\n\n`;
    out += `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;

    for (let table of ir.tables) {
      const modelName = capitalize(table.name);
      out += `model ${modelName} {\n`;

      for (let field of table.fields) {
        let typeStr = mapPrismaType(field.type);
        if (field.isNullable && !field.isPrimary) typeStr += '?';

        let directives = [];
        if (field.isPrimary) {
          directives.push('@id');
          if (field.isAutoInc) directives.push('@default(autoincrement())');
        } else if (field.isUnique) {
          directives.push('@unique');
        }

        if (field.defaultValue) {
          if (field.defaultValue.toLowerCase() === 'current_timestamp' || field.defaultValue.toLowerCase() === 'now()') {
            directives.push('@default(now())');
          } else if (field.defaultValue.toLowerCase() === 'true' || field.defaultValue.toLowerCase() === 'false') {
            directives.push(`@default(${field.defaultValue})`);
          } else if (!isNaN(field.defaultValue)) {
            directives.push(`@default(${field.defaultValue})`);
          } else {
            directives.push(`@default("${field.defaultValue}")`);
          }
        }

        const dirStr = directives.length > 0 ? ' ' + directives.join(' ') : '';
        out += `  ${field.name.padEnd(16)} ${typeStr.padEnd(12)}${dirStr}\n`;
      }

      out += `\n  @@map("${table.name}")\n}\n\n`;
    }

    return out.trim();
  }

  function mapPrismaType(type) {
    switch (type) {
      case 'integer': return 'Int';
      case 'bigint': return 'BigInt';
      case 'string': return 'String';
      case 'boolean': return 'Boolean';
      case 'float': return 'Float';
      case 'datetime': return 'DateTime';
      case 'json': return 'Json';
      case 'uuid': return 'String';
      default: return 'String';
    }
  }

  function toDrizzle(ir) {
    let out = `// Generated with SchemaForge Studio\n// Drizzle ORM PostgreSQL Definition\n`;
    out += `import { pgTable, serial, integer, varchar, text, boolean, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';\n\n`;

    for (let table of ir.tables) {
      const varName = toCamelCase(table.name);
      out += `export const ${varName} = pgTable('${table.name}', {\n`;

      for (let field of table.fields) {
        let colDef = '';
        if (field.isPrimary && field.isAutoInc) {
          colDef = `serial('${field.name}').primaryKey()`;
        } else {
          colDef = mapDrizzleColumn(field);
          if (field.isPrimary) colDef += `.primaryKey()`;
          if (!field.isNullable) colDef += `.notNull()`;
          if (field.isUnique) colDef += `.unique()`;
          if (field.defaultValue) {
            if (field.defaultValue.toLowerCase().includes('now') || field.defaultValue.toLowerCase().includes('current_timestamp')) {
              colDef += `.defaultNow()`;
            } else if (field.defaultValue.toLowerCase() === 'true' || field.defaultValue.toLowerCase() === 'false') {
              colDef += `.default(${field.defaultValue})`;
            } else if (!isNaN(field.defaultValue)) {
              colDef += `.default(${field.defaultValue})`;
            } else {
              colDef += `.default('${field.defaultValue}')`;
            }
          }
        }

        out += `  ${toCamelCase(field.name)}: ${colDef},\n`;
      }

      out += `});\n\n`;
    }

    return out.trim();
  }

  function mapDrizzleColumn(field) {
    switch (field.type) {
      case 'integer': return `integer('${field.name}')`;
      case 'bigint': return `integer('${field.name}')`;
      case 'string': return `varchar('${field.name}', { length: 255 })`;
      case 'boolean': return `boolean('${field.name}')`;
      case 'float': return `numeric('${field.name}', { precision: 10, scale: 2 })`;
      case 'datetime': return `timestamp('${field.name}')`;
      case 'json': return `jsonb('${field.name}')`;
      default: return `text('${field.name}')`;
    }
  }

  function toSql(ir) {
    let out = `-- Generated with SchemaForge Studio\n-- Standard SQL DDL (PostgreSQL compatible)\n\n`;

    for (let table of ir.tables) {
      out += `CREATE TABLE ${table.name} (\n`;
      const colDefs = [];

      for (let field of table.fields) {
        let def = `  ${field.name} `;
        if (field.isPrimary && field.isAutoInc) {
          def += `SERIAL PRIMARY KEY`;
        } else {
          def += mapSqlType(field.type);
          if (field.isPrimary) def += ` PRIMARY KEY`;
          if (!field.isNullable) def += ` NOT NULL`;
          if (field.isUnique) def += ` UNIQUE`;
          if (field.defaultValue) {
            def += ` DEFAULT ${formatSqlDefault(field.defaultValue)}`;
          }
        }
        if (field.references) {
          def += ` REFERENCES ${field.references.table}(${field.references.field})`;
        }
        colDefs.push(def);
      }

      out += colDefs.join(',\n') + '\n);\n\n';
    }

    return out.trim();
  }

  function mapSqlType(type) {
    switch (type) {
      case 'integer': return 'INTEGER';
      case 'bigint': return 'BIGINT';
      case 'string': return 'VARCHAR(255)';
      case 'boolean': return 'BOOLEAN';
      case 'float': return 'NUMERIC(10, 2)';
      case 'datetime': return 'TIMESTAMP';
      case 'json': return 'JSONB';
      default: return 'TEXT';
    }
  }

  function formatSqlDefault(val) {
    if (val.toLowerCase().includes('now') || val.toLowerCase().includes('current_timestamp')) {
      return 'CURRENT_TIMESTAMP';
    }
    if (val.toLowerCase() === 'true' || val.toLowerCase() === 'false' || !isNaN(val)) {
      return val;
    }
    return `'${val}'`;
  }

  function toTypeScript(ir) {
    let out = `// Generated with SchemaForge Studio\n// TypeScript Database Models\n\n`;

    for (let table of ir.tables) {
      const typeName = capitalize(table.name);
      out += `export interface ${typeName} {\n`;

      for (let field of table.fields) {
        const opt = field.isNullable ? '?' : '';
        const tsType = mapTsType(field.type);
        out += `  ${field.name}${opt}: ${tsType};\n`;
      }

      out += `}\n\n`;
    }

    return out.trim();
  }

  function mapTsType(type) {
    switch (type) {
      case 'integer':
      case 'bigint':
      case 'float': return 'number';
      case 'string':
      case 'uuid': return 'string';
      case 'boolean': return 'boolean';
      case 'datetime': return 'Date | string';
      case 'json': return 'Record<string, unknown> | any[]';
      default: return 'unknown';
    }
  }

  function toJsonSchema(ir) {
    const root = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "DatabaseSchema",
      type: "object",
      definitions: {}
    };

    for (let table of ir.tables) {
      const props = {};
      const required = [];

      for (let field of table.fields) {
        props[field.name] = {
          type: field.type === 'integer' || field.type === 'float' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string'
        };
        if (!field.isNullable) required.push(field.name);
      }

      root.definitions[table.name] = {
        type: "object",
        properties: props,
        required: required.length ? required : undefined
      };
    }

    return JSON.stringify(root, null, 2);
  }

  // --- AI PROMPT SANITIZER LOGIC ---
  function setupSanitizerEvents() {
    const inputArea = document.getElementById('sanitizer-input');
    const outputArea = document.getElementById('sanitizer-output');
    const sanitizeBtn = document.getElementById('sanitizer-run-btn');
    const copyBtn = document.getElementById('sanitizer-copy-btn');
    const downloadBtn = document.getElementById('sanitizer-download-btn');
    const clearBtn = document.getElementById('sanitizer-clear-btn');
    const modeSelect = document.getElementById('sanitizer-mode');

    // Filter toggles
    const toggles = [
      { id: 'opt-passwords', key: 'maskPasswords' },
      { id: 'opt-emails', key: 'maskEmails' },
      { id: 'opt-phones', key: 'maskPhones' },
      { id: 'opt-cpf-cnpj', key: 'maskCpfCnpj' },
      { id: 'opt-cards', key: 'maskCards' },
      { id: 'opt-keys', key: 'maskKeys' },
      { id: 'opt-ips', key: 'maskIps' }
    ];

    toggles.forEach(t => {
      const el = document.getElementById(t.id);
      if (el) {
        el.addEventListener('change', (e) => {
          state.sanitizer[t.key] = e.target.checked;
          runSanitization();
        });
      }
    });

    modeSelect.addEventListener('change', (e) => {
      state.sanitizer.mode = e.target.value;
      runSanitization();
    });

    inputArea.addEventListener('input', () => {
      state.sanitizer.input = inputArea.value;
      runSanitization();
    });

    sanitizeBtn.addEventListener('click', () => {
      runSanitization();
      showToast('Dados sanitizados com sucesso!', 'success');
    });

    copyBtn.addEventListener('click', () => {
      if (!outputArea.value.trim()) return;
      navigator.clipboard.writeText(outputArea.value).then(() => {
        showToast('Texto sanitizado pronto para colar no ChatGPT / Claude / Gemini!', 'success');
      });
    });

    downloadBtn.addEventListener('click', () => {
      const text = outputArea.value;
      if (!text.trim()) return;
      downloadTextFile('sanitized-for-ai.txt', text);
      showToast('Arquivo sanitizado baixado com sucesso!', 'info');
    });

    clearBtn.addEventListener('click', () => {
      inputArea.value = '';
      outputArea.value = '';
      state.sanitizer.input = '';
      state.sanitizer.output = '';
      updateSanitizerStats({ total: 0, emails: 0, passwords: 0, phones: 0, cpfCnpj: 0, cards: 0, keys: 0, ips: 0 });
      showToast('Área limpa.', 'info');
    });

    // Preset buttons
    document.querySelectorAll('[data-preset-sanitizer]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.currentTarget.getAttribute('data-preset-sanitizer');
        loadSanitizerPreset(preset);
      });
    });
  }

  function loadSanitizerPreset(presetName) {
    const inputArea = document.getElementById('sanitizer-input');
    inputArea.value = PRESETS.sanitizer[presetName] || '';
    state.sanitizer.input = inputArea.value;
    runSanitization();
  }

  function runSanitization() {
    const inputArea = document.getElementById('sanitizer-input');
    const outputArea = document.getElementById('sanitizer-output');
    let text = inputArea.value;
    state.sanitizer.input = text;

    if (!text.trim()) {
      outputArea.value = '';
      updateSanitizerStats({ total: 0, emails: 0, passwords: 0, phones: 0, cpfCnpj: 0, cards: 0, keys: 0, ips: 0 });
      return;
    }

    const mode = state.sanitizer.mode;
    const stats = {
      total: 0,
      emails: 0,
      passwords: 0,
      phones: 0,
      cpfCnpj: 0,
      cards: 0,
      keys: 0,
      ips: 0
    };

    const pseudonymMap = new Map();
    function getPseudonym(category, original) {
      if (!pseudonymMap.has(original)) {
        const id = pseudonymMap.size + 1;
        if (mode === 'placeholder') {
          pseudonymMap.set(original, `[REDACTED_${category.toUpperCase()}_${id}]`);
        } else if (mode === 'synthetic') {
          pseudonymMap.set(original, generateSynthetic(category, id));
        } else {
          // Pseudonym hash
          pseudonymMap.set(original, `anon_${category}_${simpleHash(original)}`);
        }
      }
      return pseudonymMap.get(original);
    }

    // 1. Passwords, bcrypt, hashes, token values
    if (state.sanitizer.maskPasswords) {
      // bcrypt hashes: $2a$12$..., $2b$..., $2y$...
      text = text.replace(/(\$2[abxy]\$\d{2}\$[A-Za-z0-9./]{53})/g, (match) => {
        stats.passwords++;
        stats.total++;
        return getPseudonym('password_hash', match);
      });

      // password in SQL / JSON / config quotes: password = '...', "password": "...", senha: '...'
      const pwdValueRegex = /(["']?(?:password(?:_hash)?|passwd|pwd|senha|secret_token|auth_token)["']?\s*[:=]\s*["'])([^"']{4,})(["'])/gi;
      text = text.replace(pwdValueRegex, (full, prefix, val, suffix) => {
        stats.passwords++;
        stats.total++;
        return `${prefix}${getPseudonym('password', val)}${suffix}`;
      });
    }

    // 2. API Keys, JWT, Stripe, GitHub, AWS tokens
    if (state.sanitizer.maskKeys) {
      // Stripe Keys
      text = text.replace(/\b((?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,})\b/g, (m) => {
        stats.keys++;
        stats.total++;
        return getPseudonym('api_key', m);
      });

      // GitHub Tokens
      text = text.replace(/\b(gh[pousr]_[0-9a-zA-Z]{36})\b/g, (m) => {
        stats.keys++;
        stats.total++;
        return getPseudonym('github_token', m);
      });

      // AWS Access Key ID
      text = text.replace(/\b(AKIA[0-9A-Z]{16})\b/g, (m) => {
        stats.keys++;
        stats.total++;
        return getPseudonym('aws_key', m);
      });

      // JWT Tokens
      text = text.replace(/\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g, (m) => {
        stats.keys++;
        stats.total++;
        return getPseudonym('jwt_token', m);
      });
    }

    // 3. Credit Cards (Luhn/pattern formatted or raw 13-19 digits)
    if (state.sanitizer.maskCards) {
      // 4532-1100-8899-2341 or 5412 7512 3412 3456
      const cardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
      text = text.replace(cardRegex, (m) => {
        stats.cards++;
        stats.total++;
        return getPseudonym('credit_card', m);
      });
    }

    // 4. Brazilian CPF & CNPJ
    if (state.sanitizer.maskCpfCnpj) {
      // CNPJ: 12.345.678/0001-90
      const cnpjRegex = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
      text = text.replace(cnpjRegex, (m) => {
        stats.cpfCnpj++;
        stats.total++;
        return getPseudonym('cnpj', m);
      });

      // CPF: 123.456.789-00
      const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
      text = text.replace(cpfRegex, (m) => {
        stats.cpfCnpj++;
        stats.total++;
        return getPseudonym('cpf', m);
      });
    }

    // 5. Emails
    if (state.sanitizer.maskEmails) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
      text = text.replace(emailRegex, (m) => {
        stats.emails++;
        stats.total++;
        return getPseudonym('email', m);
      });
    }

    // 6. Phone Numbers (BR & International)
    if (state.sanitizer.maskPhones) {
      // (11) 98451-2299, +55 (21) 97123-4567, +1 (415) 555-0198
      const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}\b/g;
      text = text.replace(phoneRegex, (m) => {
        // filter out pure numbers that might be timestamps or small IDs
        if (m.replace(/\D/g, '').length < 8) return m;
        stats.phones++;
        stats.total++;
        return getPseudonym('phone', m);
      });
    }

    // 7. IPv4 Addresses
    if (state.sanitizer.maskIps) {
      const ipRegex = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g;
      text = text.replace(ipRegex, (m) => {
        if (m === '127.0.0.1' || m === '0.0.0.0') return m; // keep localhost
        stats.ips++;
        stats.total++;
        return getPseudonym('ip_address', m);
      });
    }

    outputArea.value = text;
    state.sanitizer.output = text;
    state.sanitizer.stats = stats;
    updateSanitizerStats(stats);
  }

  function generateSynthetic(category, id) {
    switch (category) {
      case 'email':
        return `user_${id}@empresa-exemplo.com.br`;
      case 'password':
      case 'password_hash':
        return `$2a$12$SAMPLE_MOCK_HASH_${id}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`;
      case 'phone':
        return `(11) 99887-${String(id).padStart(4, '0')}`;
      case 'cpf':
        return `111.222.333-${String(id).padStart(2, '0')}`;
      case 'cnpj':
        return `00.123.456/0001-${String(id).padStart(2, '0')}`;
      case 'credit_card':
        return `4111-2222-3333-${String(id).padStart(4, '0')}`;
      case 'api_key':
      case 'github_token':
      case 'aws_key':
      case 'jwt_token':
        return `sk_live_synthetic_token_${id}_secret`;
      case 'ip_address':
        return `198.51.100.${(id % 250) + 1}`;
      default:
        return `[MOCK_${category.toUpperCase()}_${id}]`;
    }
  }

  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).slice(0, 6);
  }

  function updateSanitizerStats(stats) {
    const totalEl = document.getElementById('stat-total-count');
    const badgeEmails = document.getElementById('stat-emails');
    const badgePasswords = document.getElementById('stat-passwords');
    const badgePhones = document.getElementById('stat-phones');
    const badgeCpf = document.getElementById('stat-cpf');
    const badgeCards = document.getElementById('stat-cards');
    const badgeKeys = document.getElementById('stat-keys');

    if (totalEl) totalEl.textContent = `${stats.total} itens sanitizados`;
    if (badgeEmails) badgeEmails.textContent = stats.emails;
    if (badgePasswords) badgePasswords.textContent = stats.passwords;
    if (badgePhones) badgePhones.textContent = stats.phones;
    if (badgeCpf) badgeCpf.textContent = stats.cpfCnpj;
    if (badgeCards) badgeCards.textContent = stats.cards;
    if (badgeKeys) badgeKeys.textContent = stats.keys;
  }

  // --- MODAL & PIX DONATION EVENTS ---
  function setupModalEvents() {
    const openModalBtn = document.getElementById('btn-open-pix-modal');
    const openModalHeroBtn = document.getElementById('btn-hero-support-pix');
    const modal = document.getElementById('pix-modal');
    const closeModalBtn = document.getElementById('btn-close-pix-modal');
    const copyPixBtn = document.getElementById('btn-copy-pix-key');
    const pixKeyInput = document.getElementById('pix-key-input');

    const openModal = () => {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    };

    const closeModal = () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    };

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (openModalHeroBtn) openModalHeroBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Copy Pix
    if (copyPixBtn && pixKeyInput) {
      copyPixBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(pixKeyInput.value).then(() => {
          showToast('Chave Pix copiada com sucesso! Muito obrigado pelo apoio!', 'success');
          copyPixBtn.innerHTML = `
            <i data-lucide="check" class="w-4 h-4 mr-1"></i> Copiado!
          `;
          if (window.lucide) window.lucide.createIcons();
          setTimeout(() => {
            copyPixBtn.innerHTML = `
              <i data-lucide="copy" class="w-4 h-4 mr-1"></i> Copiar Chave
            `;
            if (window.lucide) window.lucide.createIcons();
          }, 3000);
        });
      });
    }
  }

  // --- GLOBAL HELPERS ---
  function setupGlobalTools() {
    // Escape key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('pix-modal');
        if (modal && !modal.classList.contains('hidden')) {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }
      }
    });
  }

  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border';

    if (type === 'success') {
      toast.classList.add('bg-slate-900', 'text-emerald-300', 'border-emerald-500/40');
      toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> <span>${message}</span>`;
    } else if (type === 'error') {
      toast.classList.add('bg-slate-900', 'text-rose-300', 'border-rose-500/40');
      toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-400"></span> <span>${message}</span>`;
    } else {
      toast.classList.add('bg-slate-900', 'text-cyan-300', 'border-cyan-500/40');
      toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400"></span> <span>${message}</span>`;
    }

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function toCamelCase(str) {
    return str.replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase().replace('-', '').replace('_', '');
    });
  }

})();
