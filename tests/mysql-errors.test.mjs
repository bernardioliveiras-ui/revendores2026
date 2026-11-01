import test from 'node:test';
import assert from 'node:assert/strict';

import { isMysqlDuplicateKeyError } from '../lib/mysql-errors.ts';

test('reconhece apenas erro de chave duplicada do MySQL', () => {
  assert.equal(isMysqlDuplicateKeyError({ code: 'ER_DUP_ENTRY', errno: 1062 }), true);
  assert.equal(isMysqlDuplicateKeyError({ code: 'ER_LOCK_DEADLOCK', errno: 1213 }), false);
  assert.equal(isMysqlDuplicateKeyError(new Error('duplicate')), false);
  assert.equal(isMysqlDuplicateKeyError(null), false);
});
