const expr = require('./');
const assert = require('assert');

const fixtures = [

  // array expression
  {expr: '([1,2,3])[0]',               expected: 1     },
  {expr: '(["one","two","three"])[1]', expected: 'two' },
  {expr: '([true,false,true])[2]',     expected: true  },
  {expr: '([1,true,"three"]).length',  expected: 3     },
  {expr: 'isArray([1,2,3])',           expected: true  },
  {expr: 'list[3]',                    expected: 4,       idents: ['list']     },
  {expr: 'numMap[1 + two]',            expected: 'three', idents: ['numMap', 'two' ] },

  // binary expression
  {expr: '1+2',         expected: 3},
  {expr: '2-1',         expected: 1},
  {expr: '2*2',         expected: 4},
  {expr: '6/3',         expected: 2},
  {expr: '5|3',         expected: 7},
  {expr: '5&3',         expected: 1},
  {expr: '5^3',         expected: 6},
  {expr: '4<<2',        expected: 16},
  {expr: '256>>4',      expected: 16},
  {expr: '-14>>>2',     expected: 1073741820},
  {expr: '10%6',        expected: 4},
  {expr: '"a"+"b"',     expected: 'ab'},
  {expr: 'one + three', expected: 4, idents: ['one', 'three']},

  // call expression
  {expr: 'func(5)',   expected: 6},
  {expr: 'func(1+2)', expected: 4},

  // conditional expression
  {expr: '(true ? "true" : "false")',               expected: 'true'  },
  {expr: '( ( bool || false ) ? "true" : "false")', expected: 'true'  },
  {expr: '( true ? ( 123*456 ) : "false")',         expected: 123*456 },
  {expr: '( false ? "true" : one + two )',          expected: 3, idents: [ 'one', 'two' ]  },
  {expr: '( true ? "true" : one + two )',          expected: "true", idents: [ 'one', 'two' ]  },

  // identifier
  {expr: 'string', expected: 'string', idents: ['string'] },
  {expr: 'number', expected: 123, idents: ['number']      },
  {expr: 'bool',   expected: true, idents: ['bool']     },

  // literal
  {expr: '"foo"', expected: 'foo' }, // string literal
  {expr: "'foo'", expected: 'foo' }, // string literal
  {expr: '123',   expected: 123   }, // numeric literal
  {expr: 'true',  expected: true  }, // boolean literal

  // logical expression
  {expr: 'true || false',   expected: true  },
  {expr: 'true && false',   expected: false },
  {expr: '1 == "1"',        expected: true  },
  {expr: '2 != "2"',        expected: false },
  {expr: '1.234 === 1.234', expected: true  },
  {expr: '123 !== "123"',   expected: true  },
  {expr: '1 < 2',           expected: true  },
  {expr: '1 > 2',           expected: false },
  {expr: '2 <= 2',          expected: true  },
  {expr: '1 >= 2',          expected: false },

  // logical expression lazy evaluation
  {expr: 'true || throw()',  expected: true  },
  {expr: 'false || true',    expected: true  },
  {expr: 'false && throw()', expected: false  },
  {expr: 'true && false',    expected: false  },

  // member expression
  {expr: 'foo.bar',      expected: 'baz', idents: ['foo'] },
  {expr: 'foo["bar"]',   expected: 'baz', idents: ['foo'] },
  {expr: 'foo[foo.bar]', expected: 'wow', idents: ['foo'] },

  // call expression with member
  {expr: 'foo.func("bar")', expected: 'baz', idents: ['foo']},

  // unary expression
  {expr: '-one',   expected: -1, idents: ['one']   },
  {expr: '+two',   expected: 2, idents: ['two']    },
  {expr: '!false', expected: true },
  {expr: '!!true', expected: true },
  {expr: '~15',    expected: -16  },

  // 'this' context
  {expr: 'this.three', expected: 3 },

  // getValue()
  { expr: 'my_val', expected: 1.234, idents: ['my_val'] },
  { expr: 'number', expected: 123, idents: ['number'] },
  { expr: 'getValue( "number" )', expected: 234, idents: ['number'] },
  { expr: 'getValue( "calc_" + "ident" )', expected: undefined, idents: ['calc_ident'] },
];

const context = {
  string: 'string',
  number: 123,
  bool: true,
  one: 1,
  two: 2,
  three: 3,
  foo: {bar: 'baz', baz: 'wow', func: function(x) { return this[x]; }},
  numMap: {10: 'ten', 3: 'three'},
  list: [1,2,3,4,5],
  func: function(x) { return x + 1; },
  isArray: Array.isArray,
  throw: () => { throw new Error('Should not be called.'); },
  getValue: function( id ) {
    if( id === 'my_val' ) {
        return 1.234;
    } else if( id == "number" ) {
      return 234;
    }
  }
};

var tests = 0;
var passed = 0;

fixtures.forEach( ( o ) => { 
  tests++;
  try {
    var val = expr.compile(o.expr)(context);
  } catch (e) {
    console.error(`Error: ${o.expr}, expected ${o.expected}`);
    throw e;
  }
  assert.equal(val, o.expected, `Failed: ${o.expr} (${val}) === ${o.expected}`);
  passed++;
} );

fixtures.forEach( ( o ) => {
  tests++;
  try {
    var node = expr.parse(o.expr);
    var idents = expr.readIdentifiers( node );
  } catch( e ) {
    console.error(`Error: ${o.expr}`);
    throw e;
  }
  let expected = o.idents || [];
  assert.equal(Array.from( new Set(idents) ).join(','), Array.from( new Set(expected) ).join(','), `Failed: ${o.expr} identifiers (${idents}) === ${expected}`);
  ++passed;
} );

async function testAsync() {
  const asyncContext = context;
  asyncContext.asyncFunc = async function(a, b) {
    return await a + b;
  };
  asyncContext.promiseFunc = function(a, b) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(a + b), 1000);
    })
  }
  const asyncFixtures = fixtures;
  asyncFixtures.push({
    expr: 'asyncFunc(one, two)',
    expected: 3,
  }, {
    expr: 'promiseFunc(one, two)',
    expected: 3,
  });
  for (let o of asyncFixtures) {
    tests++;
    try {
      var val = await expr.compileAsync(o.expr)(asyncContext);
    } catch (e) {
      console.error(`Error: ${o.expr}, expected ${o.expected}`);
      throw e;
    }
    assert.equal(val, o.expected, `Failed: ${o.expr} (${val}) === ${o.expected}`);
    passed++;
  }
}

testAsync().then(() => {
  console.log('%s/%s tests passed.', passed, tests);
})
