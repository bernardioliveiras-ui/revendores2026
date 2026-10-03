import test from 'node:test';
import assert from 'node:assert/strict';
import {profitScenario} from '../lib/profit-scenario.ts';
test('briefing reference: 250 boxes produce 10000 gross, not revenue',()=>{
 assert.deepEqual(profitScenario(10000,500,26,109.9,69.9),{boxes:250,perDay:250/26,revenue:27475,gross:10000,result:9500});
});
test('gross target remains gross when expenses change',()=>{
 assert.equal(profitScenario(2000,0,26,109.9,74.9).boxes,58);
 assert.equal(profitScenario(2000,200,26,109.9,74.9).boxes,58);
 assert.equal(profitScenario(2000,200,26,109.9,74.9).result,1830);
});
test('nonpositive margins and zero targets',()=>{
 assert.equal(profitScenario(2000,0,26,69.9,69.9),null);
 assert.equal(profitScenario(2000,0,26,50,74.9),null);
 assert.equal(profitScenario(0,100,26,109.9,69.9).result,-100);
});
